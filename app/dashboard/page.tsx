"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { BrandLogo } from "../BrandLogo";
import {
  BarChart3,
  Bell,
  CircleDollarSign,
  Home,
  ReceiptText,
  Megaphone,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Users,
  Zap
} from "lucide-react";

const sidebarItems = [
  { label: "Overview", value: "overview", icon: Home },
  { label: "Reports", value: "reports", icon: BarChart3 },
  { label: "Billing", value: "billing", icon: ReceiptText },
  { label: "Settings", value: "settings", icon: Settings },
  { label: "Growth Store", href: "/dashboard/store", icon: Zap }
];

const ADMIN_EMAILS = ["hoseinpour.sorena@gmail.com"];

type DashboardTab = "overview" | "reports" | "billing" | "settings";

type BusinessProfile = {
  id: string;
  customer_name?: string | null;
  full_name?: string | null;
  business_name: string | null;
  phone_number?: string | null;
  phone?: string | null;
  industry: string | null;
  location: string | null;
  address_or_area?: string | null;
  instagram_handle?: string | null;
  website_url?: string | null;
  monthly_marketing_budget: string | null;
  main_growth_problem?: string | null;
  preferred_channels?: string[] | null;
  summary_for_dashboard?: string | null;
  onboarding_language?: "en" | "de" | "fa" | string | null;
};

type AiConversation = {
  id: string;
};

type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type GrowthStoreIntent = {
  source: "growth_store";
  serviceName: string;
  category: string;
  description: string;
  benefits: string[];
  pricingText: string;
};

type CampaignReport = {
  id: string;
  platform?: string | null;
  campaign_name?: string | null;
  impressions?: number | string | null;
  clicks?: number | string | null;
  conversions?: number | string | null;
  spend?: number | string | null;
  revenue?: number | string | null;
  report_date?: string | null;
  notes?: string | null;
};

type CustomerDeal = {
  id: string;
  title?: string | null;
  status?: string | null;
  pricing_strategy?: string | null;
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
  paid_at?: string | null;
};

type CustomerUpdate = {
  id: string;
  title?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
};

type ServiceReportType =
  | "website"
  | "ai_agent"
  | "social_media"
  | "content_production"
  | "app_growth"
  | "general";

type ServiceReportGroupKey = "advertising" | ServiceReportType;

type ServiceReport = {
  id: string;
  report_type?: ServiceReportType | string | null;
  title?: string | null;
  report_date?: string | null;
  summary?: string | null;
  highlights?: string[] | string | null;
  next_steps?: string[] | string | null;
  metrics?: Record<string, unknown> | null;
  pages_delivered?: number | string | null;
  status?: string | null;
  speed_score?: number | string | null;
  seo_score?: number | string | null;
  conversion_sections?: number | string | null;
  pending_items?: number | string | null;
  conversations_handled?: number | string | null;
  automation_flows?: number | string | null;
  resolved_requests?: number | string | null;
  handoff_rate?: number | string | null;
  average_response_quality?: number | string | null;
  pending_training_items?: number | string | null;
  posts_published?: number | string | null;
  stories_published?: number | string | null;
  reels_published?: number | string | null;
  engagement_rate?: number | string | null;
  followers_growth?: number | string | null;
  content_calendar_status?: string | null;
  assets_delivered?: number | string | null;
  videos_delivered?: number | string | null;
  photos_delivered?: number | string | null;
  captions_written?: number | string | null;
  approval_status?: string | null;
  pending_revisions?: number | string | null;
  installs?: number | string | null;
  cpi?: number | string | null;
  retention_rate?: number | string | null;
  tracker_status?: string | null;
  test_campaigns?: number | string | null;
  scaling_readiness?: string | null;
};

const reportPlatformFilters = ["All", "Meta", "Google", "TikTok", "Other"] as const;

type ReportPlatform = "Meta" | "Google" | "TikTok" | "Other";
type ReportPlatformFilter = (typeof reportPlatformFilters)[number];
type InsightLevel = "good" | "attention" | "critical";

