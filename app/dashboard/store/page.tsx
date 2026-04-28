"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { BrandLogo } from "../../BrandLogo";
import {
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Globe2,
  Layers3,
  Megaphone,
  PlayCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  User,
  X,
  Zap
} from "lucide-react";

const ADMIN_EMAILS = ["hoseinpour.sorena@gmail.com"];

type BusinessProfile = {
  id: string;
  business_name?: string | null;
  industry?: string | null;
  main_growth_problem?: string | null;
};

type ServiceRow = {
  id: string;
  name?: string | null;
  title?: string | null;
  category?: string | null;
  description?: string | null;
};

type PackageRow = {
  id: string;
  service_id?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  price?: number | string | null;
  starting_price?: number | string | null;
  base_price?: number | string | null;
  min_price?: number | string | null;
  max_price?: number | string | null;
  monthly_price?: number | string | null;
  currency?: string | null;
  pricing_model?: string | null;
};

type InternalReport = {
  summary?: string | null;
  recommended_next_action?: string | null;
  risk_level?: string | null;
};

type GrowthStoreIntent = {
  source: "growth_store";
  serviceName: string;
  category: string;
  description: string;
  benefits: string[];
  pricingText: string;
};

type StoreCategory = {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  benefits: string[];
  icon: typeof Sparkles;
  gradient: string;
  badge: string;
  matchers: string[];
};

const categories: StoreCategory[] = [
  {
    key: "social",
    title: "Social Media",
    shortTitle: "Social",
    description: "Build visibility, trust, and demand with consistent content systems.",
    benefits: ["Content calendar", "Creative direction", "Audience trust signals"],
    icon: PlayCircle,
    gradient: "from-pink-400/18 via-fuchsia-400/10 to-neon/[0.08]",
    badge: "border-pink-300/20 bg-pink-400/10 text-pink-100",
    matchers: ["social", "instagram", "content", "reels", "tiktok"]
  },
  {
    key: "ads",
    title: "Ads",
    shortTitle: "Ads",
    description: "Launch paid growth engines across search, social, and retargeting.",
    benefits: ["Campaign setup", "Creative testing", "Performance optimization"],
    icon: Megaphone,
    gradient: "from-violet-400/18 via-neon/[0.12] to-sky-300/[0.07]",
    badge: "border-neon/30 bg-neon/[0.12] text-white",
    matchers: ["ads", "advertising", "paid", "meta", "google", "campaign"]
  },
  {
    key: "website",
    title: "Website",
    shortTitle: "Website",
    description: "Turn attention into action with landing pages and conversion-focused sites.",
    benefits: ["Landing pages", "Conversion sections", "SEO-ready structure"],
    icon: Globe2,
    gradient: "from-cyan-300/18 via-sky-300/10 to-neon/[0.06]",
    badge: "border-cyan-300/20 bg-cyan-400/10 text-cyan-100",
    matchers: ["website", "landing", "seo", "web"]
  },
  {
    key: "ai_agent",
    title: "AI Agent",
    shortTitle: "AI",
    description: "Automate customer conversations, lead capture, and repetitive workflows.",
    benefits: ["Lead qualification", "Automation flows", "Fast response support"],
    icon: Bot,
    gradient: "from-emerald-300/16 via-teal-300/8 to-neon/[0.08]",
    badge: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    matchers: ["ai", "agent", "automation", "chatbot", "workflow"]
  },
  {
    key: "app_growth",
    title: "App Growth",
    shortTitle: "App",
    description: "Grow installs and retention with performance testing and scale readiness.",
    benefits: ["Install campaigns", "CPI testing", "Retention signals"],
    icon: Smartphone,
    gradient: "from-amber-300/18 via-orange-300/10 to-neon/[0.06]",
    badge: "border-amber-300/20 bg-amber-400/10 text-amber-100",
    matchers: ["app", "cpi", "install", "mobile"]
  }
];

const toMoneyNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatPrice = (value: unknown, currency = "EUR") => {
  const numberValue = toMoneyNumber(value);

  if (!numberValue) {
    return null;
  }

  return `${numberValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
};

const getServiceName = (service: ServiceRow) => service.name || service.title || "Growth service";
const getPackageName = (pkg: PackageRow) => pkg.name || pkg.title || "Growth package";

const getPackagePriceValue = (pkg: PackageRow) =>
  pkg.starting_price ?? pkg.price ?? pkg.base_price ?? pkg.monthly_price ?? pkg.min_price ?? null;

const getStartingPrice = (packages: PackageRow[]) => {
  const prices = packages
    .map((pkg) => ({
      value: toMoneyNumber(getPackagePriceValue(pkg)),
      currency: pkg.currency || "EUR"
    }))
    .filter((item): item is { value: number; currency: string } => Boolean(item.value));

  if (prices.length === 0) {
    return "Custom";
  }

  const lowest = prices.sort((a, b) => a.value - b.value)[0];
  return `From ${lowest.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${lowest.currency}`;
};

const getPricingRange = (packages: PackageRow[]) => {
  const prices = packages
    .flatMap((pkg) => {
      const values = [pkg.min_price, pkg.max_price, getPackagePriceValue(pkg)]
        .map((value) => toMoneyNumber(value))
        .filter((value): value is number => Boolean(value));

      return values.map((value) => ({ value, currency: pkg.currency || "EUR" }));
    })
    .filter(Boolean);

  if (prices.length === 0) {
    return "Custom pricing based on your business";
  }

  const sorted = prices.sort((a, b) => a.value - b.value);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];

  if (min.value === max.value) {
    return `Starting from ${min.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${min.currency}`;
  }

  return `${min.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${min.currency} - ${max.value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${max.currency}`;
};

const getProblemContext = (category: StoreCategory) => {
  const content: Record<string, string> = {
    social: "Many businesses stay invisible even when their offer is strong. Social media helps when people need more trust, more consistency, and more reasons to remember you.",
    ads: "Growth often stalls because the business is relying only on referrals or inconsistent traffic. Ads help when you need a more predictable way to reach the right people.",
    website: "A business can get attention and still lose customers if the website feels unclear or slow. This service helps turn visits into real action.",
    ai_agent: "Teams lose leads when responses are slow or repetitive work piles up. An AI agent helps when conversations, follow-up, and qualification need to happen faster.",
    app_growth: "App businesses struggle when installs do not convert into retention or scale. This helps create a clearer performance path before spending more."
  };

  return content[category.key] || "This service helps remove one of the common bottlenecks between attention and growth.";
};

const getFeatureCards = (category: StoreCategory) => {
  const content: Record<string, { title: string; text: string; icon: typeof Sparkles }[]> = {
    social: [
      { title: "Content system", text: "A repeatable structure for posts, stories, and campaigns.", icon: Layers3 },
      { title: "Creative direction", text: "Clear angles so your brand feels sharper and more memorable.", icon: Sparkles },
      { title: "Audience trust", text: "Content that makes people feel more confident buying from you.", icon: ShieldCheck }
    ],
    ads: [
      { title: "Campaign structure", text: "A cleaner setup for testing, scaling, and tracking performance.", icon: Target },
      { title: "Creative testing", text: "Multiple angles to find what actually moves customers to act.", icon: Sparkles },
      { title: "Optimization rhythm", text: "Regular improvements instead of letting spend drift without clarity.", icon: CircleGauge }
    ],
    website: [
      { title: "Landing flow", text: "Pages designed to guide visitors toward the next action.", icon: ChevronRight },
      { title: "Conversion sections", text: "Stronger trust, proof, and calls to action across the site.", icon: CheckCircle2 },
      { title: "Search readiness", text: "A stronger technical and content foundation for visibility.", icon: Globe2 }
    ],
    ai_agent: [
      { title: "Lead qualification", text: "Faster first responses and better filtering of real opportunities.", icon: Bot },
      { title: "Automation flows", text: "Less manual follow-up for routine customer questions and handoffs.", icon: Layers3 },
      { title: "Response quality", text: "More consistent conversations across touchpoints.", icon: ShieldCheck }
    ],
    app_growth: [
      { title: "Install testing", text: "Structured experiments to find better traffic quality.", icon: Smartphone },
      { title: "Retention signals", text: "A clearer view of whether growth can scale sustainably.", icon: CircleGauge },
      { title: "Scale readiness", text: "A stronger base before you push harder on acquisition.", icon: Target }
    ]
  };

  return content[category.key] || [
    { title: "Focused execution", text: "A more structured way to improve this part of your growth system.", icon: Sparkles },
    { title: "Clearer priorities", text: "Less guesswork, more movement toward the right next action.", icon: Target },
    { title: "Better momentum", text: "A path designed to turn scattered effort into visible progress.", icon: ChevronRight }
  ];
};

const getExpectedOutcomes = (category: StoreCategory) => {
  const content: Record<string, string[]> = {
    social: ["Stronger visibility in the channels customers already use", "More trust before the first conversation", "A brand presence that supports future campaigns"],
    ads: ["A more predictable customer acquisition path", "Clearer insight into what messaging converts", "Less wasted spend and stronger decision-making"],
    website: ["More visitors turning into leads or customers", "A clearer story around your offer", "A better foundation for ads, SEO, and trust"],
    ai_agent: ["Faster responses without extra headcount", "Less manual pressure on the team", "More captured leads from existing demand"],
    app_growth: ["Better signal on what can scale profitably", "More disciplined testing before larger spend", "A stronger retention-aware growth engine"]
  };

  return content[category.key] || [
    "Clearer momentum in a key growth area",
    "A better customer experience",
    "A stronger path from attention to action"
  ];
};

const GROWTH_STORE_INTENT_KEY = "selectedServiceIntent";

const normalizeText = (value: unknown) => String(value || "").toLowerCase();

const serviceMatchesCategory = (service: ServiceRow, category: StoreCategory) => {
  const serviceText = `${service.category || ""} ${service.name || ""} ${service.title || ""} ${service.description || ""}`.toLowerCase();
  return category.matchers.some((matcher) => serviceText.includes(matcher));
};

const packageMatchesCategory = (pkg: PackageRow, services: ServiceRow[], category: StoreCategory) => {
  const service = services.find((item) => item.id === pkg.service_id);
  const packageText = `${pkg.name || ""} ${pkg.title || ""} ${pkg.description || ""}`.toLowerCase();

  return Boolean(service && serviceMatchesCategory(service, category)) || category.matchers.some((matcher) => packageText.includes(matcher));
};

const isRecommendedCategory = (category: StoreCategory, profile: BusinessProfile | null, report: InternalReport | null) => {
  const context = normalizeText(`${profile?.industry || ""} ${profile?.main_growth_problem || ""} ${report?.summary || ""} ${report?.recommended_next_action || ""}`);

  if (!context) {
    return false;
  }

  if (category.key === "website" && ["website", "site", "landing", "seo", "سایت"].some((signal) => context.includes(signal))) return true;
  if (category.key === "ads" && ["ads", "advertising", "campaign", "lead", "customer", "مشتری", "تبلیغ"].some((signal) => context.includes(signal))) return true;
  if (category.key === "social" && ["instagram", "social", "content", "visibility", "اینستاگرام"].some((signal) => context.includes(signal))) return true;
  if (category.key === "ai_agent" && ["automation", "ai", "agent", "support", "chat"].some((signal) => context.includes(signal))) return true;
  if (category.key === "app_growth" && ["app", "install", "cpi", "mobile"].some((signal) => context.includes(signal))) return true;

  return false;
};

function StoreSidebar() {
  const items = [
    { label: "Overview", href: "/dashboard", icon: Sparkles, active: false },
    { label: "Growth Store", href: "/dashboard/store", icon: Zap, active: true }
  ];

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
        {items.map(({ label, href, icon: Icon, active }) => (
          <Link
            key={label}
            href={href}
            className={`flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition ${
              active
                ? "bg-neon text-white shadow-glow"
                : "border border-white/10 bg-white/[0.045] text-white/[0.62] hover:bg-white/[0.08] hover:text-white"
            }`}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

function StoreTopbar({ businessName, onLogout }: { businessName: string; onLogout: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1a]/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:ml-72 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Growth Store</h1>
          {businessName ? <p className="mt-1 text-sm text-white/[0.5]">{businessName}</p> : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden min-h-11 items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] py-1 pl-2 pr-4 sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-neon text-white">
              <User size={16} />
            </span>
            <span className="text-sm font-semibold">{businessName || "User"}</span>
          </span>
          <button onClick={onLogout} className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default function GrowthStorePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [packages, setPackages] = useState<PackageRow[]>([]);
  const [internalReport, setInternalReport] = useState<InternalReport | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<StoreCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    const loadStore = async () => {
      setIsLoading(true);
      const { user, error: userError } = await getCurrentUser();

      if (userError) {
        console.log("STORE USER FETCH ERROR:", userError);
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        router.push("/admin");
        return;
      }

      const { data: businessProfile, error: profileError } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (profileError) {
        console.log("STORE BUSINESS PROFILE FETCH ERROR:", profileError);
      }

      if (!businessProfile) {
        router.push("/onboarding");
        return;
      }

      setProfile(businessProfile as BusinessProfile);

      const { data: serviceRows, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .order("name", { ascending: true });

      if (servicesError) {
        console.log("STORE SERVICES FETCH ERROR:", servicesError);
      } else {
        setServices((serviceRows ?? []) as ServiceRow[]);
      }

      const { data: packageRows, error: packagesError } = await supabase
        .from("service_packages")
        .select("*")
        .order("name", { ascending: true });

      if (packagesError) {
        console.log("STORE SERVICE PACKAGES FETCH ERROR:", packagesError);
      } else {
        setPackages((packageRows ?? []) as PackageRow[]);
      }

      const { data: reportRows, error: reportError } = await supabase
        .from("ai_internal_reports")
        .select("*")
        .eq("business_profile_id", businessProfile.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reportError) {
        console.log("STORE INTERNAL REPORT FETCH ERROR:", reportError);
      } else {
        setInternalReport((reportRows ?? null) as InternalReport | null);
      }

      setIsLoading(false);
    };

    loadStore();
  }, [router]);

  const categoryData = useMemo(
    () =>
      categories.map((category) => {
        const categoryServices = services.filter((service) => serviceMatchesCategory(service, category));
        const categoryPackages = packages.filter((pkg) => packageMatchesCategory(pkg, services, category));

        return {
          category,
          services: categoryServices,
          packages: categoryPackages,
          startingPrice: getStartingPrice(categoryPackages),
          recommended: isRecommendedCategory(category, profile, internalReport)
        };
      }),
    [internalReport, packages, profile, services]
  );

  const selectedData = selectedCategory
    ? categoryData.find((item) => item.category.key === selectedCategory.key)
    : null;
  const SelectedCategoryIcon = selectedCategory?.icon;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleAskAlynAboutService = () => {
    if (!selectedCategory || !selectedData) {
      return;
    }

    const intent: GrowthStoreIntent = {
      source: "growth_store",
      serviceName: `${selectedCategory.title} Growth System`,
      category: selectedCategory.title,
      description: selectedCategory.description,
      benefits: selectedCategory.benefits,
      pricingText: getPricingRange(selectedData.packages)
    };

    window.sessionStorage.setItem(GROWTH_STORE_INTENT_KEY, JSON.stringify(intent));
    setSelectedCategory(null);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white">
      <StoreSidebar />
      <StoreTopbar businessName={(profile?.business_name || "").trim()} onLogout={handleLogout} />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:ml-72 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-glass backdrop-blur-xl">
          <div className="bg-gradient-to-br from-neon/[0.22] via-cyan-300/[0.08] to-white/[0.02] p-6 sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-neon/30 bg-neon/[0.12] px-3 py-1 text-xs font-semibold text-white">
              <Zap size={14} />
              Growth Store
            </span>
            <h2 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              Upgrade your growth system
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/[0.62]">
              Everything you need to get more customers, faster
            </p>
          </div>
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 text-sm text-white/[0.62] shadow-glass backdrop-blur-xl">
            Loading your growth store...
          </div>
        ) : null}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {categoryData.map(({ category, packages: categoryPackages, startingPrice, recommended }) => {
            const Icon = category.icon;

            return (
              <article
                key={category.key}
                className={`group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.055] shadow-glass backdrop-blur-xl transition hover:-translate-y-1 hover:border-neon/35 hover:shadow-[0_0_40px_rgba(108,99,255,0.18)]`}
              >
                <div className={`bg-gradient-to-br ${category.gradient} p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-black/20 text-white">
                      <Icon size={24} />
                    </span>
                    {recommended ? (
                      <span className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                        Recommended for you
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-5 text-2xl font-bold">{category.title}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/[0.62]">{category.description}</p>
                </div>

                <div className="p-5">
                  <ul className="space-y-3">
                    {category.benefits.map((benefit) => (
                      <li key={benefit} className="flex gap-3 text-sm text-white/[0.68]">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neon shadow-glow" />
                        {benefit}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Starting price</p>
                    <p className="mt-2 text-xl font-bold">{startingPrice}</p>
                  </div>

                  <p className="mt-4 rounded-2xl border border-neon/20 bg-neon/[0.08] p-3 text-sm leading-6 text-white/[0.72]">
                    ALYN Insight: This can help you improve your current growth bottleneck
                  </p>

                  <button
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]"
                  >
                    View Plans
                    <ChevronRight size={17} />
                  </button>

                </div>
              </article>
            );
          })}
        </section>
      </div>

      {selectedCategory && selectedData ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 py-8 backdrop-blur-md">
          <div className="max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-white/10 bg-[#11172b] shadow-glass animate-[fadeIn_.22s_ease-out]">
            <div className={`bg-gradient-to-br ${selectedCategory.gradient} p-5 sm:p-6`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${selectedCategory.badge}`}>
                    {selectedCategory.shortTitle}
                  </span>
                  <h3 className="mt-4 text-3xl font-bold">{selectedCategory.title} Growth System</h3>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-white/[0.62]">{selectedCategory.description}</p>
                </div>
                {SelectedCategoryIcon ? (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-3xl border border-white/10 bg-black/15 text-white">
                    <SelectedCategoryIcon size={26} />
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.08] text-white/[0.7] transition hover:bg-white/[0.14] hover:text-white"
                  aria-label="Close plans"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="grid gap-6 p-5 sm:p-6">
              <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Problem & Context</p>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-white/[0.72]">
                  {getProblemContext(selectedCategory)}
                </p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">What you get</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {getFeatureCards(selectedCategory).map(({ title, text, icon: Icon }) => (
                    <article key={title} className="rounded-3xl border border-white/10 bg-black/10 p-4">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                        <Icon size={20} />
                      </span>
                      <h4 className="mt-4 text-lg font-semibold">{title}</h4>
                      <p className="mt-2 text-sm leading-6 text-white/[0.6]">{text}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Expected outcomes</p>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {getExpectedOutcomes(selectedCategory).map((item) => (
                    <li key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/[0.72]">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neon shadow-glow" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">Pricing</p>
                    <p className="mt-3 text-2xl font-bold">{getPricingRange(selectedData.packages)}</p>
                    <p className="mt-2 text-sm leading-6 text-white/[0.58]">
                      {selectedData.packages.length > 0
                        ? "Package ranges depend on scope, delivery style, and the speed of execution."
                        : "Custom pricing based on your business"}
                    </p>
                  </div>

                  <div className="grid gap-3 lg:min-w-[22rem]">
                    {selectedData.packages.length > 0 ? selectedData.packages.map((pkg) => (
                      <article key={pkg.id} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="font-semibold">{getPackageName(pkg)}</h4>
                            <p className="mt-1 text-sm leading-6 text-white/[0.58]">
                              {pkg.description || "A focused ALYN package designed to move this part of your growth system forward."}
                            </p>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-semibold text-white/[0.72]">
                            {formatPrice(getPackagePriceValue(pkg), pkg.currency || "EUR") || "Custom"}
                          </span>
                        </div>
                      </article>
                    )) : (
                      <article className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <h4 className="font-semibold">{selectedCategory.title} plan</h4>
                        <p className="mt-1 text-sm leading-6 text-white/[0.58]">
                          The right setup depends on your business, growth stage, and what needs to move first.
                        </p>
                      </article>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-neon/20 bg-neon/[0.08] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-white/[0.38]">ALYN Insight</p>
                <p className="mt-3 text-sm leading-7 text-white/[0.78]">
                  This is currently one of the most impactful ways to improve your growth.
                </p>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <button
                  type="button"
                  onClick={handleAskAlynAboutService}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]"
                >
                  Ask ALYN about this
                </button>
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
