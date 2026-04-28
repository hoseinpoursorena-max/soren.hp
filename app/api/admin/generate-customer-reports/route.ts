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

type GeneratedReports = {
  admin_report?: {
    summary?: string;
    risk_level?: string;
    recommended_next_action?: string;
    execution_health?: string;
    payment_risk?: string;
    follow_up_priority?: string;
    internal_notes?: string;
  };
  customer_report?: {
    title?: string;
    status?: string;
    summary?: string;
    what_was_done?: string;
    current_progress?: string;
    next_steps?: string;
    recommendation?: string;
    platform?: string;
  };
};

function safeText(value: unknown, fallback = "Not provided") {
  if (value === null || value === undefined || value === "") return fallback;
  return String(value).trim();
}

function compactJson(value: unknown) {
  return JSON.stringify(value ?? [], null, 2);
}

function compactTextArray(values: unknown[]) {
  return values
    .flatMap((value) => Array.isArray(value) ? value : [value])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

function toTextArray(value: unknown) {
  if (Array.isArray(value)) {
    return compactTextArray(value);
  }

  return compactTextArray([value]);
}

function parseGeneratedReports(content: string): GeneratedReports {
  try {
    return JSON.parse(content) as GeneratedReports;
  } catch (error) {
    console.error("CUSTOMER REPORT JSON PARSE ERROR", error);
    return {
      admin_report: {
        summary: content,
        risk_level: "medium",
        recommended_next_action: "Review generated report manually.",
        execution_health: "Needs manual review.",
        payment_risk: "Unknown",
        follow_up_priority: "medium",
        internal_notes: "OpenAI returned non-JSON content.",
      },
      customer_report: {
        title: "ALYN Growth Progress Report",
        status: "in_progress",
        summary: "Your growth workspace has been reviewed and progress is being prepared.",
        what_was_done: "ALYN reviewed the available business context and recent execution data.",
        current_progress: "The workspace is active and being prepared for the next execution steps.",
        next_steps: "ALYN will continue organizing priorities and recommended actions.",
        recommendation: "Keep your business profile and goals updated so reports stay accurate.",
        platform: "general",
      },
    };
  }
}

async function fetchCustomerRows(table: string, businessProfileId: string) {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("business_profile_id", businessProfileId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`GENERATE CUSTOMER REPORTS ${table.toUpperCase()} FETCH ERROR`, error);
    return [];
  }

  return data ?? [];
}

