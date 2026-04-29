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
const SOFT_ONBOARDING_ERROR =
  "I caught that. Please send it once more and we’ll keep going.";

type ExtractedProfile = {
  customer_name?: string | null;
  business_name?: string | null;
  industry?: string | null;
  location?: string | null;
  address_or_area?: string | null;
  instagram_handle?: string | null;
  website_url?: string | null;
  main_growth_problem?: string | null;
  preferred_channels?: string[] | null;
  monthly_marketing_budget?: string | number | null;
  phone_number?: string | null;
  onboarding_language?: "en" | "de" | "fa" | "mixed" | null;
  customer_confidence_level?: "low" | "medium" | "high" | null;
  price_sensitivity?: "low" | "medium" | "high" | null;
  urgency_level?: "low" | "medium" | "high" | null;
  decision_readiness?: "early_research" | "interested" | "ready_to_buy" | null;
  admin_sales_hint?: string | null;
  summary_for_dashboard?: string | null;
  confidence?: "low" | "medium" | "high" | null;
  ready_for_dashboard?: boolean | null;
};

type OnboardingExtraction = Required<
  Pick<ExtractedProfile, "summary_for_dashboard" | "ready_for_dashboard">
> &
  Omit<ExtractedProfile, "summary_for_dashboard" | "ready_for_dashboard">;

type OnboardingState =
  | "opening"
  | "business_discovery"
  | "problem_discovery"
  | "context_enrichment"
  | "contact_capture"
  | "diagnosis"
  | "pre_close"
  | "ready_for_dashboard";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function safeChannels(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
}

function normalizeLevel(value: unknown): "low" | "medium" | "high" | null {
  return value === "low" || value === "medium" || value === "high" ? value : null;
}

function normalizeDecisionReadiness(value: unknown) {
  return value === "early_research" || value === "interested" || value === "ready_to_buy"
    ? value
    : null;
}

function normalizeDigits(value: string) {
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

  return value.replace(/[۰-۹٠-٩]/g, (digit) => {
    const persianIndex = persianDigits.indexOf(digit);

    if (persianIndex >= 0) {
      return String(persianIndex);
    }

    const arabicIndex = arabicDigits.indexOf(digit);
    return arabicIndex >= 0 ? String(arabicIndex) : digit;
  });
}

const budgetContextSignals = [
  "budget",
  "بودجه",
  "هزینه",
  "یورو",
  "euro",
  "€",
  "ماهانه",
  "ماهی",
  "invest",
  "investment",
  "spend",
  "خرج",
  "تبلیغات ماهانه",
];

function hasBudgetContext(value: string) {
  return includesAny(value, budgetContextSignals);
}

function isPhoneLikeNumber(value: string) {
  const normalized = normalizeDigits(value);
  const digitsOnly = normalized.replace(/\D/g, "");

  return (
    digitsOnly.length >= 7 &&
    (normalized.trim().startsWith("+") ||
      digitsOnly.startsWith("00") ||
      digitsOnly.startsWith("01") ||
      digitsOnly.startsWith("09") ||
      digitsOnly.startsWith("0"))
  );
}

