import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function compactJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function parseAnalysis(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return {
      follow_up_needed: "yes",
      reason: content,
      urgency: "medium",
      recommended_channel: "call",
      recommended_tone: "helpful and direct",
      suggested_admin_action: "Review this analysis and follow up manually.",
      suggested_message: "Use this as internal talking points only. Do not auto-send.",
      customer_personality_read: "Unknown",
      sales_risk: "Needs manual review",
      offer_strategy: "No offer strategy generated.",
    };
  }
}

function formatAnalysisMessage(analysis: Record<string, unknown>) {
  return `Follow-up Intelligence

Follow-up needed: ${analysis.follow_up_needed || "Not set"}
Reason: ${analysis.reason || "Not set"}
Urgency: ${analysis.urgency || "Not set"}
Recommended channel: ${analysis.recommended_channel || "Not set"}
Recommended tone: ${analysis.recommended_tone || "Not set"}
Suggested admin action: ${analysis.suggested_admin_action || "Not set"}
Suggested message or talking points: ${analysis.suggested_message || "Not set"}
Customer personality read: ${analysis.customer_personality_read || "Not set"}
Sales risk: ${analysis.sales_risk || "Not set"}
Offer strategy: ${analysis.offer_strategy || "Not set"}

Internal note: This is an admin alert only. ALYN did not contact the customer and must not auto-send this message.`;
}

export async function POST(req: Request) {
  try {
    const { business_profile_id } = await req.json();

    if (!business_profile_id) {
      console.error("FOLLOW-UP MISSING BUSINESS PROFILE ID");
      return NextResponse.json({ error: "business_profile_id is required" }, { status: 400 });
    }

    const { data: businessProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", business_profile_id)
      .maybeSingle();

    if (profileError) {
      console.error("FOLLOW-UP PROFILE FETCH ERROR", profileError);
      return NextResponse.json({ error: "Failed to fetch business profile" }, { status: 500 });
    }

    if (!businessProfile) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    const contextTables = await Promise.all([
      supabase.from("customer_deals").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(20),
      supabase.from("admin_ai_messages").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: true }).limit(50),
      supabase.from("ai_messages").select("*").eq("user_id", businessProfile.user_id).order("created_at", { ascending: true }).limit(50),
      supabase.from("ai_internal_reports").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("admin_notes").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(20),
      supabase.from("service_orders").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(20),
      supabase.from("ai_recommendations").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(20),
    ]);

    const [
      deals,
      adminMessages,
      customerMessages,
      internalReports,
      adminNotes,
      serviceOrders,
      recommendations,
    ] = contextTables;

    contextTables.forEach((result, index) => {
      if (result.error) {
        console.error(`FOLLOW-UP CONTEXT FETCH ERROR ${index}`, result.error);
      }
    });

    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are ALYN, an internal admin-side follow-up intelligence analyst. You never contact customers, never pretend a customer was contacted, and never generate an outbound action as completed. You only create internal recommendations for a human admin. Return only valid JSON with keys: follow_up_needed, reason, urgency, recommended_channel, recommended_tone, suggested_admin_action, suggested_message, customer_personality_read, sales_risk, offer_strategy. follow_up_needed must be yes or no. urgency must be low, medium, or high. recommended_channel must be one of email, SMS, call, WhatsApp, or meeting.",
          },
          {
            role: "user",
            content: `
Analyze whether this customer needs a human admin follow-up.

Prioritize unpaid, hesitant, inactive, price-sensitive, high-risk, stalled, or confused customers.
Create an internal alert only. Do not write as if the customer has been contacted.

Customer profile:
${compactJson(businessProfile)}

Customer deals and payment status:
${compactJson(deals.data)}

Admin strategy chat archive:
${compactJson(adminMessages.data)}

Customer AI chat archive:
${compactJson(customerMessages.data)}

AI internal reports:
${compactJson(internalReports.data)}

Admin notes:
${compactJson(adminNotes.data)}

Service orders:
${compactJson(serviceOrders.data)}

AI recommendations:
${compactJson(recommendations.data)}
`,
          },
        ],
        response_format: { type: "json_object" },
      });
    } catch (error) {
      console.error("FOLLOW-UP OPENAI ERROR", error);
      return NextResponse.json({ error: "Failed to analyze follow-up need" }, { status: 500 });
    }

    const content = completion.choices[0]?.message?.content || "{}";
    const analysis = parseAnalysis(content);

    const { data: existingConversation, error: conversationFetchError } = await supabase
      .from("admin_ai_conversations")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversationFetchError) {
      console.error("FOLLOW-UP CONVERSATION FETCH ERROR", conversationFetchError);
    }

    let conversation = existingConversation;

    if (!conversation) {
      const { data: createdConversation, error: createConversationError } = await supabase
        .from("admin_ai_conversations")
        .insert({
          business_profile_id,
          user_id: businessProfile.user_id,
        })
        .select("*")
        .single();

      if (createConversationError) {
        console.error("FOLLOW-UP CONVERSATION CREATE ERROR", createConversationError);
        return NextResponse.json({ error: "Failed to create admin conversation" }, { status: 500 });
      }

      conversation = createdConversation;
    }

    if (!conversation?.id) {
      console.error("FOLLOW-UP MISSING CONVERSATION ID", conversation);
      return NextResponse.json({ error: "Missing admin conversation id" }, { status: 500 });
    }

    const { data: assistantMessage, error: messageInsertError } = await supabase
      .from("admin_ai_messages")
      .insert({
        conversation_id: conversation.id,
        business_profile_id,
        user_id: businessProfile.user_id,
        role: "assistant",
        content: formatAnalysisMessage(analysis),
      })
      .select("*")
      .single();

    if (messageInsertError) {
      console.error("FOLLOW-UP ASSISTANT MESSAGE INSERT ERROR", messageInsertError);
      return NextResponse.json({ error: "Failed to save follow-up intelligence" }, { status: 500 });
    }

    const { data: updatedMessages, error: updatedMessagesError } = await supabase
      .from("admin_ai_messages")
      .select("id, role, content")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: true });

    if (updatedMessagesError) {
      console.error("FOLLOW-UP UPDATED MESSAGES FETCH ERROR", updatedMessagesError);
      return NextResponse.json({ error: "Failed to fetch updated admin chat history" }, { status: 500 });
    }

    return NextResponse.json({
      analysis,
      conversation,
      message: assistantMessage,
      messages: updatedMessages ?? [],
    });
  } catch (error) {
    console.error("FOLLOW-UP ANALYSIS ERROR", error);
    return NextResponse.json({ error: "Follow-up analysis failed" }, { status: 500 });
  }
}