export async function POST(req: Request) {
  try {
    const { businessProfileId } = await req.json();

    if (!businessProfileId) {
      console.error("GENERATE CUSTOMER REPORTS MISSING businessProfileId");
      return NextResponse.json(
        { error: "businessProfileId is required" },
        { status: 400 }
      );
    }

    const { data: businessProfile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("id", businessProfileId)
      .maybeSingle();

    if (profileError) {
      console.error("GENERATE CUSTOMER REPORTS PROFILE FETCH ERROR", profileError);
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

    const [
      tasks,
      adminNotes,
      customerDeals,
      serviceOrders,
      serviceReports,
      internalReports,
    ] = await Promise.all([
      fetchCustomerRows("tasks", businessProfileId),
      fetchCustomerRows("admin_notes", businessProfileId),
      fetchCustomerRows("customer_deals", businessProfileId),
      fetchCustomerRows("service_orders", businessProfileId),
      fetchCustomerRows("service_reports", businessProfileId),
      fetchCustomerRows("ai_internal_reports", businessProfileId),
    ]);

    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.35,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You generate two ALYN AI reports from customer context. Return only valid JSON with keys admin_report and customer_report. The admin_report is private and may include risks, payment concerns, follow-up strategy, operational issues, and internal notes. The customer_report is customer-facing, professional, safe, trust-building, and must never include internal notes, admin strategy, price sensitivity labels, sales risk, payment pressure language, or private reasoning.",
          },
          {
            role: "user",
            content: `
Create one internal admin report and one customer-facing service report.

Business profile:
${compactJson(businessProfile)}

Tasks:
${compactJson(tasks)}

Admin notes:
${compactJson(adminNotes)}

Customer deals:
${compactJson(customerDeals)}

Service orders:
${compactJson(serviceOrders)}

Existing customer-visible service reports:
${compactJson(serviceReports)}

Existing internal AI reports:
${compactJson(internalReports)}

Return strict JSON in this exact shape:
{
  "admin_report": {
    "summary": "...",
    "risk_level": "low | medium | high",
    "recommended_next_action": "...",
    "execution_health": "...",
    "payment_risk": "...",
    "follow_up_priority": "...",
    "internal_notes": "..."
  },
  "customer_report": {
    "title": "...",
    "status": "in_progress | completed | pending",
    "summary": "...",
    "what_was_done": "...",
    "current_progress": "...",
    "next_steps": "...",
    "recommendation": "...",
    "platform": "general"
  }
}
`,
          },
        ],
      });
    } catch (error) {
      console.error("GENERATE CUSTOMER REPORTS OPENAI ERROR", error);
      return NextResponse.json(
        { error: "Failed to generate reports with OpenAI" },
        { status: 500 }
      );
    }

    const content = completion.choices[0]?.message?.content || "{}";
    console.log("GENERATE CUSTOMER REPORTS OPENAI RESPONSE", content);
    const generatedReports = parseGeneratedReports(content);
    const adminReport = generatedReports.admin_report ?? {};
    const customerReport = generatedReports.customer_report ?? {};

    const { data: insertedAdminReport, error: adminInsertError } = await supabase
      .from("ai_internal_reports")
      .insert({
        business_profile_id: businessProfileId,
        user_id: businessProfile.user_id,
        summary: safeText(adminReport.summary),
        risks: safeText(adminReport.payment_risk, "No payment risk identified."),
        opportunities: safeText(adminReport.execution_health, "No execution health note provided."),
        next_actions: safeText(adminReport.follow_up_priority, "No follow-up priority provided."),
        stage: safeText(adminReport.execution_health, "review_needed"),
        customer_mood: "unknown",
        risk_level: safeText(adminReport.risk_level, "medium").toLowerCase(),
        recommended_next_action: safeText(adminReport.recommended_next_action),
        pending_tasks: safeText(adminReport.internal_notes, "Review this report and update admin notes if needed."),
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (adminInsertError) {
      console.error("GENERATE CUSTOMER REPORTS ADMIN INSERT ERROR", adminInsertError);
      return NextResponse.json(
        { error: "Failed to save internal admin report" },
        { status: 500 }
      );
    }

    const customerReportPayload = {
      user_id: businessProfile.user_id,
      business_profile_id: businessProfileId,
      report_type: safeText(customerReport.platform, "general"),
      title: safeText(customerReport.title, "Customer Progress Report"),
      summary: compactTextArray([customerReport.summary, customerReport.current_progress]).join("\n\n") || null,
      metrics: {
        status: safeText(customerReport.status, "in_progress"),
        platform: safeText(customerReport.platform, "general"),
      },
      highlights: compactTextArray([
        customerReport.what_was_done,
        customerReport.recommendation,
      ]),
      next_steps: toTextArray(customerReport.next_steps),
      visibility: "customer_visible",
    };

    console.log("CUSTOMER REPORT INSERT PAYLOAD", customerReportPayload);

    const { data: insertedCustomerReport, error: customerReportError } = await supabase
      .from("service_reports")
      .insert(customerReportPayload)
      .select("*")
      .single();

    if (customerReportError) {
      console.error("CUSTOMER REPORT INSERT ERROR", customerReportError);
      return NextResponse.json(
        {
          success: false,
          error: customerReportError.message,
          customerReportError: customerReportError.message,
          adminReport: insertedAdminReport,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      adminReport: insertedAdminReport,
      customerReport: insertedCustomerReport,
    });
  } catch (error) {
    console.error("GENERATE CUSTOMER REPORTS ROUTE ERROR", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate customer reports" },
      { status: 500 }
    );
  }
}