function extractMonthlyMarketingBudget(value: unknown, context?: unknown) {
  const valueText = typeof value === "number" ? String(value) : safeString(value);
  const contextText = safeString(context);
  const combinedText = `${valueText} ${contextText}`.trim();

  if (!combinedText || !hasBudgetContext(combinedText)) {
    return null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return isPhoneLikeNumber(String(value)) ? null : value;
  }

  const normalized = normalizeDigits(combinedText);
  const numberPattern = /\d+(?:[.,]\d+)?/g;
  let match: RegExpExecArray | null;

  while ((match = numberPattern.exec(normalized)) !== null) {
    const rawNumber = match[0];
    const start = match.index;
    const contextWindow = normalized.slice(Math.max(0, start - 32), start + rawNumber.length + 32);

    if (!hasBudgetContext(contextWindow) || isPhoneLikeNumber(rawNumber)) {
      continue;
    }

    const parsed = Number(rawNumber.replace(",", "."));

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function extractPhoneNumber(value: unknown) {
  const text = safeString(value);

  if (!text) {
    return null;
  }

  const refusalSignals = [
    "prefer not",
    "don't want",
    "do not want",
    "no phone",
    "no number",
    "not share",
    "شماره نمی",
    "شماره ندارم",
    "بدون شماره",
    "نمیخوام شماره",
    "نمی‌خوام شماره",
    "شماره نمی‌دم",
    "شماره نمی دم",
    "möchte nicht",
    "lieber nicht",
    "keine nummer",
  ];
  const normalizedText = text.toLowerCase();

  if (refusalSignals.some((signal) => normalizedText.includes(signal))) {
    return null;
  }

  const normalized = normalizeDigits(text);
  const phoneMatch = normalized.match(/(?:\+\d{1,3}|00\d{1,3}|0\d{1,4})?[\s().-]*(?:\d[\s().-]*){7,15}/);

  if (!phoneMatch) {
    return null;
  }

  const phoneNumber = phoneMatch[0].trim();
  const digitsOnly = phoneNumber.replace(/\D/g, "");
  const digitCount = digitsOnly.length;

  if (digitCount < 7) {
    return null;
  }

  if (!phoneNumber.startsWith("+") && !digitsOnly.startsWith("00") && !digitsOnly.startsWith("0")) {
    return null;
  }

  return phoneNumber;
}

function extractInstagramHandle(value: unknown) {
  const text = safeString(value);

  if (!text) {
    return null;
  }

  const match = text.match(/(?:instagram\.com\/|@)([a-zA-Z0-9._]{2,30})/);

  return match?.[1] ? `@${match[1]}` : null;
}

function extractWebsiteUrl(value: unknown) {
  const text = safeString(value);

  if (!text) {
    return null;
  }

  const match = text.match(/https?:\/\/[^\s]+|(?:www\.)[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/);

  if (!match?.[0]) {
    return null;
  }

  return match[0].startsWith("http") ? match[0] : `https://${match[0]}`;
}

function includesAny(text: string, signals: string[]) {
  const normalized = text.toLowerCase();

  return signals.some((signal) => normalized.includes(signal));
}

function classifyLastUserMessage(message: unknown) {
  const text = safeString(message);
  const phoneNumber = extractPhoneNumber(text);
  const monthlyMarketingBudget = extractMonthlyMarketingBudget(text, text);
  const budgetRefusal = hasBudgetContext(text) && includesAny(text, [
    "don't know",
    "do not know",
    "not sure",
    "no budget",
    "ندارم",
    "نمی‌دونم",
    "نمیدونم",
    "فعلاً بودجه ندارم",
    "weiß ich nicht",
    "weiss ich nicht",
    "kein budget",
  ]);

  return {
    type: phoneNumber
      ? "phone_number"
      : monthlyMarketingBudget !== null
        ? "budget"
        : budgetRefusal
          ? "budget"
          : classifyBusinessMessage(text),
    phoneNumber,
    monthlyMarketingBudget,
    hasBudgetContext: hasBudgetContext(text),
    budgetRefusal,
  };
}

function classifyBusinessMessage(text: string) {
  if (extractLocationFallback(text)) {
    return "location";
  }

  if (extractInstagramHandle(text) || extractWebsiteUrl(text) || includesAny(text, ["instagram", "اینستاگرام", "website", "سایت", "google", "گوگل"])) {
    return "channel";
  }

  if (includesAny(text, ["name", "اسم", "نام", "heiß", "heiße", "ich bin", "من ", " هستم"])) {
    return "name";
  }

  if (extractIndustryFallback(text) || text.length > 16) {
    return "business_info";
  }

  return "unclear";
}

function getConversationText(messages: { content?: unknown }[]) {
  return messages
    .map((item) => safeString(item.content))
    .filter(Boolean)
    .join("\n");
}

function extractLocationFallback(text: string) {
  const normalized = text.toLowerCase();
  const cityMap = [
    { patterns: ["دویسبورگ", "دويسبورگ", "duisburg"], value: "Duisburg" },
    { patterns: ["اسن", "essen"], value: "Essen" },
    { patterns: ["برلین", "berlin"], value: "Berlin" },
    { patterns: ["دوسلدورف", "düsseldorf", "dusseldorf"], value: "Düsseldorf" },
    { patterns: ["کلن", "köln", "cologne"], value: "Köln" },
    { patterns: ["هامبورگ", "hamburg"], value: "Hamburg" },
    { patterns: ["مونیخ", "munich", "münchen"], value: "München" },
  ];

  return cityMap.find((city) => city.patterns.some((pattern) => normalized.includes(pattern)))?.value || "";
}

function extractIndustryFallback(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("فروشگاه آنلاین") || normalized.includes("online shop") || normalized.includes("ecommerce")) {
    return "فروشگاه آنلاین";
  }

  if (normalized.includes("رستوران") || normalized.includes("restaurant")) {
    return "رستوران";
  }

  if (normalized.includes("کافه") || normalized.includes("cafe") || normalized.includes("café")) {
    return "کافه";
  }

  return "";
}

function createFallbackBusinessName(profile: ExtractedProfile, text: string) {
  const existingName = safeString(profile.business_name);

  if (existingName) {
    return existingName;
  }

  const cafeNameMatch = text.match(/کافه\s+(?!دارم|در|تو|توی|من|یه)([^\s]+)/);
  if (cafeNameMatch?.[1]) {
    return `کافه ${cafeNameMatch[1]}`;
  }

  const restaurantNameMatch = text.match(/رستوران\s+(?!دارم|در|تو|توی|من|یه)([^\s]+)/);
  if (restaurantNameMatch?.[1]) {
    return `رستوران ${restaurantNameMatch[1]}`;
  }

  const industry = safeString(profile.industry) || extractIndustryFallback(text);

  if (industry.includes("کافه")) {
    return "کافه جدید";
  }

  if (industry.includes("رستوران")) {
    return "رستوران جدید";
  }

  if (industry.includes("فروشگاه")) {
    return "فروشگاه آنلاین جدید";
  }

  if (industry.toLowerCase().includes("cafe")) {
    return "New Cafe Business";
  }

  return "New ALYN workspace";
}

function isGenericBusinessName(value: unknown) {
  const name = safeString(value).toLowerCase();

  return (
    !name ||
    name === "new alyn workspace" ||
    name === "new cafe business" ||
    name === "کافه جدید" ||
    name === "رستوران جدید" ||
    name === "فروشگاه آنلاین جدید"
  );
}

function isLocalBusiness(profile: ExtractedProfile) {
  const industry = safeString(profile.industry).toLowerCase();

  return [
    "restaurant",
    "رستوران",
    "cafe",
    "café",
    "کافه",
    "salon",
    "beauty",
    "زیبایی",
    "gym",
    "باشگاه",
    "clinic",
    "کلینیک",
    "barber",
    "آرایشگاه",
  ].some((signal) => industry.includes(signal));
}

function hasPhoneRefusal(text: string) {
  return includesAny(text, [
    "prefer not",
    "rather not",
    "don't want",
    "do not want",
    "not share",
    "no phone",
    "بدون شماره",
    "شماره نمی",
    "نمیخوام شماره",
    "نمی‌خوام شماره",
    "ترجیح میدم ندم",
    "ترجیح می‌دهم ندهم",
    "möchte nicht",
    "lieber nicht",
    "keine nummer",
  ]);
}

function hasUnknownAnswer(text: string) {
  return includesAny(text, [
    "i don't know",
    "i do not know",
    "not sure",
    "نمی‌دونم",
    "نمیدونم",
    "نمی دانم",
    "weiß ich nicht",
    "weiss ich nicht",
    "keine ahnung",
  ]);
}

function hasAskedPhone(text: string) {
  return includesAny(text, [
    "human teammate",
    "quick call",
    "شماره تماس",
    "تماس کوتاه",
    "تیم",
    "telefonnummer",
    "menschlicher austausch",
    "kurzer austausch",
  ]);
}

function hasOnlinePresence(profile: ExtractedProfile) {
  return Boolean(
    extractInstagramHandle(profile.instagram_handle) ||
      extractWebsiteUrl(profile.website_url) ||
      safeChannels(profile.preferred_channels).length > 0
  );
}

function isReadyForDashboard(profile: ExtractedProfile, conversationText: string) {
  const hasBusinessIdentity =
    !isGenericBusinessName(profile.business_name) || Boolean(safeString(profile.customer_name));
  const hasCoreContext =
    Boolean(safeString(profile.industry)) &&
    Boolean(safeString(profile.location)) &&
    Boolean(safeString(profile.main_growth_problem));
  const contactWasHandled =
    Boolean(extractPhoneNumber(profile.phone_number)) ||
    hasPhoneRefusal(conversationText) ||
    hasAskedPhone(conversationText);

  return hasCoreContext && hasBusinessIdentity && contactWasHandled;
}

function isCompleteBusinessProfile(profile: any) {
  const businessName = safeString(profile?.business_name);

  return Boolean(
    businessName &&
      businessName !== "New ALYN workspace" &&
      safeString(profile?.industry) &&
      safeString(profile?.location) &&
      safeString(profile?.main_growth_problem)
  );
}

function getPhoneSaveFailureReply(language: ExtractedProfile["onboarding_language"]) {
  if (language === "fa") {
    return "شماره را گرفتم، اما ذخیره‌سازی‌اش کامل نشد. فعلاً ادامه می‌دهیم و بعداً می‌توانی دوباره واردش کنی.";
  }

  if (language === "de") {
    return "Ich habe deine Nummer verstanden, aber das Speichern ist gerade nicht komplett durchgelaufen. Wir machen erst einmal weiter; du kannst sie später noch einmal eintragen.";
  }

  return "I got your number, but saving it did not fully complete. We’ll keep going for now and you can add it again later.";
}

function detectOnboardingLanguage(text: string): "en" | "de" | "fa" | "mixed" {
  const normalized = text.toLowerCase();
  const hasPersian = /[\u0600-\u06FF]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);

  if (hasPersian && hasLatin) {
    return "mixed";
  }

  if (hasPersian) {
    return "fa";
  }

  const germanSignals = [
    "ich ",
    "wir ",
    "mein ",
    "meine ",
    "unser ",
    "unternehmen",
    "geschäft",
    "kunden",
    "mehr kunden",
    "umsatz",
    "wachstum",
    "budget",
    "weiß",
    "nicht",
    "möchte",
    "für",
    "ä",
    "ö",
    "ü",
    "ß",
  ];

  if (germanSignals.some((signal) => normalized.includes(signal))) {
    return "de";
  }

  return "en";
}

function normalizeLanguage(value: unknown, fallback: "en" | "de" | "fa" | "mixed") {
  return value === "en" || value === "de" || value === "fa" || value === "mixed" ? value : fallback;
}

function normalizeConfidence(value: unknown): "low" | "medium" | "high" {
  return value === "low" || value === "medium" || value === "high" ? value : "medium";
}

function parseOnboardingExtraction(content: string): OnboardingExtraction {
  try {
    return JSON.parse(content) as OnboardingExtraction;
  } catch (error) {
    console.error("ONBOARDING CHAT JSON PARSE ERROR", error);
    return {
      customer_name: null,
      business_name: null,
      industry: null,
      location: null,
      address_or_area: null,
      instagram_handle: null,
      website_url: null,
      main_growth_problem: null,
      preferred_channels: null,
      monthly_marketing_budget: null,
      phone_number: null,
      onboarding_language: null,
      customer_confidence_level: null,
      price_sensitivity: null,
      urgency_level: null,
      decision_readiness: null,
      admin_sales_hint: null,
      summary_for_dashboard: "",
      confidence: "low",
      ready_for_dashboard: false,
    };
  }
}

function getLastUserTextFromMessages(messages: { role?: unknown; content?: unknown }[]) {
  const lastUserMessage = [...messages]
    .reverse()
    .find((item) => safeString(item.role) === "user" && safeString(item.content));

  return safeString(lastUserMessage?.content);
}

function hasPositiveTransitionIntent(text: string) {
  return includesAny(text, [
    "yes",
    "yeah",
    "ok",
    "okay",
    "ready",
    "let's go",
    "go ahead",
    "open dashboard",
    "بله",
    "آره",
    "اره",
    "اوکی",
    "باشه",
    "بریم",
    "آماده",
    "داشبورد",
    "ja",
    "gerne",
    "weiter",
    "bereit",
    "dashboard",
  ]);
}

function hasDiagnosisMoment(text: string) {
  return includesAny(text, [
    "حسی که دارم",
    "به نظر میاد",
    "مشکل اصلی",
    "diagnosis",
    "what i’m seeing",
    "what i'm seeing",
    "it looks like",
    "mein eindruck",
    "ich sehe",
    "das eigentliche problem",
  ]);
}

function getMissingOnboardingFields(profile: ExtractedProfile, conversationText: string) {
  const missing: string[] = [];

  if (!safeString(profile.industry)) missing.push("industry");
  if (isGenericBusinessName(profile.business_name)) missing.push("business_identity");
  if (!safeString(profile.main_growth_problem)) missing.push("main_growth_problem");

  if (!safeString(profile.location)) {
    missing.push("location");
  }

  if (isLocalBusiness(profile) && !safeString(profile.address_or_area)) {
    missing.push("address_or_area");
  }

  if (!hasOnlinePresence(profile)) {
    missing.push("online_presence");
  }

  const phoneHandled =
    Boolean(extractPhoneNumber(profile.phone_number)) ||
    hasPhoneRefusal(conversationText) ||
    hasAskedPhone(conversationText);

  if (!phoneHandled) missing.push("phone_number_optional");

  return missing;
}

function calculateLeadScore(profile: ExtractedProfile, conversationText: string) {
  const phoneHandled =
    Boolean(extractPhoneNumber(profile.phone_number)) ||
    hasPhoneRefusal(conversationText) ||
    hasAskedPhone(conversationText);

  const score =
    10 +
    (safeString(profile.industry) ? 10 : 0) +
    (!isGenericBusinessName(profile.business_name) ? 10 : 0) +
    (safeString(profile.location) ? 10 : 0) +
    (safeString(profile.address_or_area) ? 5 : 0) +
    (safeString(profile.main_growth_problem) ? 20 : 0) +
    (safeString(profile.customer_name) ? 5 : 0) +
    (phoneHandled ? 10 : 0) +
    (hasOnlinePresence(profile) ? 15 : 0) +
    (profile.decision_readiness === "ready_to_buy" ? 15 : profile.decision_readiness === "interested" ? 8 : 0) +
    (profile.urgency_level === "high" ? 10 : profile.urgency_level === "medium" ? 5 : 0);

  return Math.min(100, score);
}

function determineOnboardingState(
  profile: ExtractedProfile,
  conversationText: string,
  savedState?: string | null,
  lastUserMessage?: string
): OnboardingState {
  const latestUserText = safeString(lastUserMessage);

  if (!safeString(profile.industry) || isGenericBusinessName(profile.business_name)) {
    return "business_discovery";
  }

  if (!safeString(profile.main_growth_problem)) {
    return "problem_discovery";
  }

  if (
    !safeString(profile.location) ||
    (isLocalBusiness(profile) && !safeString(profile.address_or_area)) ||
    !hasOnlinePresence(profile)
  ) {
    return "context_enrichment";
  }

  const phoneHandled =
    Boolean(extractPhoneNumber(profile.phone_number)) ||
    hasPhoneRefusal(conversationText) ||
    hasAskedPhone(conversationText);

  if (!phoneHandled) {
    return "contact_capture";
  }

  if (!hasDiagnosisMoment(conversationText)) {
    return "diagnosis";
  }

  if (
    savedState === "pre_close" &&
    hasPositiveTransitionIntent(latestUserText) &&
    isReadyForDashboard(profile, conversationText)
  ) {
    return "ready_for_dashboard";
  }

  if (
    savedState === "ready_for_dashboard" &&
    isReadyForDashboard(profile, conversationText)
  ) {
    return "ready_for_dashboard";
  }

  return "pre_close";
}

function getFollowUpReply(
  profile: ExtractedProfile,
  conversationText: string,
  savedState?: string | null,
  lastUserMessage?: string
) {
  const state = determineOnboardingState(profile, conversationText, savedState, lastUserMessage);
  const language = profile.onboarding_language;
  const userIsUnsure = hasUnknownAnswer(conversationText);

  if (state === "business_discovery") {
    if (language === "fa") {
      return "خوشحالم اینجایی. بیایم ساده شروع کنیم: چه نوع کسب‌وکاری داری، اسمش چیه، و معمولاً چه چیزی می‌فروشی؟ اگر اسم برند هنوز قطعی نیست، همون رو هم بگو.";
    }

    if (language === "de") {
      return "Schön, dass du hier bist. Lass uns einfach anfangen: Was für ein Geschäft hast du, wie heißt es, und was verkaufst du normalerweise? Wenn der Name noch nicht final ist, ist das auch okay.";
    }

    return "Glad you’re here. Let’s start simply: what kind of business do you run, what is it called, and what do you usually sell? If the brand name is not final yet, that’s okay too.";
  }

  if (state === "problem_discovery") {
    if (language === "fa") {
      return userIsUnsure
        ? "اشکالی نداره اگر هنوز دقیق نمی‌دونی. از بین این‌ها کدوم بیشتر شبیه وضعیتته: مشتری جدید کم داری، دیده نمی‌شی، آدم‌ها می‌پرسن ولی تبدیل نمی‌شن، یا مشتری‌ها برنمی‌گردن؟"
        : "حالا بگو دقیقاً کجای رشد بیشتر گیر کرده‌ای: دیده‌شدن، گرفتن مشتری جدید، تبدیل مخاطب به مشتری، یا برگشت دوباره مشتری‌ها؟";
    }

    if (language === "de") {
      return userIsUnsure
        ? "Kein Problem, wenn es noch nicht ganz klar ist. Was passt eher: zu wenig neue Kunden, zu wenig Sichtbarkeit, Interesse ohne Abschlüsse oder zu wenig Wiederkehr?"
        : "Wo hängt dein Wachstum gerade am stärksten: Sichtbarkeit, neue Kunden, Abschlüsse oder wiederkehrende Kunden?";
    }

    return userIsUnsure
      ? "No problem if it is not fully clear yet. Which feels closest: not enough new customers, not enough visibility, interest without conversion, or customers not coming back?"
      : "Where does growth feel most stuck right now: visibility, new customers, conversion, or repeat customers?";
  }

  if (state === "context_enrichment") {
    const needsLocation = !safeString(profile.location);
    const needsArea = isLocalBusiness(profile) && !safeString(profile.address_or_area);
    const needsOnlinePresence = !hasOnlinePresence(profile);

    if (language === "fa") {
      if (needsLocation) {
        return "برای اینکه مسیر رشد واقعی باشه، باید بدونم کجا فعالیت می‌کنی. کسب‌وکارت تو کدوم شهره؟";
      }

      if (needsArea) {
        return "چون کسب‌وکارت محلیه، محدوده خیلی مهمه. اگر راحتی، محله یا آدرس تقریبی رو هم بگو تا مسیر جذب مشتری دقیق‌تر بشه.";
      }

      if (needsOnlinePresence) {
        return "خوبه، حالا می‌خوام بفهمم مشتری‌ها الان از کجا پیدات می‌کنن. اینستاگرام، گوگل، سایت، تبلیغات، یا بیشتر معرفی و آشنایی؟";
      }
    }

    if (language === "de") {
      if (needsLocation) {
        return "Damit der Wachstumsweg realistisch wird: In welcher Stadt ist dein Geschäft aktiv?";
      }

      if (needsArea) {
        return "Da dein Geschäft lokal ist, ist die Umgebung sehr wichtig. Wenn du möchtest, teile auch den Stadtteil oder eine ungefähre Adresse.";
      }

      if (needsOnlinePresence) {
        return "Gut, jetzt möchte ich verstehen, wo Kunden dich aktuell finden: Instagram, Google, Website, Ads oder eher Empfehlungen?";
      }
    }

    if (needsLocation) {
      return "To make the growth path realistic, I need to know where you operate. Which city is your business in?";
    }

    if (needsArea) {
      return "Because your business is local, the nearby area matters. If you’re comfortable, share the neighborhood or approximate address too.";
    }

    return "Good. Now I want to understand where customers currently find you: Instagram, Google, website, ads, or mostly referrals?";
  }

  if (state === "contact_capture") {
    if (language === "fa") {
      return "یه نکته کوچک هم هست. اگر راحتی، می‌تونی شماره موبایلت رو هم بدی. فقط برای اینه که اگر یک تماس کوتاه واقعاً کمک‌کننده باشه، یکی از اعضای تیم انسانی باهات هماهنگ کنه. اگر دوست نداری، کاملاً اوکیه و همینجا ادامه می‌دیم.";
    }

    if (language === "de") {
      return "Noch ein kleiner Punkt: Wenn du möchtest, kannst du deine Telefonnummer teilen. Nur falls ein kurzer menschlicher Austausch wirklich hilfreich wäre. Wenn nicht, ist das völlig okay und wir machen hier weiter.";
    }

    return "One small thing: if you’re comfortable, you can share your phone number. It’s only so a human teammate can contact you if a quick call would genuinely help. If not, that’s completely fine and we’ll continue here.";
  }

  if (state === "diagnosis") {
    return getDiagnosisReply(profile);
  }

  if (state === "pre_close") {
    if (language === "fa") {
      return "الان تصویر اولیه خوبی دارم. هنوز لازم نیست همه‌چیز کامل باشه؛ مهم اینه که مسیر اول رو درست بچینیم. من می‌تونم داشبورد رشدت رو آماده کنم و اونجا مرحله بعدی رو دقیق‌تر با هم جلو ببریم. اگر آماده‌ای، بگو بریم تا داشبوردت رو باز کنیم.";
    }

    if (language === "de") {
      return "Ich habe jetzt ein gutes erstes Bild. Es muss noch nicht alles perfekt sein; wichtig ist, den ersten sinnvollen Weg zu bauen. Ich kann dein Growth Dashboard vorbereiten und wir schärfen die nächsten Schritte dort weiter. Wenn du bereit bist, sag einfach weiter.";
    }

    return "I have a good first picture now. It does not need to be perfect yet; what matters is building the first clear path. I can prepare your growth dashboard and we’ll sharpen the next steps there. If you’re ready, tell me and we’ll open it.";
  }

  return getCompletionReply(profile);
}

function getDiagnosisReply(profile: ExtractedProfile) {
  const language = profile.onboarding_language;
  const industry = safeString(profile.industry) || "business";
  const location = safeString(profile.location);
  const problem = safeString(profile.main_growth_problem);

  if (language === "fa") {
    return `حسی که دارم اینه که مسئله فقط «${problem || "رشد"}» نیست؛ برای ${industry}${location ? ` در ${location}` : ""}، مشکل اصلی احتمالاً اینه که هنوز مسیر منظمی بین دیده‌شدن، اعتمادسازی و تبدیل آدم‌ها به مشتری ساخته نشده.\n\nاین خبر بدی نیست؛ اتفاقاً یعنی اگر مسیر درست بچینیم، می‌تونیم از یک نقطه مشخص شروع کنیم و نتیجه رو قابل اندازه‌گیری کنیم.`;
  }

  if (language === "de") {
    return `Mein Eindruck ist: Es geht nicht nur um „${problem || "Wachstum"}“. Für ${industry}${location ? ` in ${location}` : ""} liegt der Kern wahrscheinlich darin, dass Sichtbarkeit, Vertrauen und Kundengewinnung noch nicht sauber miteinander verbunden sind.\n\nDas ist kein schlechtes Zeichen. Es bedeutet, dass wir mit einem klaren ersten Schritt echte Struktur aufbauen können.`;
  }

  return `What I’m seeing is this: it is not only about “${problem || "growth"}.” For a ${industry}${location ? ` in ${location}` : ""}, the real issue is probably that visibility, trust, and customer conversion are not connected into one clear path yet.\n\nThat is not bad news. It means we can start with one focused direction and make progress measurable.`;
}


function getCompletionReply(profile: ExtractedProfile) {
  const summary = safeString(profile.summary_for_dashboard);

  if (profile.onboarding_language === "fa") {
    return `${summary || "من به اندازه کافی از کسب‌وکارت فهمیدم تا اولین مسیر رشد را آماده کنم."}\n\nمی‌توانم اولین داشبورد رشدت را بسازم و بعد جزئیات را با هم دقیق‌تر کنیم. هر وقت آماده‌ای، داشبوردت را باز کن.`;
  }

  if (profile.onboarding_language === "de") {
    return `${summary || "Ich habe genug verstanden, um deinen ersten Growth Workspace aufzubauen."}\n\nIch bereite dein Dashboard mit einer ersten Wachstumsrichtung vor, und wir können die Details danach weiter schärfen. Wenn du bereit bist, öffne dein Dashboard.`;
  }

  return `${summary || "I have enough to build your first growth workspace."}\n\nI’ll prepare your dashboard with an initial growth direction, and we can refine the details from there. When you are ready, open your dashboard.`;
}

function getPhoneThanksReply(profile: ExtractedProfile) {
  if (profile.onboarding_language === "fa") {
    return "ممنون، شماره‌ات را ثبت کردم. فقط اگر واقعاً یک تماس کوتاه کمک‌کننده باشد، یکی از اعضای تیم انسانی با تو هماهنگ می‌کند.";
  }

  if (profile.onboarding_language === "de") {
    return "Danke, ich habe deine Nummer gespeichert. Wir nutzen sie nur, wenn ein kurzer menschlicher Follow-up wirklich hilfreich ist.";
  }

  return "Thanks, I saved your number. We’ll only use it if a quick human follow-up would genuinely help.";
}

export async function POST(req: Request) {
  try {
    const { userId, conversationId, message } = await req.json();
    const lastUserMessage = safeString(message);

    console.log("ONBOARDING LAST USER MESSAGE", lastUserMessage);

    if (!userId || !conversationId || !lastUserMessage) {
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 400 }
      );
    }

    const initialMessageClassification = classifyLastUserMessage(lastUserMessage);
    console.log("LAST_USER_MESSAGE_CLASSIFICATION", initialMessageClassification);
    console.log("PHONE_EXTRACTED", initialMessageClassification.phoneNumber);
    console.log("BUDGET_EXTRACTED", initialMessageClassification.monthlyMarketingBudget);

    const { data: conversation, error: conversationError } = await supabase
      .from("ai_conversations")
      .select("*")
      .eq("id", conversationId)
      .eq("user_id", userId)
      .maybeSingle();

    if (conversationError) {
      console.error("ONBOARDING CONVERSATION FETCH ERROR", conversationError);
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 500 }
      );
    }

    if (!conversation) {
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 404 }
      );
    }

    const { data: existingProfile, error: profileCheckError } = await supabase
      .from("business_profiles")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const savedState = safeString(existingProfile?.onboarding_state) || null;

    if (profileCheckError) {
      console.error("ONBOARDING EXISTING PROFILE CHECK ERROR", profileCheckError);
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 500 }
      );
    }

    if (existingProfile && isCompleteBusinessProfile(existingProfile) && initialMessageClassification.type !== "phone_number") {
      return NextResponse.json({
        reply: "Your growth workspace already exists. I’ll take you to the dashboard.",
        profileCreated: true,
        businessProfile: existingProfile,
      });
    }

    const { data: insertedUserMessage, error: userMessageError } = await supabase
      .from("ai_messages")
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role: "user",
        content: lastUserMessage,
      })
      .select("id, role, content")
      .single();

    if (userMessageError) {
      console.error("ONBOARDING USER MESSAGE INSERT ERROR", userMessageError);
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 500 }
      );
    }

    if (initialMessageClassification.type === "phone_number" && initialMessageClassification.phoneNumber) {
      const { data: messageHistoryForPhone, error: phoneMessagesError } = await supabase
        .from("ai_messages")
        .select("role, content, created_at")
        .eq("user_id", userId)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(40);

      if (phoneMessagesError) {
        console.error("ONBOARDING PHONE MESSAGE HISTORY FETCH ERROR", phoneMessagesError);
      }

      const conversationTextForPhone = getConversationText(messageHistoryForPhone ?? []);
      const phoneLanguage = normalizeLanguage(null, detectOnboardingLanguage(conversationTextForPhone || lastUserMessage));
      const phoneProfile: ExtractedProfile = {
        ...(existingProfile || {}),
        phone_number: initialMessageClassification.phoneNumber,
        onboarding_language: phoneLanguage,
      };
      const phoneState = determineOnboardingState(
        phoneProfile,
        conversationTextForPhone,
        savedState,
        lastUserMessage
      );
      const phoneMissingFields = getMissingOnboardingFields(phoneProfile, conversationTextForPhone);
      const phonePayload = {
        user_id: userId,
        business_name: safeString(existingProfile?.business_name) || "New ALYN workspace",
        phone_number: initialMessageClassification.phoneNumber,
        onboarding_language: phoneLanguage,
        onboarding_state: phoneState,
        missing_fields: phoneMissingFields,
        lead_score: calculateLeadScore(phoneProfile, conversationTextForPhone),
        last_onboarding_intent: phoneState,
        diagnosis_done: phoneState === "pre_close" || phoneState === "ready_for_dashboard",
        pre_close_done: phoneState === "ready_for_dashboard",
      };

      console.log("ONBOARDING PHONE SAVE PAYLOAD", phonePayload);

      let savedPhoneProfile = existingProfile;
      let phoneSaveError = null;

      if (existingProfile?.id) {
        const { data: updatedProfile, error: updatePhoneError } = await supabase
          .from("business_profiles")
          .update(phonePayload)
          .eq("id", existingProfile.id)
          .select("*")
          .single();

        phoneSaveError = updatePhoneError;
        savedPhoneProfile = updatedProfile || existingProfile;
      } else {
        const { data: insertedPhoneProfile, error: insertPhoneError } = await supabase
          .from("business_profiles")
          .insert(phonePayload)
          .select("*")
          .single();

        phoneSaveError = insertPhoneError;
        savedPhoneProfile = insertedPhoneProfile;

        if (insertedPhoneProfile?.id) {
          const { error: conversationPhoneUpdateError } = await supabase
            .from("ai_conversations")
            .update({
              business_profile_id: insertedPhoneProfile.id,
            })
            .eq("id", conversationId)
            .eq("user_id", userId);

          if (conversationPhoneUpdateError) {
            console.error("ONBOARDING PHONE CONVERSATION PROFILE UPDATE ERROR", conversationPhoneUpdateError);
          }
        }
      }

      console.error("ONBOARDING PHONE SAVE ERROR", phoneSaveError);

      const nextAssistantReply = phoneSaveError
        ? getPhoneSaveFailureReply(phoneLanguage)
        : `${getPhoneThanksReply(phoneProfile)}\n\n${getFollowUpReply(phoneProfile, conversationTextForPhone, phoneState, lastUserMessage)}`;

      const { data: insertedAssistantMessage, error: assistantMessageError } = await supabase
        .from("ai_messages")
        .insert({
          user_id: userId,
          conversation_id: conversationId,
          role: "assistant",
          content: nextAssistantReply,
        })
        .select("id, role, content")
        .single();

      if (assistantMessageError) {
        console.error("ONBOARDING PHONE ASSISTANT MESSAGE INSERT ERROR", assistantMessageError);
        return NextResponse.json({
          reply: nextAssistantReply,
          profileCreated: false,
          businessProfile: savedPhoneProfile,
          userMessage: insertedUserMessage,
        });
      }

      return NextResponse.json({
        reply: nextAssistantReply,
        profileCreated: false,
        businessProfile: savedPhoneProfile,
        extractedProfile: phoneProfile,
        userMessage: insertedUserMessage,
        assistantMessage: insertedAssistantMessage,
      });
    }

    const { data: messageHistory, error: messagesError } = await supabase
      .from("ai_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(40);

    if (messagesError) {
      console.error("ONBOARDING MESSAGE HISTORY FETCH ERROR", messagesError);
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 500 }
      );
    }

    let completion;

    try {
      completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.45,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `
You are ALYN’s onboarding data extraction engine.

Your job:
Read the conversation and extract structured business profile information.

Return only valid JSON.

Schema:
{
  "customer_name": string | null,
  "business_name": string | null,
  "industry": string | null,
  "location": string | null,
  "address_or_area": string | null,
  "instagram_handle": string | null,
  "website_url": string | null,
  "main_growth_problem": string | null,
  "preferred_channels": string[] | null,
  "monthly_marketing_budget": number | null,
  "phone_number": string | null,
  "onboarding_language": "fa" | "de" | "en" | "mixed" | null,
  "customer_confidence_level": "low" | "medium" | "high" | null,
  "price_sensitivity": "low" | "medium" | "high" | null,
  "urgency_level": "low" | "medium" | "high" | null,
  "decision_readiness": "early_research" | "interested" | "ready_to_buy" | null,
  "admin_sales_hint": string | null,
  "summary_for_dashboard": string,
  "ready_for_dashboard": boolean
}

Rules:
- Extract only what is supported by the conversation.
- Extract customer_name only when the customer gives their personal/contact name.
- Extract business_name from the brand/store/company name. If no explicit name exists, create a reasonable temporary name from business type and location, but do not pretend it is confirmed.
- Extract city into location. Extract neighborhood, district, rough address, or local area into address_or_area.
- Extract instagram_handle and website_url only if clearly provided.
- Do not invent budget.
- Only extract monthly_marketing_budget when the user clearly gives a number in a budget or money context such as budget, بودجه, هزینه, یورو, euro, €, ماهانه, invest, spend, خرج, or تبلیغات ماهانه.
- Never treat phone numbers as monthly_marketing_budget.
- If budget is vague, unknown, refused, or not provided, return null.
- If the user says "I don’t know", "ندارم", "نمی‌دونم", "weiß ich nicht", or similar, return null for budget.
- Extract phone_number only if clearly provided. Accept flexible formats such as +49..., 0176..., 0912..., or numbers inside sentences.
- If the user refuses, ignores it, or says they prefer not to share it, return null for phone_number.
- Phone number is optional and must never affect ready_for_dashboard.
- Infer admin-only sales signals from tone and content:
  customer_confidence_level, price_sensitivity, urgency_level, decision_readiness, admin_sales_hint.
- admin_sales_hint should be concise and useful for a human ALYN teammate. Never include technical details.
- Detect language from the conversation.
- If location is mentioned in Persian/German/English, normalize if obvious:
  "دویسبورگ" -> "Duisburg"
  "اسن" -> "Essen"
  "کلن" -> "Köln"
  "برلین" -> "Berlin"
- ready_for_dashboard should only be true after there is enough discovery context: business type, city/location, business or contact identity, main growth problem, and phone handled if offered/refused. Budget is not required.
- Do not recommend packages or generate proposals.
- Return JSON only.
`,
          },
          {
            role: "user",
            content: JSON.stringify({
              conversation: messageHistory ?? [],
            }),
          },
        ],
      });
    } catch (error) {
      console.error("ONBOARDING OPENAI ERROR", error);
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 500 }
      );
    }

    const content = completion.choices[0]?.message?.content || "{}";
    console.log("ONBOARDING OPENAI RESPONSE", content);
    const extraction = parseOnboardingExtraction(content);
    const conversationText = getConversationText(messageHistory ?? []);
    const detectedLanguage = detectOnboardingLanguage(conversationText);
    const extractedPhoneNumber = extractPhoneNumber(extraction.phone_number) || extractPhoneNumber(conversationText);
    const extractedBudget =
      extractMonthlyMarketingBudget(extraction.monthly_marketing_budget, conversationText) ??
      extractMonthlyMarketingBudget(conversationText, conversationText);
    console.log("PHONE_EXTRACTED", extractedPhoneNumber);
    console.log("BUDGET_EXTRACTED", extractedBudget);
    const extractedProfile: ExtractedProfile = {
      ...extraction,
      customer_name: safeString(extraction.customer_name) || null,
      business_name: createFallbackBusinessName(extraction, conversationText),
      industry: safeString(extraction.industry) || extractIndustryFallback(conversationText) || null,
      location: safeString(extraction.location) || extractLocationFallback(conversationText) || null,
      address_or_area: safeString(extraction.address_or_area) || null,
      instagram_handle: extractInstagramHandle(extraction.instagram_handle) || extractInstagramHandle(conversationText),
      website_url: extractWebsiteUrl(extraction.website_url) || extractWebsiteUrl(conversationText),
      monthly_marketing_budget: extractedBudget,
      phone_number: extractedPhoneNumber,
      onboarding_language: normalizeLanguage(extraction.onboarding_language, detectedLanguage),
      confidence: normalizeConfidence(extraction.confidence),
      customer_confidence_level: normalizeLevel(extraction.customer_confidence_level),
      price_sensitivity: normalizeLevel(extraction.price_sensitivity),
      urgency_level: normalizeLevel(extraction.urgency_level),
      decision_readiness: normalizeDecisionReadiness(extraction.decision_readiness),
      admin_sales_hint: safeString(extraction.admin_sales_hint) || null,
      ready_for_dashboard: Boolean(extraction.ready_for_dashboard),
      summary_for_dashboard: safeString(extraction.summary_for_dashboard),
    };
    const onboardingState = determineOnboardingState(
      extractedProfile,
      conversationText,
      savedState,
      lastUserMessage
    );
    const missingFields = getMissingOnboardingFields(extractedProfile, conversationText);
    const leadScore = calculateLeadScore(extractedProfile, conversationText);

    extractedProfile.ready_for_dashboard =
      onboardingState === "ready_for_dashboard" && isReadyForDashboard(extractedProfile, conversationText);

    console.log("EXTRACTED_ONBOARDING_PROFILE", extractedProfile);
    console.log("ONBOARDING_STATE", onboardingState);
    console.log("ONBOARDING_MISSING_FIELDS", missingFields);
    console.log("ONBOARDING_LEAD_SCORE", leadScore);
    const nextAssistantReply =
      extractedProfile.ready_for_dashboard
        ? getCompletionReply(extractedProfile)
        : getFollowUpReply(extractedProfile, conversationText, onboardingState, lastUserMessage);
    const assistantReply = initialMessageClassification.phoneNumber
      ? `${getPhoneThanksReply(extractedProfile)}\n\n${nextAssistantReply}`
      : nextAssistantReply;

    let businessProfile = null;
    const monthlyMarketingBudget = extractedBudget;

    if (true) {
      const businessProfilePayload = {
        user_id: userId,
        business_name: safeString(extractedProfile.business_name) || "New ALYN workspace",
        industry: safeString(extractedProfile.industry) || null,
        location: safeString(extractedProfile.location) || null,
        website_url: extractWebsiteUrl(extractedProfile.website_url),
        main_growth_problem: safeString(extractedProfile.main_growth_problem) || null,
        preferred_channels: safeChannels(extractedProfile.preferred_channels),
        monthly_marketing_budget: monthlyMarketingBudget,
        phone_number: extractPhoneNumber(extractedProfile.phone_number),
        onboarding_language: extractedProfile.onboarding_language,
        address_or_area: safeString(extractedProfile.address_or_area) || null,
        instagram_handle: extractInstagramHandle(extractedProfile.instagram_handle),
        onboarding_state: onboardingState,
        missing_fields: missingFields,
        lead_score: leadScore,
        last_onboarding_intent: onboardingState,
        diagnosis_done: onboardingState === "pre_close" || onboardingState === "ready_for_dashboard",
        pre_close_done: onboardingState === "ready_for_dashboard",
      };

      console.log("ONBOARDING BUSINESS PROFILE PAYLOAD", businessProfilePayload);

      const { data: insertedProfile, error: insertProfileError } = existingProfile?.id
        ? await supabase
            .from("business_profiles")
            .update(businessProfilePayload)
            .eq("id", existingProfile.id)
            .select("*")
            .single()
        : await supabase
            .from("business_profiles")
            .insert(businessProfilePayload)
            .select("*")
            .single();

      if (insertProfileError) {
        console.error("ONBOARDING BUSINESS PROFILE SAVE ERROR", insertProfileError);
        return NextResponse.json(
          { error: SOFT_ONBOARDING_ERROR },
          { status: 500 }
        );
      }

      businessProfile = insertedProfile;
      console.log("SAVED_BUSINESS_PROFILE", businessProfile);

      const { error: conversationUpdateError } = await supabase
        .from("ai_conversations")
        .update({
          business_profile_id: insertedProfile.id,
        })
        .eq("id", conversationId)
        .eq("user_id", userId);

      if (conversationUpdateError) {
        console.error("ONBOARDING CONVERSATION PROFILE UPDATE ERROR", conversationUpdateError);
      }
    }

    const { data: insertedAssistantMessage, error: assistantMessageError } = await supabase
      .from("ai_messages")
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        role: "assistant",
        content: assistantReply,
      })
      .select("id, role, content")
      .single();

    if (assistantMessageError) {
      console.error("ONBOARDING ASSISTANT MESSAGE INSERT ERROR", assistantMessageError);
      return NextResponse.json(
        { error: SOFT_ONBOARDING_ERROR },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reply: assistantReply,
      profileCreated: Boolean(businessProfile) && extractedProfile.ready_for_dashboard,
      businessProfile,
      extractedProfile,
      userMessage: insertedUserMessage,
      assistantMessage: insertedAssistantMessage,
    });
  } catch (error) {
    console.error("ONBOARDING CHAT API ERROR", error);
    return NextResponse.json(
      { error: SOFT_ONBOARDING_ERROR },
      { status: 500 }
    );
  }
}
