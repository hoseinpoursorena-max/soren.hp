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

export async function POST(req: Request) {
  try {
    const { business_profile_id, message, admin_message_id } = await req.json();

    if (!business_profile_id) {
      return NextResponse.json({ error: "business_profile_id is required" }, { status: 400 });
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const { data: businessProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", business_profile_id)
      .maybeSingle();

    if (profileError) {
      console.error("ADMIN CHAT PROFILE FETCH ERROR", profileError);
      return NextResponse.json({ error: "Failed to fetch business profile" }, { status: 500 });
    }

    if (!businessProfile) {
      return NextResponse.json({ error: "Business profile not found" }, { status: 404 });
    }

    const contextTables = await Promise.all([
      supabase.from("campaign_reports").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("admin_notes").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("ai_internal_reports").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(5),
      supabase.from("customer_deals").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("service_orders").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(10),
      supabase.from("ai_recommendations").select("*").eq("business_profile_id", business_profile_id).order("created_at", { ascending: false }).limit(10),
    ]);

    const [
      campaignReports,
      adminNotes,
      internalReports,
      deals,
      serviceOrders,
      recommendations,
    ] = contextTables;

    contextTables.forEach((result, index) => {
      if (result.error) {
        console.error(`ADMIN CHAT CONTEXT FETCH ERROR ${index}`, result.error);
      }
    });

    const { data: existingConversation, error: conversationFetchError } = await supabase
      .from("admin_ai_conversations")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conversationFetchError) {
      console.error("ADMIN CHAT CONVERSATION FETCH ERROR", conversationFetchError);
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
        console.error("ADMIN CHAT CONVERSATION CREATE ERROR", createConversationError);
        return NextResponse.json({ error: "Failed to create admin conversation" }, { status: 500 });
      }

      conversation = createdConversation;
    }

    if (!conversation?.id) {
      console.error("ADMIN CHAT MISSING CONVERSATION ID", conversation);
      return NextResponse.json({ error: "Missing admin conversation id" }, { status: 500 });
    }

    let savedAdminMessage = null;

    if (admin_message_id) {
      const { data: existingAdminMessage, error: existingAdminMessageError } = await supabase
        .from("admin_ai_messages")
        .select("id")
        .eq("id", admin_message_id)
        .eq("business_profile_id", business_profile_id)
        .maybeSingle();

      if (existingAdminMessageError) {
        console.error("ADMIN CHAT EXISTING MESSAGE FETCH ERROR", existingAdminMessageError);
      }

      savedAdminMessage = existingAdminMessage;
    }

    if (!savedAdminMessage) {
      const { data: insertedAdminMessage, error: adminMessageError } = await supabase
        .from("admin_ai_messages")
        .insert({
          conversation_id: conversation.id,
          business_profile_id,
          user_id: businessProfile.user_id,
          role: "admin",
          content: message.trim(),
        })
        .select("id")
        .single();

      if (adminMessageError) {
        console.error("ADMIN CHAT MESSAGE INSERT ERROR", adminMessageError);
        return NextResponse.json({ error: "Failed to save admin message" }, { status: 500 });
      }

      savedAdminMessage = insertedAdminMessage;
    }

    const { data: messageHistory, error: messageHistoryError } = await supabase
      .from("admin_ai_messages")
      .select("id, role, content, created_at")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: true });

    if (messageHistoryError) {
      console.error("ADMIN CHAT HISTORY FETCH ERROR", messageHistoryError);
    }

    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are ALYN acting as an internal strategic assistant for an admin/operator. This is not customer-facing. Discuss customer stage, sales strategy, next best action, risks, pricing angle, and what the admin should do next. Never write customer-facing copy unless the admin explicitly asks for it. Be concise, practical, and direct. Remember admin-provided customer traits across the conversation, including price sensitivity, urgency, objections, and relationship context.",
          },
          {
            role: "system",
            content: `
Customer context:
Business profile:
${compactJson(businessProfile)}

Campaign reports:
${compactJson(campaignReports.data)}

Admin notes:
${compactJson(adminNotes.data)}

AI internal reports:
${compactJson(internalReports.data)}

Deals:
${compactJson(deals.data)}

Service orders:
${compactJson(serviceOrders.data)}

Recommendations:
${compactJson(recommendations.data)}

Previous admin strategy conversation:
${compactJson(messageHistory)}
`,
          },
          {
            role: "user",
            content: message.trim(),
          },
        ],
      });
    } catch (error) {
      console.error("ADMIN CHAT OPENAI ERROR", error);
      return NextResponse.json({ error: "Failed to generate ALYN strategy reply" }, { status: 500 });
    }

    const reply = completion.choices[0]?.message?.content || "No response generated.";

    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from("admin_ai_messages")
      .insert({
        conversation_id: conversation.id,
        business_profile_id,
        user_id: businessProfile.user_id,
        role: "assistant",
        content: reply,
      })
      .select("*")
      .single();

    if (assistantMessageError) {
      console.error("ADMIN CHAT ASSISTANT INSERT ERROR", assistantMessageError);
      return NextResponse.json({ error: "Failed to save ALYN reply" }, { status: 500 });
    }

    const { data: updatedMessages, error: updatedMessagesError } = await supabase
      .from("admin_ai_messages")
      .select("id, role, content")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: true });

    if (updatedMessagesError) {
      console.error("ADMIN CHAT UPDATED MESSAGES FETCH ERROR", updatedMessagesError);
      return NextResponse.json({ error: "Failed to fetch updated admin chat history" }, { status: 500 });
    }

    return NextResponse.json({
      conversation,
      reply,
      message: assistantMessage,
      messages: updatedMessages ?? [],
    });
  } catch (error) {
    console.error("ADMIN CUSTOMER CHAT ERROR", error);
    return NextResponse.json({ error: "Admin customer chat failed" }, { status: 500 });
  }
}