const toReportNumber = (value: number | string | null | undefined) => {
  const numberValue = Number(value ?? 0);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const formatReportNumber = (value: number) => value.toLocaleString();

const formatMoney = (value: number, currency = "€") => `${currency}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const getReportPlatform = (report: CampaignReport): ReportPlatform => {
  const platform = (report.platform || "Other").toLowerCase();

  if (platform.includes("meta") || platform.includes("facebook") || platform.includes("instagram")) {
    return "Meta";
  }

  if (platform.includes("google") || platform.includes("search")) {
    return "Google";
  }

  if (platform.includes("tiktok")) {
    return "TikTok";
  }

  return "Other";
};

const getReportTotals = (reports: CampaignReport[]) =>
  reports.reduce(
    (acc, report) => {
      acc.impressions += toReportNumber(report.impressions);
      acc.clicks += toReportNumber(report.clicks);
      acc.conversions += toReportNumber(report.conversions);
      acc.spend += toReportNumber(report.spend);
      acc.revenue += toReportNumber(report.revenue);
      return acc;
    },
    { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }
  );

const getConversionRate = (conversions: number, clicks: number) => (clicks > 0 ? (conversions / clicks) * 100 : 0);

const getRoas = (revenue: number, spend: number) => (spend > 0 ? revenue / spend : 0);

const getBarWidth = (value: number, maxValue: number) => {
  if (value <= 0 || maxValue <= 0) {
    return "0%";
  }

  return `${Math.max(8, Math.min(100, (value / maxValue) * 100))}%`;
};

const insightStyles: Record<InsightLevel, { box: string; dot: string; title: string }> = {
  good: {
    box: "border-emerald-300/25 bg-emerald-400/10",
    dot: "bg-emerald-300",
    title: "text-emerald-100"
  },
  attention: {
    box: "border-amber-300/25 bg-amber-400/10",
    dot: "bg-amber-300",
    title: "text-amber-100"
  },
  critical: {
    box: "border-red-300/25 bg-red-400/10",
    dot: "bg-red-300",
    title: "text-red-100"
  }
};

const getReportInsight = (report: CampaignReport): { text: string; level: InsightLevel } => {
  const clicks = toReportNumber(report.clicks);
  const conversions = toReportNumber(report.conversions);
  const spend = toReportNumber(report.spend);
  const revenue = toReportNumber(report.revenue);
  const conversionRate = getConversionRate(conversions, clicks);

  if (conversions === 0) {
    return {
      text: "Your campaign is generating traffic but not converting yet.",
      level: "critical"
    };
  }

  if (spend > revenue) {
    return {
      text: "Your spend is higher than revenue. Funnel optimization is needed.",
      level: "attention"
    };
  }

  if (revenue > spend) {
    return {
      text: "Your campaign is profitable. Consider scaling.",
      level: "good"
    };
  }

  if (clicks >= 100 && conversionRate < 2) {
    return {
      text: "Traffic is strong, but conversion rate is low. Landing page or offer may need improvement.",
      level: "attention"
    };
  }

  return {
    text: "Performance is building. Keep watching the next report cycle.",
    level: "attention"
  };
};

const platformStyles: Record<
  ReportPlatform,
  {
    title: string;
    description: string;
    badge: string;
    border: string;
    glow: string;
    bar: string;
  }
> = {
  Meta: {
    title: "Meta Advertising",
    description: "Social campaigns focused on demand creation, retargeting, and lead flow.",
    badge: "bg-fuchsia-400/10 text-fuchsia-100 border-fuchsia-300/20",
    border: "border-fuchsia-300/20",
    glow: "from-fuchsia-400/16 to-neon/[0.06]",
    bar: "bg-fuchsia-300"
  },
  Google: {
    title: "Google Performance",
    description: "Search and intent-driven campaigns where customers are actively looking.",
    badge: "bg-sky-400/10 text-sky-100 border-sky-300/20",
    border: "border-sky-300/20",
    glow: "from-sky-400/16 to-neon/[0.06]",
    bar: "bg-sky-300"
  },
  TikTok: {
    title: "TikTok Creative",
    description: "Video-led campaigns designed to test creative angles and spark attention.",
    badge: "bg-rose-400/10 text-rose-100 border-rose-300/20",
    border: "border-rose-300/20",
    glow: "from-rose-400/16 to-neon/[0.06]",
    bar: "bg-rose-300"
  },
  Other: {
    title: "Other Channels",
    description: "Additional growth activity tracked across supporting channels and tests.",
    badge: "bg-white/[0.07] text-white/[0.72] border-white/10",
    border: "border-white/10",
    glow: "from-white/[0.08] to-neon/[0.04]",
    bar: "bg-neon"
  }
};

const normalizeServiceReportType = (type: ServiceReport["report_type"]): ServiceReportType => {
  const normalized = String(type || "general").toLowerCase();

  if (
    normalized === "website" ||
    normalized === "ai_agent" ||
    normalized === "social_media" ||
    normalized === "content_production" ||
    normalized === "app_growth"
  ) {
    return normalized;
  }

  return "general";
};

const normalizeServiceReportGroup = (report: ServiceReport): ServiceReportGroupKey => {
  const type = String(report.report_type || "").toLowerCase();
  const platform = String(report.metrics?.platform || "").toLowerCase();
  const title = String(report.title || "").toLowerCase();
  const combined = `${type} ${platform} ${title}`;

  if (
    type === "general" ||
    type === "general_update" ||
    type === "customer_update" ||
    combined.includes("general update") ||
    combined.includes("customer update")
  ) {
    return "general";
  }

  if (
    combined.includes("meta") ||
    combined.includes("google") ||
    combined.includes("advertising") ||
    combined.includes("ads") ||
    combined.includes("campaign")
  ) {
    return "advertising";
  }

  if (combined.includes("website") || combined.includes("landing") || combined.includes("seo")) {
    return "website";
  }

  if (combined.includes("ai_agent") || combined.includes("ai agent") || combined.includes("automation")) {
    return "ai_agent";
  }

  if (combined.includes("social") || combined.includes("instagram") || combined.includes("content calendar")) {
    return "social_media";
  }

  if (combined.includes("content") || combined.includes("creative") || combined.includes("production")) {
    return "content_production";
  }

  if (combined.includes("app") || combined.includes("cpi") || combined.includes("install")) {
    return "app_growth";
  }

  return normalizeServiceReportType(report.report_type);
};

const humanizeReportKey = (key: string) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const listifyReportValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const displayReportValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (Array.isArray(value)) {
    return value.map(String).join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const getServiceMetricValue = (report: ServiceReport, key: keyof ServiceReport) => {
  const directValue = report[key];

  if (directValue !== undefined && directValue !== null && directValue !== "") {
    return directValue;
  }

  return report.metrics?.[String(key)];
};

const getMetricProgress = (value: unknown) => {
  const stringValue = String(value ?? "").toLowerCase();
  const numberValue = toReportNumber(String(value ?? "").replace("%", ""));

  if (stringValue.includes("complete") || stringValue.includes("ready") || stringValue.includes("approved")) {
    return 100;
  }

  if (stringValue.includes("progress") || stringValue.includes("training") || stringValue.includes("review")) {
    return 62;
  }

  if (stringValue.includes("pending") || stringValue.includes("blocked")) {
    return 32;
  }

  if (numberValue > 0) {
    return Math.min(100, numberValue);
  }

  return 0;
};

const getServiceReportInsight = (
  report: ServiceReport,
  reportType: ServiceReportType
): { text: string; level: InsightLevel } => {
  if (reportType === "website") {
    const status = String(getServiceMetricValue(report, "status") ?? "").toLowerCase();
    const seoScore = toReportNumber(getServiceMetricValue(report, "seo_score") as number | string | null | undefined);

    if (status === "in_progress" || status.includes("in progress")) {
      return {
        text: "Your website is currently being optimized for better performance.",
        level: "attention"
      };
    }

    if (seoScore > 0 && seoScore < 80) {
      return {
        text: "SEO improvements are still needed to increase visibility.",
        level: "attention"
      };
    }

    return {
      text: "Your website progress looks healthy. Keep improving speed, SEO, and conversion sections.",
      level: "good"
    };
  }

  if (reportType === "ai_agent") {
    const conversationsHandled = toReportNumber(
      getServiceMetricValue(report, "conversations_handled") as number | string | null | undefined
    );

    if (conversationsHandled < 10) {
      return {
        text: "Your AI agent needs more usage data to improve performance.",
        level: "attention"
      };
    }

    return {
      text: "Your AI agent is collecting useful interaction data and can keep improving from real conversations.",
      level: "good"
    };
  }

  if (reportType === "social_media") {
    const engagementRate = toReportNumber(
      String(getServiceMetricValue(report, "engagement_rate") ?? "").replace("%", "")
    );

    if (engagementRate > 0 && engagementRate < 3) {
      return {
        text: "Content engagement is low. Consider testing new formats.",
        level: "attention"
      };
    }

    return {
      text: "Your social presence is moving. Keep testing formats and watch which posts create real engagement.",
      level: "good"
    };
  }

  if (reportType === "content_production") {
    const pendingRevisions = toReportNumber(
      getServiceMetricValue(report, "pending_revisions") as number | string | null | undefined
    );

    if (pendingRevisions > 0) {
      return {
        text: "A few creative items still need revisions before they are fully ready.",
        level: "attention"
      };
    }

    return {
      text: "Content delivery is moving well. Approved assets can now support stronger campaign execution.",
      level: "good"
    };
  }

  if (reportType === "app_growth") {
    const retentionRate = toReportNumber(
      String(getServiceMetricValue(report, "retention_rate") ?? "").replace("%", "")
    );

    if (retentionRate > 0 && retentionRate < 20) {
      return {
        text: "Retention needs attention before scaling app growth campaigns.",
        level: "critical"
      };
    }

    return {
      text: "App growth signals are being tracked. Use the next test cycle to validate scale readiness.",
      level: "good"
    };
  }

  return {
    text: "This service update shows the latest progress and next actions for your growth system.",
    level: "attention"
  };
};

const serviceReportStyles: Record<
  ServiceReportGroupKey,
  {
    label: string;
    title: string;
    description: string;
    badge: string;
    border: string;
    glow: string;
    bar: string;
    metrics: { key: keyof ServiceReport; label: string; progress?: boolean }[];
  }
> = {
  advertising: {
    label: "Advertising",
    title: "Advertising Reports",
    description: "Campaign updates, paid channel progress, and performance recommendations.",
    badge: "border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-100",
    border: "border-fuchsia-300/20",
    glow: "from-fuchsia-400/14 to-neon/[0.05]",
    bar: "bg-fuchsia-300",
    metrics: []
  },
  website: {
    label: "Website",
    title: "Website Reports",
    description: "Delivery progress, site quality, SEO readiness, and conversion sections.",
    badge: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
    border: "border-cyan-300/20",
    glow: "from-cyan-400/14 to-neon/[0.05]",
    bar: "bg-cyan-300",
    metrics: [
      { key: "pages_delivered", label: "Pages delivered" },
      { key: "status", label: "Status", progress: true },
      { key: "speed_score", label: "Speed score", progress: true },
      { key: "seo_score", label: "SEO score", progress: true },
      { key: "conversion_sections", label: "Conversion sections" },
      { key: "pending_items", label: "Pending items" }
    ]
  },
  ai_agent: {
    label: "AI Agent",
    title: "AI Agent Reports",
    description: "Automation activity, request handling, handoffs, and training progress.",
    badge: "border-violet-300/20 bg-violet-400/10 text-violet-100",
    border: "border-violet-300/20",
    glow: "from-violet-400/14 to-neon/[0.05]",
    bar: "bg-violet-300",
    metrics: [
      { key: "conversations_handled", label: "Conversations handled" },
      { key: "automation_flows", label: "Automation flows" },
      { key: "resolved_requests", label: "Resolved requests" },
      { key: "handoff_rate", label: "Handoff rate", progress: true },
      { key: "average_response_quality", label: "Response quality", progress: true },
      { key: "pending_training_items", label: "Pending training items" }
    ]
  },
  social_media: {
    label: "Social Media",
    title: "Social Media Reports",
    description: "Publishing output, engagement signals, audience growth, and calendar status.",
    badge: "border-pink-300/20 bg-pink-400/10 text-pink-100",
    border: "border-pink-300/20",
    glow: "from-pink-400/14 to-neon/[0.05]",
    bar: "bg-pink-300",
    metrics: [
      { key: "posts_published", label: "Posts published" },
      { key: "stories_published", label: "Stories published" },
      { key: "reels_published", label: "Reels published" },
      { key: "engagement_rate", label: "Engagement rate", progress: true },
      { key: "followers_growth", label: "Follower growth" },
      { key: "content_calendar_status", label: "Calendar status", progress: true }
    ]
  },
  content_production: {
    label: "Content Production",
    title: "Content Production Reports",
    description: "Creative output, approvals, revision work, and delivery momentum.",
    badge: "border-amber-300/20 bg-amber-400/10 text-amber-100",
    border: "border-amber-300/20",
    glow: "from-amber-400/14 to-neon/[0.05]",
    bar: "bg-amber-300",
    metrics: [
      { key: "assets_delivered", label: "Assets delivered" },
      { key: "videos_delivered", label: "Videos delivered" },
      { key: "photos_delivered", label: "Photos delivered" },
      { key: "captions_written", label: "Captions written" },
      { key: "approval_status", label: "Approval status", progress: true },
      { key: "pending_revisions", label: "Pending revisions" }
    ]
  },
  app_growth: {
    label: "App Growth",
    title: "App Growth Reports",
    description: "Install performance, campaign testing, retention, and scale readiness.",
    badge: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    border: "border-emerald-300/20",
    glow: "from-emerald-400/14 to-neon/[0.05]",
    bar: "bg-emerald-300",
    metrics: [
      { key: "installs", label: "Installs" },
      { key: "cpi", label: "CPI" },
      { key: "retention_rate", label: "Retention rate", progress: true },
      { key: "tracker_status", label: "Tracker status", progress: true },
      { key: "test_campaigns", label: "Test campaigns" },
      { key: "scaling_readiness", label: "Scaling readiness", progress: true }
    ]
  },
  general: {
    label: "General Update",
    title: "General Update Reports",
    description: "Service progress, important highlights, and recommended next steps.",
    badge: "border-white/10 bg-white/[0.07] text-white/[0.72]",
    border: "border-white/10",
    glow: "from-white/[0.08] to-neon/[0.04]",
    bar: "bg-neon",
    metrics: []
  }
};

const isDealPaid = (deal: CustomerDeal) => String(deal.payment_status || "").toLowerCase() === "paid";

function getDashboardWelcomeMessage(profile: BusinessProfile) {
  const businessName = profile.business_name || (
    profile.onboarding_language === "fa"
      ? "کسب‌وکارت"
      : profile.onboarding_language === "de"
        ? "dein Unternehmen"
        : "your business"
  );
  const industry = profile.industry || (
    profile.onboarding_language === "fa"
      ? "حوزه کاری تو"
      : profile.onboarding_language === "de"
        ? "deine Branche"
        : "your industry"
  );
  const location = profile.location || (
    profile.onboarding_language === "fa"
      ? "بازار هدف تو"
      : profile.onboarding_language === "de"
        ? "deinem Markt"
        : "your market"
  );
  const growthProblem = profile.main_growth_problem || (
    profile.onboarding_language === "fa"
      ? "جذب مشتری بیشتر به شکل قابل پیش‌بینی"
      : profile.onboarding_language === "de"
        ? "planbar mehr Kunden zu gewinnen"
        : "getting more customers predictably"
  );
  const area = profile.address_or_area ? ` / ${profile.address_or_area}` : "";
  const summary = profile.summary_for_dashboard;

  if (profile.onboarding_language === "fa") {
    return `خوش آمدی. حالا که وارد داشبورد شدی، من یک تصویر اولیه از کسب‌وکارت دارم: ${businessName} در حوزه ${industry} در ${location}${area}، با تمرکز روی ${growthProblem}.\n\n${summary || "از اینجا به بعد، کار ما این است که این شناخت اولیه را تبدیل کنیم به مسیر اجرایی، پیشنهاد مناسب، و قدم‌های بعدی برای رشد."}\n\nبرای شروع، دوست داری اول روی جذب مشتری جدید تمرکز کنیم یا روی بهتر تبدیل کردن کسانی که همین حالا با تو آشنا می‌شوند؟`;
  }

  if (profile.onboarding_language === "de") {
    return `Willkommen. Jetzt bist du in deinem ALYN Growth Workspace, und ich habe ein erstes Bild: ${businessName} arbeitet in ${industry} in ${location}${area}. Der wichtigste Wachstumspunkt ist aktuell: ${growthProblem}.\n\n${summary || "Ab hier verwandeln wir diese erste Klarheit in einen konkreten Ausführungsweg, passende Empfehlungen und die nächsten Schritte für Wachstum."}\n\nWomit sollen wir zuerst starten: mehr neue Kunden gewinnen oder die bestehenden Anfragen besser in Kunden verwandeln?`;
  }

  return `Welcome. Now that you’re inside your ALYN Growth Workspace, I have an initial picture: ${businessName} works in ${industry} in ${location}${area}, with the main focus on ${growthProblem}.\n\n${summary || "From here, we turn that first understanding into an execution path, the right recommendation, and the next practical growth steps."}\n\nTo start, should we focus first on getting more new customers or converting the people who already discover you?`;
}

function getGrowthStoreHookMessage(profile: BusinessProfile, intent: GrowthStoreIntent) {
  const businessName = profile.business_name || "your business";
  const industry = profile.industry || "your market";
  const growthProblem = profile.main_growth_problem || "getting more customers";

  if (profile.onboarding_language === "fa") {
    if (intent.category.toLowerCase().includes("website")) {
      return `انتخاب خوبی است. برای ${businessName} در حوزه ${industry}، وب‌سایت فقط یک صفحه نیست؛ جایی است که توجه باید تبدیل به اعتماد و اقدام شود. با توجه به اینکه مسئله اصلی فعلی تو ${growthProblem} است، این سرویس می‌تواند نقش مهمی در واضح‌تر کردن پیشنهادت و تبدیل بازدیدکننده به مشتری داشته باشد.\n\nدوست داری اول با هم مشخص کنیم لندینگ‌پیج برایت منطقی‌تر است یا یک وب‌سایت کامل‌تر؟`;
    }

    if (intent.category.toLowerCase().includes("ads")) {
      return `انتخاب هوشمندانه‌ای است. تبلیغات می‌تواند برای ${businessName} سرعت بسازد، اما فقط وقتی که پیشنهاد، مخاطب، و پیام درست کنار هم قرار بگیرند. با توجه به شرایط فعلی کسب‌وکارت و چالش ${growthProblem}، بهتر است قبل از هزینه‌کرد، مسیر امن‌تر را مشخص کنیم.\n\nدوست داری اول بررسی کنیم شروع با متا منطقی‌تر است، گوگل، یا یک کمپین تست کوچک‌تر؟`;
    }

    return `انتخاب خوبی است. ${intent.serviceName} می‌تواند برای ${businessName} دقیقاً جایی اثر بگذارد که الآن رشدت کند شده: ${growthProblem}. این فقط درباره اجرای یک سرویس نیست؛ درباره این است که این بخش از سیستم رشدت شفاف‌تر و موثرتر شود.\n\nدوست داری اول بررسی کنیم این سرویس باید با چه هدف و چه اولویتی برای کسب‌وکارت شروع شود؟`;
  }

  if (profile.onboarding_language === "de") {
    if (intent.category.toLowerCase().includes("website")) {
      return `Gute Wahl. Für ${businessName} im Bereich ${industry} ist Website-Arbeit mehr als nur eine Seite. Sie ist der Ort, an dem Aufmerksamkeit zu Vertrauen und Handlung werden sollte. Mit deinem aktuellen Wachstumsfokus auf ${growthProblem} kann dieser Service viel bewegen.\n\nSollen wir zuerst klären, ob für dich eher eine Landingpage oder eine umfassendere Website sinnvoll ist?`;
    }

    if (intent.category.toLowerCase().includes("ads")) {
      return `Starke Richtung. Ads können für ${businessName} Tempo aufbauen, aber nur dann, wenn Angebot, Zielgruppe und Botschaft sauber zusammenpassen. Mit deinem aktuellen Schwerpunkt auf ${growthProblem} würde ich zuerst den sichersten Einstieg definieren, bevor Budget verbrannt wird.\n\nSollen wir zuerst herausfinden, ob Meta, Google oder ein kleiner Test-Start für dich am meisten Sinn ergibt?`;
    }

    return `Gute Wahl. ${intent.serviceName} kann für ${businessName} genau dort ansetzen, wo dein Wachstum gerade stockt: ${growthProblem}. Es geht hier nicht nur um einen Service, sondern darum, diesen Teil deines Wachstumssystems klarer und wirksamer zu machen.\n\nSollen wir zuerst festlegen, welches Ergebnis dieser Service für dein Geschäft am dringendsten liefern sollte?`;
  }

  if (intent.category.toLowerCase().includes("website")) {
    return `Good choice. Website work is usually where attention turns into actual action. For ${businessName} in ${industry}, this should do more than look polished. It should help people understand you, trust you, and know what to do next. With your current focus on ${growthProblem}, this can become a real leverage point.\n\nWant me to help you decide whether a landing page or a fuller website makes more sense first?`;
  }

  if (intent.category.toLowerCase().includes("ads")) {
    return `Nice move. Ads can create speed for ${businessName}, but only when the offer, audience, and creative are clear. Since your main growth pressure right now is ${growthProblem}, I’d rather help you choose the safest first step before turning spend on.\n\nWant me to help you decide whether this should start with Meta, Google, or a smaller test campaign?`;
  }

  return `Good choice. ${intent.serviceName} can help ${businessName} strengthen one of the most important parts of its growth system right now: ${growthProblem}. This is not just about adding a service. It is about making that part of the journey clearer, stronger, and more effective.\n\nWant me to help you figure out the smartest first step for this service in your business?`;
}

const getBillingStatusStyle = (status: string | null | undefined) => {
  const normalizedStatus = String(status || "unpaid").toLowerCase();

  if (normalizedStatus === "paid") {
    return "border-emerald-300/25 bg-emerald-400/10 text-emerald-100";
  }

  if (normalizedStatus === "overdue") {
    return "border-red-300/25 bg-red-400/10 text-red-100";
  }

  if (normalizedStatus === "proposed" || normalizedStatus === "sent") {
    return "border-neon/30 bg-neon/[0.12] text-white";
  }

  return "border-amber-300/25 bg-amber-400/10 text-amber-100";
};

const formatDealAmount = (value: number | string | null | undefined, currency = "EUR") =>
  `${toReportNumber(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${currency}`;

const formatBillingDate = (value: string | null | undefined) => (value ? new Date(value).toLocaleDateString() : "No date");

const isCodeLikeMessage = (content: string) =>
  content.includes("const res = await fetch") || content.includes("fetch('/api/ai'") || content.includes('fetch("/api/ai"');

const sanitizeMessages = (items: AiMessage[]) =>
  items.filter((message) => !isCodeLikeMessage(message.content));

const GROWTH_STORE_INTENT_KEY = "selectedServiceIntent";

const getDashboardStageMessages = (items: AiMessage[]) => {
  const cleanMessages = sanitizeMessages(items);
  const dashboardStartIndex = cleanMessages.findIndex((message) => {
    const content = message.content.toLowerCase();

    return (
      message.role === "assistant" &&
      (content.includes("inside your alyn growth workspace") ||
        content.includes("now that you’re inside") ||
        content.includes("now that you're inside") ||
        content.includes("jetzt bist du in deinem alyn growth workspace") ||
        content.includes("وارد داشبورد"))
    );
  });

  return dashboardStartIndex >= 0 ? cleanMessages.slice(dashboardStartIndex) : [];
};

function FormattedMessage({ content }: { content: string }) {
  const blocks = content.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="mt-2 space-y-3 text-sm leading-6 text-white/[0.72]">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter(Boolean);
        const heading = block.match(/^##\s+(.+)/);
        const isBulletList = lines.every((line) => /^[-*]\s+/.test(line.trim()));

        if (heading) {
          return (
            <h3 key={`${block}-${blockIndex}`} className="text-base font-semibold text-white">
              {heading[1]}
            </h3>
          );
        }

        if (isBulletList) {
          return (
            <ul key={`${block}-${blockIndex}`} className="list-disc space-y-1 pl-5">
              {lines.map((line, lineIndex) => (
                <li key={`${line}-${lineIndex}`}>{line.replace(/^[-*]\s+/, "")}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`${block}-${blockIndex}`}>
            {lines.map((line, lineIndex) => (
              <span key={`${line}-${lineIndex}`}>
                {line}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function Sidebar({ activeTab, onTabChange }: { activeTab: DashboardTab; onTabChange: (tab: DashboardTab) => void }) {
  return (
    <aside className="border-b border-white/10 bg-[#0b0f1a]/75 px-4 py-4 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
      <div className="flex items-center justify-between gap-4 lg:block">
        <Link href="/" className="flex items-center gap-3" aria-label="ALYN AI home">
          <BrandLogo />
        </Link>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200 lg:mt-8 lg:inline-flex">
          Live system
        </span>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-10 lg:flex-col lg:overflow-visible">
        {sidebarItems.map(({ label, icon: Icon, ...item }) => {
          const itemClassName = `flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition ${
            "value" in item && activeTab === item.value
              ? "bg-neon text-white shadow-glow"
              : "border border-white/10 bg-white/[0.045] text-white/[0.62] hover:bg-white/[0.08] hover:text-white"
          }`;

          if ("href" in item && item.href) {
            return (
              <Link key={label} href={item.href} className={itemClassName}>
                <Icon size={18} />
                {label}
              </Link>
            );
          }

          return (
            <button
              key={label}
              onClick={() => onTabChange(item.value as DashboardTab)}
              className={itemClassName}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function Topbar({ businessName, onLogout }: { businessName: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1a]/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:ml-72 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Growth command center</h1>
          {businessName ? <p className="mt-1 text-sm text-white/[0.5]">{businessName}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <button className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white/[0.7] transition hover:bg-white/[0.09] hover:text-white">
            <Bell size={18} />
          </button>
          <button className="flex min-h-11 items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] py-1 pl-2 pr-4 transition hover:bg-white/[0.09]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-neon text-white">
              <User size={16} />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">{businessName || "User"}</span>
          </button>
          <button onClick={onLogout} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

function MetricCards({ reports }: { reports: CampaignReport[] }) {
  const totals = reports.reduce(
    (acc, report) => {
      const clicks = Number(report.clicks ?? 0);
      const conversions = Number(report.conversions ?? 0);
      const revenue = Number(report.revenue ?? 0);
      acc.clicks += Number.isFinite(clicks) ? clicks : 0;
      acc.conversions += Number.isFinite(conversions) ? conversions : 0;
      acc.revenue += Number.isFinite(revenue) ? revenue : 0;
      if (report.campaign_name) acc.campaigns.add(report.campaign_name);
      return acc;
    },
    { clicks: 0, conversions: 0, revenue: 0, campaigns: new Set<string>() }
  );
  const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
  const metrics = [
    { label: "Leads", value: String(totals.conversions), icon: Users },
    { label: "Conversion rate", value: `${conversionRate.toFixed(1)}%`, icon: TrendingUp },
    { label: "Revenue", value: `€${totals.revenue.toLocaleString()}`, icon: CircleDollarSign },
    { label: "Active campaigns", value: String(totals.campaigns.size), icon: Megaphone }
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Icon size={22} />
            </span>
            <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs font-medium text-white/[0.58]">Real data</span>
          </div>
          <p className="text-sm text-white/[0.55]">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
      ))}
    </section>
  );
}

function GeneralUpdateSection({ reports }: { reports: ServiceReport[] }) {
  const reportType: ServiceReportType = "general";
  const style = serviceReportStyles.general;

  return (
    <div className={`overflow-hidden rounded-3xl border ${style.border} bg-white/[0.055] shadow-glass backdrop-blur-xl`}>
      <div className={`bg-gradient-to-br ${style.glow} p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}>
              {style.label}
            </span>
            <h4 className="mt-4 text-2xl font-bold">General Update Reports</h4>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.58]">{style.description}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/[0.62]">
            {reports.length} update{reports.length === 1 ? "" : "s"}
          </div>
        </div>
      </div>

      <div className="grid gap-4 p-5 xl:grid-cols-2">
        {reports.map((report) => {
          const metrics = report.metrics
            ? Object.entries(report.metrics)
                .slice(0, 6)
                .map(([key, value]) => ({
                  label: humanizeReportKey(key),
                  value,
                  progress: typeof value === "number" || String(value).includes("%")
                }))
            : [];
          const highlights = listifyReportValue(report.highlights);
          const nextSteps = listifyReportValue(report.next_steps);
          const insight = getServiceReportInsight(report, reportType);
          const insightStyle = insightStyles[insight.level];

          return (
            <article key={report.id} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h5 className="text-lg font-semibold">{report.title || `${style.label} update`}</h5>
                  <p className="mt-1 text-xs text-white/[0.45]">
                    {report.report_date ? new Date(report.report_date).toLocaleDateString() : "No report date"}
                  </p>
                </div>
                <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}>
                  {style.label}
                </span>
              </div>

              {report.summary ? (
                <p className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/[0.68]">
                  {report.summary}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {metrics.length > 0 ? metrics.map((metric) => {
                  const displayValue = displayReportValue(metric.value);
                  const progress = getMetricProgress(metric.value);

                  return (
                    <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                      <p className="text-xs text-white/[0.42]">{metric.label}</p>
                      <p className="mt-1 font-semibold">{displayValue}</p>
                      {metric.progress ? (
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${progress}%` }} />
                        </div>
                      ) : null}
                    </div>
                  );
                }) : (
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                    <p className="text-xs text-white/[0.42]">Status</p>
                    <p className="mt-1 font-semibold">Update in progress</p>
                  </div>
                )}
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Highlights</p>
                  {highlights.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/[0.68]">
                      {highlights.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-white/[0.5]">No highlights added yet.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Next steps</p>
                  {nextSteps.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm leading-6 text-white/[0.68]">
                      {nextSteps.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.bar}`} />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-white/[0.5]">Next steps will appear here soon.</p>
                  )}
                </div>
              </div>

              <div className={`mt-5 rounded-2xl border p-4 ${insightStyle.box}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${insightStyle.dot}`} />
                  <p className={`text-xs uppercase tracking-[0.18em] ${insightStyle.title}`}>AI Insight</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/[0.76]">{insight.text}</p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [reportPlatformFilter, setReportPlatformFilter] = useState<ReportPlatformFilter>("All");
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [campaignReports, setCampaignReports] = useState<CampaignReport[]>([]);
  const [serviceReports, setServiceReports] = useState<ServiceReport[]>([]);
  const [customerDeals, setCustomerDeals] = useState<CustomerDeal[]>([]);
  const [customerUpdates, setCustomerUpdates] = useState<CustomerUpdate[]>([]);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [aiError, setAiError] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [settingsBusinessName, setSettingsBusinessName] = useState("");
  const [settingsIndustry, setSettingsIndustry] = useState("");
  const [settingsLocation, setSettingsLocation] = useState("");
  const [settingsBudget, setSettingsBudget] = useState("");
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const shouldAutoScrollMessagesRef = useRef(false);
  const aiAssistantSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    const loadDashboard = async () => {
      const { user, error: userError } = await getCurrentUser();

      console.log("CURRENT USER ID:", user?.id);

      if (userError) {
        console.log("SUPABASE ERROR:", userError);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      const userIsAdmin = Boolean(user.email && ADMIN_EMAILS.includes(user.email));
      setIsAdminUser(userIsAdmin);

      if (userIsAdmin) {
        router.push("/admin");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log("FETCHED BUSINESS PROFILE:", profile);

      if (profileError) {
        console.log("SUPABASE ERROR:", profileError);
      }

      if (!profile) {
        router.push("/onboarding");
        return;
      }

      const currentBusinessProfile = profile as BusinessProfile;
      setBusinessProfile(currentBusinessProfile);

      const { data: reports, error: reportsError } = await supabase
        .from("campaign_reports")
        .select("*")
        .eq("business_profile_id", currentBusinessProfile.id)
        .order("report_date", { ascending: false });

      if (reportsError) {
        console.log("CAMPAIGN REPORTS FETCH ERROR:", reportsError);
      } else {
        setCampaignReports((reports ?? []) as CampaignReport[]);
      }

      const { data: serviceReportRows, error: serviceReportsError } = await supabase
        .from("service_reports")
        .select("*")
        .eq("business_profile_id", currentBusinessProfile.id)
        .eq("visibility", "customer_visible")
        .order("report_date", { ascending: false });

      if (serviceReportsError) {
        console.log("SERVICE REPORTS FETCH ERROR:", serviceReportsError);
      } else {
        setServiceReports((serviceReportRows ?? []) as ServiceReport[]);
      }

      const { data: deals, error: dealsError } = await supabase
        .from("customer_deals")
        .select("*")
        .eq("business_profile_id", currentBusinessProfile.id);

      console.log("Deals:", deals);

      if (dealsError) {
        console.log("CUSTOMER DEALS FETCH ERROR:", dealsError);
      } else {
        setCustomerDeals(
          ((deals ?? []) as CustomerDeal[]).sort(
            (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          )
        );
      }

      const { data: updates, error: updatesError } = await supabase
        .from("tasks")
        .select("id, title, completed_at, created_at")
        .eq("business_profile_id", currentBusinessProfile.id)
        .eq("visibility", "customer_visible")
        .eq("status", "done")
        .order("created_at", { ascending: false });

      if (updatesError) {
        console.log("CUSTOMER UPDATES FETCH ERROR:", updatesError);
      } else {
        setCustomerUpdates((updates ?? []) as CustomerUpdate[]);
      }

      const { data: conversation, error: conversationError } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_profile_id", currentBusinessProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (conversationError) {
        console.log("AI CONVERSATION FETCH ERROR:", conversationError);
      }

      let activeConversation = conversation as AiConversation | null;

      if (!activeConversation) {
        const { data: newConversation, error: newConversationError } = await supabase
          .from("ai_conversations")
          .insert({
            user_id: user.id,
            business_profile_id: currentBusinessProfile.id
          })
          .select("id")
          .single();

        if (newConversationError) {
          console.log("AI CONVERSATION CREATE ERROR:", newConversationError);
          return;
        }

        activeConversation = newConversation as AiConversation;
      }

      setConversationId(activeConversation.id);

      const { data: fetchedMessages, error: messagesError } = await supabase
        .from("ai_messages")
        .select("id, role, content")
        .eq("user_id", user.id)
        .eq("conversation_id", activeConversation.id)
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.log("AI MESSAGES FETCH ERROR:", messagesError);
        return;
      }

      const pendingIntentRaw = window.sessionStorage.getItem(GROWTH_STORE_INTENT_KEY);
      let pendingIntent: GrowthStoreIntent | null = null;

      if (pendingIntentRaw) {
        try {
          pendingIntent = JSON.parse(pendingIntentRaw) as GrowthStoreIntent;
        } catch (error) {
          console.log("AI STORE INTENT PARSE ERROR:", error);
          window.sessionStorage.removeItem(GROWTH_STORE_INTENT_KEY);
        }
      }
      const cleanMessages = getDashboardStageMessages((fetchedMessages ?? []) as AiMessage[]);

      if (pendingIntent) {
        window.sessionStorage.removeItem(GROWTH_STORE_INTENT_KEY);
        const hookMessage = getGrowthStoreHookMessage(currentBusinessProfile, pendingIntent);
        const nextMessages = [...cleanMessages];

        const { data: hookAssistantMessage, error: hookAssistantError } = await supabase
          .from("ai_messages")
          .insert({
            user_id: user.id,
            conversation_id: activeConversation.id,
            role: "assistant",
            content: hookMessage
          })
          .select("id, role, content")
          .single();

        if (hookAssistantError) {
          console.log("AI STORE INTENT MESSAGE INSERT ERROR:", hookAssistantError);
          nextMessages.push({
            id: "growth-store-hook",
            role: "assistant",
            content: hookMessage
          });
        } else {
          nextMessages.push(hookAssistantMessage as AiMessage);
        }

        setActiveTab("overview");
        setMessages(nextMessages);
        shouldAutoScrollMessagesRef.current = true;
        requestAnimationFrame(() => {
          aiAssistantSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
          textareaRef.current?.focus();
        });
        return;
      }

      if (cleanMessages.length === 0) {
        const contextualMessage = getDashboardWelcomeMessage(currentBusinessProfile);

        const { data: welcomeMessage, error: welcomeError } = await supabase
          .from("ai_messages")
          .insert({
            user_id: user.id,
            conversation_id: activeConversation.id,
            role: "assistant",
            content: contextualMessage
          })
          .select("id, role, content")
          .single();

        if (welcomeError) {
          console.log("AI CONTEXT MESSAGE INSERT ERROR:", welcomeError);
          setMessages([
            {
              id: "contextual-welcome",
              role: "assistant",
              content: contextualMessage
            }
          ]);
          return;
        }

        setMessages([welcomeMessage as AiMessage]);
        return;
      }

      setMessages(cleanMessages);
    };

    loadDashboard();
  }, [router]);

  useEffect(() => {
    if (!shouldAutoScrollMessagesRef.current) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (!businessProfile) {
      return;
    }

    setSettingsBusinessName(businessProfile.business_name || "");
    setSettingsIndustry(businessProfile.industry || "");
    setSettingsLocation(businessProfile.location || "");
    setSettingsBudget(businessProfile.monthly_marketing_budget || "");
  }, [businessProfile]);

  useEffect(() => {
    const handleGlobalTyping = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTypingTarget =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLButtonElement ||
        activeElement?.getAttribute("contenteditable") === "true";

      if (
        isTypingTarget ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.key.length !== 1
      ) {
        return;
      }

      event.preventDefault();
      shouldAutoScrollMessagesRef.current = true;
      textareaRef.current?.focus();
      setAssistantInput((current) => `${current}${event.key}`);
    };

    document.addEventListener("keydown", handleGlobalTyping);

    return () => {
      document.removeEventListener("keydown", handleGlobalTyping);
    };
  }, []);

  const businessName = (businessProfile?.business_name ?? "").trim();
  const customerLabel =
    businessProfile?.customer_name ||
    businessProfile?.full_name ||
    businessProfile?.business_name ||
    businessProfile?.phone_number ||
    businessProfile?.phone ||
    "Client";
  const performanceReports = campaignReports;
  const groupedReports = performanceReports.reduce<Record<ReportPlatform, CampaignReport[]>>((acc, report) => {
    const key = getReportPlatform(report);
    acc[key] = [...(acc[key] ?? []), report];
    return acc;
  }, { Meta: [], Google: [], TikTok: [], Other: [] });
  const reportSummary = getReportTotals(performanceReports);
  const averageConversionRate = getConversionRate(reportSummary.conversions, reportSummary.clicks);
  const totalRoas = getRoas(reportSummary.revenue, reportSummary.spend);
  const visibleReportPlatforms =
    reportPlatformFilter === "All"
      ? (["Meta", "Google", "TikTok", "Other"] as ReportPlatform[])
      : [reportPlatformFilter];
  const maxReportSpend = Math.max(...performanceReports.map((report) => toReportNumber(report.spend)), 0);
  const maxReportConversions = Math.max(...performanceReports.map((report) => toReportNumber(report.conversions)), 0);
  const maxReportRevenue = Math.max(...performanceReports.map((report) => toReportNumber(report.revenue)), 0);
  const groupedServiceReports = serviceReports.reduce<Record<ServiceReportGroupKey, ServiceReport[]>>(
    (acc, report) => {
      const type = normalizeServiceReportGroup(report);
      acc[type] = [...acc[type], report];
      return acc;
    },
    { advertising: [], website: [], ai_agent: [], social_media: [], content_production: [], app_growth: [], general: [] }
  );
  const generalUpdateReports = groupedServiceReports.general;
  const serviceDeliveryGroups = (
    ["advertising", "website", "ai_agent", "social_media", "content_production", "app_growth"] as ServiceReportGroupKey[]
  )
    .filter((group) => groupedServiceReports[group].length > 0)
    .map((group) => ({
      key: `service_${group}`,
      reportType: group,
      reports: groupedServiceReports[group],
      style: serviceReportStyles[group]
    }));
  const paidDeals = customerDeals.filter(isDealPaid);
  const openDeals = customerDeals.filter((deal) => !isDealPaid(deal));
  const billingSummary = {
    openAmount: openDeals.reduce((total, deal) => total + toReportNumber(deal.total_amount), 0),
    paidAmount: paidDeals.reduce((total, deal) => total + toReportNumber(deal.total_amount), 0),
    openInvoices: openDeals.length,
    paidInvoices: paidDeals.length
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSaveBusinessProfile = async () => {
    if (!businessProfile) {
      setSettingsError("Business profile not loaded yet.");
      return;
    }

    setIsSavingSettings(true);
    setSettingsSuccess("");
    setSettingsError("");

    const updates = {
      business_name: settingsBusinessName,
      industry: settingsIndustry,
      location: settingsLocation,
      monthly_marketing_budget: settingsBudget
    };

    const { error } = await supabase
      .from("business_profiles")
      .update(updates)
      .eq("id", businessProfile.id);

    if (error) {
      console.log("SETTINGS BUSINESS PROFILE UPDATE ERROR:", error);
      setSettingsError(error.message);
      setIsSavingSettings(false);
      return;
    }

    setBusinessProfile({
      ...businessProfile,
      ...updates
    });
    setSettingsSuccess("Saved successfully");
    setIsSavingSettings(false);
  };

  const handleAskAlyn = async () => {
    if (isAsking) {
      return;
    }

    const content = assistantInput.trim();

    if (!content) {
      return;
    }

    if (isCodeLikeMessage(content)) {
      setAiError("Please ask ALYN in plain language instead of sending code.");
      return;
    }

    setAiError("");
    setIsAsking(true);
    shouldAutoScrollMessagesRef.current = true;
    setAssistantInput("");
    setMessages((currentMessages) => [
      ...currentMessages,
      {
        id: `optimistic-user-${Date.now()}`,
        role: "user",
        content
      }
    ]);
    textareaRef.current?.focus();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError) {
      console.log("AI CURRENT USER ERROR:", userError);
    }

    if (!user) {
      setIsAsking(false);
      router.push("/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (profileError) {
      console.log("AI BUSINESS PROFILE FETCH ERROR:", profileError);
    }

    if (!profile) {
      setIsAsking(false);
      router.push("/onboarding");
      return;
    }

    const latestProfile = profile as BusinessProfile;
    setBusinessProfile(latestProfile);

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const { data: existingConversation, error: existingConversationError } = await supabase
        .from("ai_conversations")
        .select("id")
        .eq("user_id", user.id)
        .eq("business_profile_id", latestProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingConversationError) {
        console.log("AI CONVERSATION FETCH ERROR:", existingConversationError);
      }

      if (existingConversation) {
        activeConversationId = (existingConversation as AiConversation).id;
      } else {
        const { data: createdConversation, error: createConversationError } = await supabase
          .from("ai_conversations")
          .insert({
            user_id: user.id,
            business_profile_id: latestProfile.id
          })
          .select("id")
          .single();

        if (createConversationError) {
          console.log("AI CONVERSATION INSERT ERROR:", createConversationError);
          setIsAsking(false);
          return;
        }

        activeConversationId = (createdConversation as AiConversation).id;
      }

      setConversationId(activeConversationId);
    }

    const { error: userMessageError } = await supabase.from("ai_messages").insert({
      user_id: user.id,
      conversation_id: activeConversationId,
      role: "user",
      content
    });

    if (userMessageError) {
      console.log("AI USER MESSAGE INSERT ERROR:", userMessageError);
      setIsAsking(false);
      return;
    }

    let reply = "";

    try {
      setIsThinking(true);
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          userId: user.id
        })
      });
      const data = await response.json();

      console.log("AI API RESPONSE", data);

      if (!response.ok) {
        throw new Error(data?.error ?? response.statusText);
      }

      if (!data?.reply) {
        throw new Error("Missing AI reply");
      }

      reply = data.reply;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAiError(message);
      setIsThinking(false);
      setIsAsking(false);
      return;
    }
    setIsThinking(false);

    const { data: assistantMessage, error: assistantMessageError } = await supabase
      .from("ai_messages")
      .insert({
        user_id: user.id,
        conversation_id: activeConversationId,
        role: "assistant",
        content: reply
      })
      .select("id, role, content")
      .single();

    if (assistantMessageError) {
      console.log("AI ASSISTANT MESSAGE INSERT ERROR:", assistantMessageError);
      setIsAsking(false);
      return;
    }

    const typedAssistantMessage = assistantMessage as AiMessage;
    const { data: fetchedMessages, error: messagesError } = await supabase
      .from("ai_messages")
      .select("id, role, content")
      .eq("user_id", user.id)
      .eq("conversation_id", activeConversationId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.log("AI MESSAGES FETCH ERROR:", messagesError);
      setIsAsking(false);
      return;
    }

    const nextMessages = getDashboardStageMessages((fetchedMessages ?? []) as AiMessage[]);
    setMessages(
      nextMessages.map((message) =>
        message.id === typedAssistantMessage.id ? { ...message, content: "" } : message
      )
    );
    textareaRef.current?.focus();

    let index = 0;
    const typingInterval = window.setInterval(() => {
      index += 2;
      const visibleReply = reply.slice(0, index);

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === typedAssistantMessage.id ? { ...message, content: visibleReply } : message
        )
      );

      if (index >= reply.length) {
        window.clearInterval(typingInterval);
        setIsAsking(false);
      }
    }, 18);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <Topbar businessName={businessName} onLogout={handleLogout} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:ml-72 lg:px-8">
        {activeTab === "overview" ? (
          <>
            <MetricCards reports={campaignReports} />
            <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <p className="text-sm text-white/[0.55]">Business profile</p>
              <p className="mt-2 text-2xl font-bold">{businessProfile?.business_name}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <p className="text-sm text-white/[0.55]">Industry: {businessProfile?.industry || "Not set"}</p>
                <p className="text-sm text-white/[0.55]">Location: {businessProfile?.location || "Not set"}</p>
                <p className="text-sm text-white/[0.55]">Budget: {businessProfile?.monthly_marketing_budget || "Not set"}</p>
              </div>
            </section>
            <section ref={aiAssistantSectionRef} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <h2 className="text-xl font-semibold">AI Growth Assistant</h2>
              <div className="mt-5 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {messages.map((message) => (
                  <div key={message.id} className={`rounded-2xl border p-4 ${message.role === "user" ? "border-neon/30 bg-neon/[0.12]" : "border-white/10 bg-white/[0.045]"}`}>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/[0.4]">{message.role === "user" ? customerLabel : "ALYN"}</p>
                    <FormattedMessage content={message.content} />
                  </div>
                ))}
                {isThinking ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-sm text-white/[0.62]">ALYN is thinking...</p>
                  </div>
                ) : null}
                {aiError ? (
                  <div className="rounded-2xl border border-red-400/25 bg-red-400/10 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.2em] text-red-100/70">error</p>
                    <p className="mt-2 text-sm leading-6 text-red-100">{aiError}</p>
                  </div>
                ) : null}
                <div ref={messagesEndRef} />
              </div>
              <textarea
                ref={textareaRef}
                value={assistantInput}
                onChange={(event) => setAssistantInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleAskAlyn();
                  }
                }}
                placeholder="Tell ALYN what is blocking your growth..."
                className="mt-5 min-h-28 w-full rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm text-white outline-none placeholder:text-white/[0.38] focus:border-neon/60"
              />
              <button onClick={handleAskAlyn} disabled={isAsking} className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
                {isAsking ? "Asking ALYN..." : "Ask ALYN"}
              </button>
            </section>
            <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <h2 className="text-xl font-semibold">Customer Notes / Updates</h2>
              <div className="mt-4 space-y-3">
                {customerUpdates.length > 0 ? customerUpdates.map((update) => (
                  <div key={update.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="text-sm font-semibold">{update.title || "Completed update"}</p>
                    <p className="mt-1 text-xs text-white/[0.45]">{update.completed_at || update.created_at ? new Date(update.completed_at || update.created_at || "").toLocaleDateString() : "No date"}</p>
                  </div>
                )) : <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">No updates yet.</p>}
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "reports" ? (
          <section className="flex flex-col gap-6">
            {/* Render order is intentionally fixed: General Update → Performance → Delivery → Service tiles. */}
            {performanceReports.length === 0 && serviceReports.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-8 text-center shadow-glass backdrop-blur-xl">
                <p className="text-sm text-white/[0.58]">Reports will appear here once your campaigns start running.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {generalUpdateReports.length > 0 && (
                  <GeneralUpdateSection reports={generalUpdateReports} />
                )}

                <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-neon">Reports</p>
                      <h2 className="mt-2 text-3xl font-bold">Performance Reports</h2>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.58]">
                        Live marketing performance for your active services.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {reportPlatformFilters.map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setReportPlatformFilter(filter)}
                          className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition ${
                            reportPlatformFilter === filter
                              ? "border-neon/60 bg-neon text-white shadow-glow"
                              : "border-white/10 bg-white/[0.045] text-white/[0.62] hover:bg-white/[0.08] hover:text-white"
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {performanceReports.length > 0 ? (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        { label: "Total impressions", value: formatReportNumber(reportSummary.impressions) },
                        { label: "Total clicks", value: formatReportNumber(reportSummary.clicks) },
                        { label: "Total conversions", value: formatReportNumber(reportSummary.conversions) },
                        { label: "Total spend", value: formatMoney(reportSummary.spend) },
                        { label: "Total revenue", value: formatMoney(reportSummary.revenue) },
                        { label: "Average conversion rate", value: `${averageConversionRate.toFixed(1)}%` },
                        ...(reportSummary.spend > 0 ? [{ label: "ROAS", value: `${totalRoas.toFixed(2)}x` }] : [])
                      ].map((metric) => (
                        <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
                          <p className="text-sm text-white/[0.55]">{metric.label}</p>
                          <p className="mt-3 text-2xl font-bold">{metric.value}</p>
                        </div>
                      ))}
                    </div>

                    {visibleReportPlatforms.map((platform) => {
                      const reports = groupedReports[platform];
                      const totals = getReportTotals(reports);
                      const conversionRate = getConversionRate(totals.conversions, totals.clicks);
                      const style = platformStyles[platform];

                      if (reports.length === 0 && reportPlatformFilter === "All") {
                        return null;
                      }

                      if (reports.length === 0) {
                        return (
                          <div key={platform} className="rounded-3xl border border-white/10 bg-white/[0.055] p-8 text-center shadow-glass backdrop-blur-xl">
                            <p className="text-sm text-white/[0.58]">No {platform} reports yet.</p>
                          </div>
                        );
                      }

                      return (
                        <div key={platform} className={`overflow-hidden rounded-3xl border ${style.border} bg-white/[0.055] shadow-glass backdrop-blur-xl`}>
                          <div className={`bg-gradient-to-br ${style.glow} p-5`}>
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}>
                                  {platform}
                                </span>
                                <h3 className="mt-4 text-2xl font-bold">{style.title}</h3>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.58]">{style.description}</p>
                              </div>
                              <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                  <p className="text-xs text-white/[0.45]">Platform spend</p>
                                  <p className="mt-2 text-lg font-bold">{formatMoney(totals.spend)}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                  <p className="text-xs text-white/[0.45]">Conversions</p>
                                  <p className="mt-2 text-lg font-bold">{formatReportNumber(totals.conversions)}</p>
                                </div>
                                <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                  <p className="text-xs text-white/[0.45]">Conversion rate</p>
                                  <p className="mt-2 text-lg font-bold">{conversionRate.toFixed(1)}%</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-4 p-5 xl:grid-cols-2">
                            {reports.map((report) => {
                              const impressions = toReportNumber(report.impressions);
                              const clicks = toReportNumber(report.clicks);
                              const conversions = toReportNumber(report.conversions);
                              const spend = toReportNumber(report.spend);
                              const revenue = toReportNumber(report.revenue);
                              const reportConversionRate = getConversionRate(conversions, clicks);
                              const reportRoas = getRoas(revenue, spend);
                              const insight = getReportInsight(report);
                              const insightStyle = insightStyles[insight.level];

                              return (
                                <article key={report.id} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <h4 className="text-lg font-semibold">{report.campaign_name || "Unnamed campaign"}</h4>
                                      <p className="mt-1 text-xs text-white/[0.45]">
                                        {report.report_date ? new Date(report.report_date).toLocaleDateString() : "No report date"}
                                      </p>
                                    </div>
                                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}>
                                      {report.platform || platform}
                                    </span>
                                  </div>

                                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                                    {[
                                      { label: "Impressions", value: formatReportNumber(impressions) },
                                      { label: "Clicks", value: formatReportNumber(clicks) },
                                      { label: "Conversions", value: formatReportNumber(conversions) },
                                      { label: "Spend", value: formatMoney(spend) },
                                      { label: "Revenue", value: formatMoney(revenue) },
                                      { label: "Conv. rate", value: `${reportConversionRate.toFixed(1)}%` },
                                      { label: "ROAS", value: spend > 0 ? `${reportRoas.toFixed(2)}x` : "0x" }
                                    ].map((item) => (
                                      <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                                        <p className="text-xs text-white/[0.42]">{item.label}</p>
                                        <p className="mt-1 font-semibold">{item.value}</p>
                                      </div>
                                    ))}
                                  </div>

                                  <div className="mt-5 space-y-3">
                                    {[
                                      { label: "Spend", value: spend, max: maxReportSpend, color: "bg-amber-300" },
                                      { label: "Conversions", value: conversions, max: maxReportConversions, color: style.bar },
                                      { label: "Revenue", value: revenue, max: maxReportRevenue, color: "bg-emerald-300" }
                                    ].map((bar) => (
                                      <div key={bar.label}>
                                        <div className="mb-1 flex items-center justify-between text-xs text-white/[0.48]">
                                          <span>{bar.label}</span>
                                          <span>{formatReportNumber(bar.value)}</span>
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
                                          <div className={`h-full rounded-full ${bar.color}`} style={{ width: getBarWidth(bar.value, bar.max) }} />
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <div className={`mt-5 rounded-2xl border p-4 ${insightStyle.box}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`h-2.5 w-2.5 rounded-full ${insightStyle.dot}`} />
                                      <p className={`text-xs uppercase tracking-[0.18em] ${insightStyle.title}`}>AI Insight</p>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-white/[0.76]">{insight.text}</p>
                                  </div>

                                  {report.notes ? (
                                    <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-white/[0.58]">
                                      {report.notes}
                                    </p>
                                  ) : null}
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : null}

                {serviceDeliveryGroups.length > 0 ? (
                  <>
                    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
                      <p className="text-xs uppercase tracking-[0.24em] text-neon">Service updates</p>
                      <h3 className="mt-2 text-2xl font-bold">Delivery Reports</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.58]">
                        Review the services connected to your workspace and the latest progress.
                      </p>
                    </section>

                    <div className="flex flex-col gap-6">
                      {serviceDeliveryGroups.map(({ reportType, reports, style }) => {
                      const latestReport = reports[0];

                      return (
                        <div
                          key={reportType}
                          className={`overflow-hidden rounded-3xl border ${style.border} bg-white/[0.055] shadow-glass backdrop-blur-xl`}
                        >
                          <div className={`bg-gradient-to-br ${style.glow} p-5`}>
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}>
                                  {style.label}
                                </span>
                                <h4 className="mt-4 text-2xl font-bold">{style.title}</h4>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.58]">{style.description}</p>
                                <p className="mt-3 text-xs text-white/[0.45]">
                                  Latest update: {latestReport?.report_date ? new Date(latestReport.report_date).toLocaleDateString() : "No report date"}
                                </p>
                              </div>
                              <div className="flex shrink-0 flex-col gap-3">
                                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/[0.62]">
                                  {reports.length} update{reports.length === 1 ? "" : "s"}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-4 p-5 xl:grid-cols-2">
                            {reports.map((report) => {
                              const insightReportType: ServiceReportType = reportType === "advertising" ? "general" : reportType;
                              const metrics =
                                style.metrics.length === 0 && report.metrics
                                  ? Object.entries(report.metrics)
                                      .slice(0, 6)
                                      .map(([key, value]) => ({
                                        label: humanizeReportKey(key),
                                        value,
                                        progress: typeof value === "number" || String(value).includes("%")
                                      }))
                                  : style.metrics.map((metric) => ({
                                      label: metric.label,
                                      value: getServiceMetricValue(report, metric.key),
                                      progress: metric.progress
                                    }));
                              const highlights = listifyReportValue(report.highlights);
                              const nextSteps = listifyReportValue(report.next_steps);
                              const insight = getServiceReportInsight(report, insightReportType);
                              const insightStyle = insightStyles[insight.level];

                              return (
                                <article key={report.id} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <h5 className="text-lg font-semibold">{report.title || `${style.label} update`}</h5>
                                      <p className="mt-1 text-xs text-white/[0.45]">
                                        {report.report_date ? new Date(report.report_date).toLocaleDateString() : "No report date"}
                                      </p>
                                    </div>
                                    <span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${style.badge}`}>
                                      {style.label}
                                    </span>
                                  </div>

                                  {report.summary ? (
                                    <p className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/[0.68]">
                                      {report.summary}
                                    </p>
                                  ) : null}

                                  <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {metrics.length > 0 ? metrics.map((metric) => {
                                      const displayValue = displayReportValue(metric.value);
                                      const progress = getMetricProgress(metric.value);

                                      return (
                                        <div key={metric.label} className="rounded-2xl border border-white/10 bg-black/10 p-3">
                                          <p className="text-xs text-white/[0.42]">{metric.label}</p>
                                          <p className="mt-1 font-semibold">{displayValue}</p>
                                          {metric.progress ? (
                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                                              <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${progress}%` }} />
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    }) : (
                                      <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
                                        <p className="text-xs text-white/[0.42]">Status</p>
                                        <p className="mt-1 font-semibold">Update in progress</p>
                                      </div>
                                    )}
                                  </div>

                                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                      <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Highlights</p>
                                      {highlights.length > 0 ? (
                                        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/[0.68]">
                                          {highlights.map((item) => (
                                            <li key={item} className="flex gap-2">
                                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon" />
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="mt-3 text-sm text-white/[0.5]">No highlights added yet.</p>
                                      )}
                                    </div>

                                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
                                      <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Next steps</p>
                                      {nextSteps.length > 0 ? (
                                        <ul className="mt-3 space-y-2 text-sm leading-6 text-white/[0.68]">
                                          {nextSteps.map((item) => (
                                            <li key={item} className="flex gap-2">
                                              <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${style.bar}`} />
                                              <span>{item}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      ) : (
                                        <p className="mt-3 text-sm text-white/[0.5]">Next steps will appear here soon.</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className={`mt-5 rounded-2xl border p-4 ${insightStyle.box}`}>
                                    <div className="flex items-center gap-2">
                                      <span className={`h-2.5 w-2.5 rounded-full ${insightStyle.dot}`} />
                                      <p className={`text-xs uppercase tracking-[0.18em] ${insightStyle.title}`}>AI Insight</p>
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-white/[0.76]">{insight.text}</p>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </div>
                      );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        {activeTab === "billing" ? (
          <section className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-neon">Billing</p>
              <h2 className="mt-2 text-3xl font-bold">Billing & Payments</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.58]">
                Your invoices, offers, and payment history in one place.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Open amount", value: formatDealAmount(billingSummary.openAmount), tone: "text-amber-100" },
                { label: "Paid amount", value: formatDealAmount(billingSummary.paidAmount), tone: "text-emerald-100" },
                { label: "Open invoices", value: String(billingSummary.openInvoices), tone: "text-white" },
                { label: "Paid invoices", value: String(billingSummary.paidInvoices), tone: "text-white" }
              ].map((metric) => (
                <div key={metric.label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
                  <p className="text-sm text-white/[0.55]">{metric.label}</p>
                  <p className={`mt-3 text-2xl font-bold ${metric.tone}`}>{metric.value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-2xl font-bold">Invoices & Offers</h3>
                  <p className="mt-2 text-sm text-white/[0.55]">Customer-specific billing items connected to your ALYN workspace.</p>
                </div>
                <span className="w-fit rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-semibold text-white/[0.58]">
                  {customerDeals.length} item{customerDeals.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-5 grid gap-4">
                {customerDeals.length > 0 ? customerDeals.map((deal) => {
                  const currency = deal.currency || "EUR";
                  const paymentStatus = deal.payment_status || "unpaid";
                  const dealStatus = deal.status || "proposed";

                  return (
                    <article key={deal.id} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap gap-2">
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBillingStatusStyle(paymentStatus)}`}>
                              {paymentStatus}
                            </span>
                            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBillingStatusStyle(dealStatus)}`}>
                              {dealStatus}
                            </span>
                          </div>
                          <h4 className="mt-4 text-xl font-bold">{deal.title || "Untitled invoice"}</h4>
                          <p className="mt-2 text-sm leading-6 text-white/[0.55]">
                            Pricing strategy: {deal.pricing_strategy || "Standard growth plan"}
                          </p>
                          <p className="mt-1 text-xs text-white/[0.42]">Created {formatBillingDate(deal.created_at)}</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/10 p-4 lg:min-w-56">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Total amount</p>
                          <p className="mt-2 text-2xl font-bold">{formatDealAmount(deal.total_amount, currency)}</p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          { label: "Subtotal", value: formatDealAmount(deal.subtotal, currency) },
                          { label: "Discount", value: formatDealAmount(deal.discount_amount, currency) },
                          { label: "Total", value: formatDealAmount(deal.total_amount, currency) },
                          { label: "Payment status", value: paymentStatus }
                        ].map((item) => (
                          <div key={item.label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                            <p className="text-xs text-white/[0.42]">{item.label}</p>
                            <p className="mt-1 font-semibold">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        {isAdminUser ? (
                          <Link href={`/admin/deals/${deal.id}`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.07] px-5 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.1] hover:text-white">
                            View details
                          </Link>
                        ) : null}
                        <button disabled className="inline-flex min-h-11 items-center justify-center rounded-full bg-neon/[0.45] px-5 text-sm font-semibold text-white/70 shadow-glow disabled:cursor-not-allowed disabled:opacity-70">
                          Payment coming soon
                        </button>
                      </div>
                    </article>
                  );
                }) : (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm text-white/[0.55]">No billing items yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <h3 className="text-2xl font-bold">Payment history</h3>
              <div className="mt-5 grid gap-3">
                {paidDeals.length > 0 ? paidDeals.map((deal) => {
                  const currency = deal.currency || "EUR";

                  return (
                    <div key={deal.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold">{deal.title || "Paid invoice"}</p>
                        <p className="mt-1 text-xs text-white/[0.45]">
                          Paid {formatBillingDate(deal.paid_at || deal.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="font-semibold">{formatDealAmount(deal.total_amount, currency)}</p>
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBillingStatusStyle(deal.payment_status)}`}>
                          {deal.payment_status || "paid"}
                        </span>
                      </div>
                    </div>
                  );
                }) : (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 text-sm text-white/[0.55]">No payments recorded yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <h3 className="text-2xl font-bold">Payment gateway</h3>
              <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">
                Payment gateway integration coming soon.
              </p>
            </div>
          </section>
        ) : null}

        {activeTab === "settings" ? (
          <section className="grid gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.24em] text-neon">Settings</p>
              <h2 className="mt-2 text-3xl font-bold">Workspace settings</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.58]">
                Manage your business profile and account security.
              </p>
            </div>

            {settingsSuccess ? (
              <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
                {settingsSuccess}
              </div>
            ) : null}

            {settingsError ? (
              <div className="rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-semibold text-red-100">
                {settingsError}
              </div>
            ) : null}

            <div className="grid gap-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
                <h3 className="text-2xl font-bold">Business Profile</h3>
                <p className="mt-2 text-sm leading-6 text-white/[0.55]">
                  Keep the context ALYN uses for your dashboard accurate.
                </p>

                <div className="mt-5 grid gap-4">
                  {[
                    { label: "Business name", value: settingsBusinessName, onChange: setSettingsBusinessName },
                    { label: "Industry", value: settingsIndustry, onChange: setSettingsIndustry },
                    { label: "Location", value: settingsLocation, onChange: setSettingsLocation },
                    { label: "Budget", value: settingsBudget, onChange: setSettingsBudget }
                  ].map((field) => (
                    <label key={field.label} className="grid gap-2">
                      <span className="text-sm font-semibold text-white/[0.72]">{field.label}</span>
                      <input
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none placeholder:text-white/[0.36] focus:border-neon/60"
                      />
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleSaveBusinessProfile}
                  disabled={isSavingSettings}
                  className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSavingSettings ? "Saving..." : "Save business profile"}
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
