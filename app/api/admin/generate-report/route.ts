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

function safeText(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).trim();
}

function compactJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function parseReport(content: string) {
  try {
    return JSON.parse(content);
  } catch {
    return {
      summary: content,
      risks: "Unable to parse structured risks. Review the generated summary.",
      opportunities: "Unable to parse structured opportunities. Review the generated summary.",
      next_actions: "Review this customer manually and regenerate the report.",
      stage: "review_needed",
      customer_mood: "unknown",
      risk_level: "medium",
      recommended_next_action: "Review this customer manually and regenerate the report.",
      pending_tasks: "Review generated summary and update internal next steps.",
    };
  }
}

export async function POST(req: Request) {
  try {
    const { business_profile_id } = await req.json();

    if (!business_profile_id) {
      return NextResponse.json(
        { error: "business_profile_id is required" },
        { status: 400 }
      );
    }

    const { data: businessProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", business_profile_id)
      .maybeSingle();

    if (profileError) {
      console.error("ADMIN REPORT PROFILE FETCH ERROR", profileError);
      return NextResponse.json(
        { error: "Failed to fetch business profile" },
        { status: 500 }
      );
    }

    if (!businessProfile) {
      return NextResponse.json(
        { error: "Business profile not found" },
        { status: 404 }
      );
    }

    const { data: deals, error: dealsError } = await supabase
      .from("customer_deals")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: false });

    if (dealsError) {
      console.error("ADMIN REPORT DEALS FETCH ERROR", dealsError);
    }

    const { data: serviceOrders, error: serviceOrdersError } = await supabase
      .from("service_orders")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: false });

    if (serviceOrdersError) {
      console.error("ADMIN REPORT SERVICE ORDERS FETCH ERROR", serviceOrdersError);
    }

    const { data: campaignReports, error: campaignReportsError } = await supabase
      .from("campaign_reports")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: false });

    if (campaignReportsError) {
      console.error("ADMIN REPORT CAMPAIGN REPORTS FETCH ERROR", campaignReportsError);
    }

    const { data: recommendations, error: recommendationsError } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: false });

    if (recommendationsError) {
      console.error("ADMIN REPORT RECOMMENDATIONS FETCH ERROR", recommendationsError);
    }

    const { data: adminNotes, error: adminNotesError } = await supabase
      .from("admin_notes")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: false });

    if (adminNotesError) {
      console.error("ADMIN REPORT NOTES FETCH ERROR", adminNotesError);
    }

    const { data: adminMessages, error: adminMessagesError } = await supabase
      .from("admin_ai_messages")
      .select("*")
      .eq("business_profile_id", business_profile_id)
      .order("created_at", { ascending: true });

    if (adminMessagesError) {
      console.error("ADMIN REPORT CHAT MESSAGES FETCH ERROR", adminMessagesError);
    }

    let completion;

    try {
      completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "You generate private internal customer intelligence reports for ALYN AI admins. Return only valid JSON with keys: summary, risks, opportunities, next_actions, stage, customer_mood, risk_level, recommended_next_action, pending_tasks. risk_level must be one of: low, medium, high. Use concise, practical business language.",
        },
        {
          role: "user",
          content: `
Create an internal report for this customer.

Business profile:
${compactJson(businessProfile)}

Customer deals:
${compactJson(deals)}

Service orders:
${compactJson(serviceOrders)}

Campaign reports:
${compactJson(campaignReports)}

AI recommendations:
${compactJson(recommendations)}

Admin notes:
${compactJson(adminNotes)}

Admin strategy chat:
${compactJson(adminMessages)}

Required output:
{
  "summary": "summary of business situation",
  "risks": "detected problems and risks",
  "opportunities": "growth opportunities",
  "next_actions": "recommended next actions",
  "stage": "current customer stage",
  "customer_mood": "customer mood",
  "risk_level": "low | medium | high",
  "recommended_next_action": "single best next admin action",
  "pending_tasks": "short internal task list"
}
`,
        },
      ],
      response_format: { type: "json_object" },
      });
    } catch (error) {
      console.error("ADMIN REPORT OPENAI ERROR", error);
      return NextResponse.json(
        { error: "Failed to generate report with OpenAI" },
        { status: 500 }
      );
    }

    const content = completion.choices[0]?.message?.content || "{}";
    const report = parseReport(content);

    const { data: savedReport, error: saveError } = await supabase
      .from("ai_internal_reports")
      .insert({
        business_profile_id,
        user_id: businessProfile.user_id,
        summary: safeText(report.summary),
        risks: safeText(report.risks ?? report.detected_problems),
        opportunities: safeText(report.opportunities),
        next_actions: safeText(report.next_actions),
        stage: safeText(report.stage, "review_needed"),
        customer_mood: safeText(report.customer_mood, "unknown"),
        risk_level: safeText(report.risk_level, "medium"),
        recommended_next_action: safeText(report.recommended_next_action ?? report.next_actions),
        pending_tasks: safeText(report.pending_tasks),
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (saveError) {
      console.error("ADMIN REPORT SAVE ERROR", saveError);
      return NextResponse.json(
        { error: "Failed to save generated report" },
        { status: 500 }
      );
    }

    return NextResponse.json({ report: savedReport });
  } catch (error) {
    console.error("ADMIN GENERATE REPORT ERROR", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
