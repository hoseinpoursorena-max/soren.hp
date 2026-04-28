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

function getFollowUpReply(profile: ExtractedProfile, conversationText: string) {
  const language = profile.onboarding_language;
  const userIsUnsure = hasUnknownAnswer(conversationText);

  if (!safeString(profile.industry)) {
    if (language === "fa") {
      return "خوشحالم که اینجا هستی. برای اینکه درست کمکت کنم، فقط از پایه شروع کنیم: چه نوع کسب‌وکاری داری و معمولاً چه چیزی می‌فروشی؟";
    }

    if (language === "de") {
      return "Schön, dass du hier bist. Damit ich dich wirklich gut einschätzen kann: Was für ein Geschäft hast du, und was verkaufst du normalerweise?";
    }

    return "Glad you’re here. To understand the business properly first: what kind of business do you run, and what do you usually sell?";
  }

  if (isGenericBusinessName(profile.business_name)) {
    if (language === "fa") {
      return "خوبه، تصویر اولیه را گرفتم. اسم کسب‌وکارت یا برندت چیه؟ اگر هنوز اسم مشخصی نداره، همین را هم بگو و جلو می‌ریم.";
    }

    if (language === "de") {
      return "Gut, ich habe ein erstes Bild. Wie heißt dein Geschäft oder deine Marke? Wenn der Name noch nicht feststeht, ist das auch okay.";
    }

    return "Good, I have the first picture. What’s the name of your business or brand? If it does not have a fixed name yet, that’s okay too.";
  }

  if (!safeString(profile.location)) {
    if (language === "fa") {
      return "این مهمه چون مسیر رشد مخصوصاً برای کسب‌وکارهای محلی خیلی به موقعیت بستگی دارد. در کدام شهر فعالیت می‌کنی؟ اگر راحتی، محله یا محدوده را هم بگو.";
    }

    if (language === "de") {
      return "Das ist wichtig, weil lokales Wachstum stark vom Standort abhängt. In welcher Stadt arbeitest du? Wenn es für dich passt, auch gern Stadtteil oder Gebiet.";
    }

    return "That matters because local growth depends heavily on location. Which city do you serve? If you’re comfortable, share the neighborhood or area too.";
  }

  if (isLocalBusiness(profile) && !safeString(profile.address_or_area)) {
    if (language === "fa") {
      return "برای بازاریابی محلی، محله یا محدوده اطراف کسب‌وکار خیلی تعیین‌کننده است. اگر راحتی، محدوده یا آدرس تقریبی را هم بگو.";
    }

    if (language === "de") {
      return "Für lokales Marketing ist die direkte Umgebung sehr wichtig. Wenn du dich damit wohlfühlst, teile gern den Stadtteil oder eine ungefähre Adresse.";
    }

    return "For local marketing, the nearby area matters a lot. If you’re comfortable, share the neighborhood or approximate address.";
  }

  if (!safeString(profile.main_growth_problem)) {
    if (language === "fa") {
      return userIsUnsure
        ? "مشکلی نیست اگر هنوز دقیق نمی‌دانی. از بین این‌ها کدام بیشتر شبیه وضعیت توست: مشتری جدید کم است، مردم تو را پیدا نمی‌کنند، یا کسانی که می‌آیند خرید نمی‌کنند؟"
        : "الان بیشتر کجای رشد گیر کرده‌ای: دیده‌شدن، گرفتن مشتری جدید، تبدیل مخاطب به مشتری، یا برگشت دوباره مشتری‌ها؟";
    }

    if (language === "de") {
      return userIsUnsure
        ? "Kein Problem, wenn es noch nicht ganz klar ist. Was trifft eher zu: zu wenig neue Kunden, zu wenig Sichtbarkeit oder zu wenige Abschlüsse?"
        : "Was fühlt sich im Wachstum gerade am meisten festgefahren an: Aufmerksamkeit, neue Leads, Abschlüsse oder wiederkehrende Kunden?";
    }

    return userIsUnsure
      ? "No problem if it is not fully clear yet. Which feels closest: not enough new customers, not enough visibility, or people show interest but do not convert?"
      : "What feels most stuck right now: getting attention, getting leads, converting people, or keeping customers?";
  }

  if (!safeString(profile.customer_name)) {
    if (language === "fa") {
      return "برای اینکه گفت‌وگو شخصی‌تر و دقیق‌تر بماند، دوست داری با چه اسمی صدایت کنم؟";
    }

    if (language === "de") {
      return "Damit ich das Gespräch persönlicher und klarer führen kann: Wie darf ich dich ansprechen?";
    }

    return "So I can keep this personal and clear, what should I call you?";
  }

  if (!safeString(profile.phone_number) && !hasPhoneRefusal(conversationText) && !hasAskedPhone(conversationText)) {
    if (language === "fa") {
      return "اگر دوست داری، می‌توانی شماره تماس هم بگذاری. فقط برای این است که اگر یک تماس کوتاه انسانی واقعاً کمک کند، یکی از اعضای تیم با تو هماهنگ شود. اگر راحت نیستی، مشکلی نیست و ادامه می‌دهیم.";
    }

    if (language === "de") {
      return "Wenn du möchtest, kannst du auch eine Telefonnummer teilen. Sie ist nur dafür da, damit ein menschlicher Teamkollege dich kontaktieren kann, falls ein kurzer Anruf helfen würde. Wenn du sie nicht teilen möchtest, ist das völlig okay.";
    }

    return "If you’d like, you can also share a phone number. It’s only so one of our human teammates can contact you if a quick call would help. If you’d rather not, that’s completely fine.";
  }

  if (!hasOnlinePresence(profile)) {
    if (language === "fa") {
      return "خوب متوجه شدم. مشتری‌ها الان معمولاً از کجا پیدایت می‌کنند؟ مثلاً اینستاگرام، گوگل، سایت، تبلیغات یا بیشتر معرفی و آشنایی؟";
    }

    if (language === "de") {
      return "Verstanden. Wo finden dich Kunden aktuell meistens: Instagram, Google, Website, Ads oder eher Empfehlungen?";
    }

    return "That makes sense. Where do customers currently find you: Instagram, Google, a website, ads, or mostly word of mouth?";
  }

  if (language === "fa") {
    return getCompletionReply(profile);
  }

  if (language === "de") {
    return getCompletionReply(profile);
  }

  return getCompletionReply(profile);
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
      const phonePayload = {
        user_id: userId,
        business_name: safeString(existingProfile?.business_name) || "New ALYN workspace",
        phone_number: initialMessageClassification.phoneNumber,
        onboarding_language: phoneLanguage,
      };

      console.log("ONBOARDING PHONE SAVE PAYLOAD", phonePayload);

      let savedPhoneProfile = existingProfile;
      let phoneSaveError = null;

      if (existingProfile?.id) {
        const { data: updatedProfile, error: updatePhoneError } = await supabase
          .from("business_profiles")
          .update({
            phone_number: initialMessageClassification.phoneNumber,
            onboarding_language: existingProfile.onboarding_language || phoneLanguage,
          })
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
        : `${getPhoneThanksReply(phoneProfile)}\n\n${getFollowUpReply(phoneProfile, conversationTextForPhone)}`;

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
    extractedProfile.ready_for_dashboard =
      Boolean(extraction.ready_for_dashboard) && isReadyForDashboard(extractedProfile, conversationText);
    console.log("EXTRACTED_ONBOARDING_PROFILE", extractedProfile);
    const nextAssistantReply =
      extractedProfile.ready_for_dashboard
        ? getCompletionReply(extractedProfile)
        : getFollowUpReply(extractedProfile, conversationText);
    const assistantReply = initialMessageClassification.phoneNumber
      ? `${getPhoneThanksReply(extractedProfile)}\n\n${nextAssistantReply}`
      : nextAssistantReply;

    let businessProfile = null;
    const monthlyMarketingBudget = extractedBudget;

    if (extractedProfile.ready_for_dashboard) {
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
      profileCreated: Boolean(businessProfile),
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
