"use client";

import { useMemo } from "react";
import { signInWithGoogle } from "@/lib/auth";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAppLanguage, type AppLanguage } from "@/lib/i18n";
import { BrandLogo } from "./BrandLogo";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LineChart,
  Linkedin,
  Megaphone,
  MousePointer2,
  Rocket,
  Search,
  ShieldCheck,
  Target,
  Zap
} from "lucide-react";

type PublicLanguage = AppLanguage;

const translations = {
  de: {
    nav: [
      { label: "So funktioniert's", href: "#how-it-works" },
      { label: "Services", href: "#services" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "Über ALYN", href: "/about" }
    ],
    common: {
      startWithAlyn: "Mit ALYN starten",
      startShort: "Start",
      languageDe: "DE",
      languageEn: "EN"
    },
    hero: {
      badge: "KI-Wachstumsagenten führen jetzt Kampagnen aus",
      title: "Wir übernehmen dein Marketing. Du führst dein Business.",
      copy:
        "ALYN verbindet KI-Agenten und menschliche Strategie, um dein Wachstumssystem zu planen, umzusetzen und laufend zu optimieren — ohne dass du ein Marketing-Team aufbauen musst.",
      primaryCta: "Mit ALYN starten",
      secondaryCta: "So funktioniert's"
    },
    dashboardHero: {
      overline: "Growth OS",
      title: "ALYN Kommandozentrale",
      assistantOnline: "KI-Assistent online",
      businessAnalysis: "Business-Analyse",
      analysisHint: "Zielgruppe, Angebot, Website, Wettbewerber",
      strategyGenerated: "Strategie erstellt",
      campaignRunning: "Kampagne läuft",
      performanceGraph: "Performance-Graph",
      live: "Live"
    },
    problem: {
      title: "Wachstum ist für die meisten Unternehmen kaputt",
      cards: [
        {
          title: "Einstellen ist teuer",
          copy: "Ein Team aufzubauen kostet Zeit, Geld und Energie, bevor überhaupt Ergebnisse sichtbar werden."
        },
        {
          title: "Agenturen sind unbeständig",
          copy: "Die Strategie klingt gut, aber die Umsetzung wird oft langsam oder bricht unterwegs weg."
        },
        {
          title: "Tools setzen nichts um",
          copy: "Dashboards zeigen Probleme. Sie lösen sie nicht."
        }
      ]
    },
    trust: {
      title: "Wachsende Unternehmen vertrauen ALYN",
      copy: "Unternehmen in der Frühphase nutzen ALYN bereits, um Kampagnen zu starten und laufend zu optimieren.",
      stats: ["+20 gestartete Kampagnen", "+5000 generierte Leads", "Genutzt von lokalen Unternehmen in Deutschland"]
    },
    solution: {
      title: "ALYN schlägt nicht nur vor. ALYN setzt um.",
      copy: "ALYN macht aus der Diagnose echte Wachstumsarbeit und lernt aus jedem Signal weiter.",
      cards: [
        { title: "Business analysieren", copy: "Wir verstehen dein Unternehmen, deine Zielgruppe und deine Wachstumsbremsen.", metric: "42 Signale" },
        { title: "Strategie bauen", copy: "Ein klarer Umsetzungsplan statt bloßer Ideen.", metric: "KI-Roadmap" },
        { title: "Kampagnen launchen", copy: "Content, Ads und Kampagnen werden für dich umgesetzt.", metric: "Multichannel" },
        { title: "Kontinuierlich optimieren", copy: "Wir verbessern die Performance jeden Tag.", metric: "Tägliche Loops" }
      ]
    },
    whyAlyn: {
      title: "Warum ALYN funktioniert",
      cards: [
        {
          title: "Umsetzung statt Strategiedecks",
          copy: "Wir planen nicht nur. Wir starten und steuern dein Wachstum."
        },
        {
          title: "Ein System statt vier Freelancern",
          copy: "Strategie, Content, Ads und Optimierung an einem Ort."
        },
        {
          title: "KI-Geschwindigkeit + menschliche Führung",
          copy: "Schnelle Ausführung mit KI, gesteuert von echter Strategie."
        }
      ]
    },
    steps: {
      title: "So funktioniert's",
      items: ["Business einreichen", "KI-Audit erhalten", "Strategie freigeben", "Umsetzung im Dashboard verfolgen"]
    },
    dashboardPreview: {
      title: "Dein Wachstum sichtbar an einem Ort.",
      copy: "Kein Black-Box-Marketing. Du siehst genau, was passiert.",
      stageLabel: "Projektphase",
      stageValue: "Validierung skalieren",
      stageSteps: ["Audit", "Strategie", "Umsetzung", "Optimierung"],
      tasksTitle: "Aufgabenliste",
      taskStatuses: ["Abgeschlossen", "In Arbeit", "Geplant", "Geplant"],
      metricsTitle: "Kampagnenmetriken",
      leadsThisWeek: "+19 Leads diese Woche",
      calendarTitle: "Content-Kalender",
      calendarStatus: "Geplant",
      notificationsTitle: "Benachrichtigungen",
      notifications: [
        "Neue starke Zielgruppe erkannt.",
        "ALYN hat eine schwache Anzeige pausiert.",
        "Die Zusammenfassung des Growth Audits ist bereit."
      ]
    },
    services: {
      title: "Keine Services. Ein Wachstumssystem.",
      items: [
        { title: "Strategie", copy: "Klar sehen, was als Nächstes wichtig ist." },
        { title: "KI-Content", copy: "Content veröffentlichen, der Käufer bewegt." },
        { title: "Ads", copy: "Budget in qualifizierte Nachfrage verwandeln." },
        { title: "Optimierung", copy: "Verbessern, was bereits läuft." },
        { title: "Reporting", copy: "Fortschritt sehen, ohne Updates hinterherzulaufen." }
      ]
    },
    offer: {
      eyebrow: "Kostenloses Audit",
      title: "Starte mit einem kostenlosen Wachstumsplan",
      copy: "Sieh zuerst, was repariert werden sollte und wie ALYN dein Business wachsen lassen würde.",
      checklist: ["Sichtbarkeits-Check", "Wachstumschancen", "Aktionsplan"],
      cta: "Mit ALYN starten",
      spots: "Begrenzte Onboarding-Plätze in diesem Monat.",
      support: "Wir arbeiten bewusst nur mit wenigen Unternehmen gleichzeitig, um Performance zu sichern."
    },
    finalCta: {
      title: "Bereit, nicht mehr zu raten und wirklich zu wachsen?",
      cta: "Mit ALYN starten"
    },
    footer: {
      copy: "Ein intelligentes Wachstumssystem für Unternehmen, die Umsetzung, Klarheit und Momentum brauchen.",
      privacy: "Datenschutz",
      terms: "AGB",
      contact: "Kontakt",
      linkedin: "LinkedIn"
    }
  },
  en: {
    nav: [
      { label: "How it works", href: "#how-it-works" },
      { label: "Services", href: "#services" },
      { label: "Dashboard", href: "/dashboard" },
      { label: "About", href: "/about" }
    ],
    common: {
      startWithAlyn: "Start with ALYN",
      startShort: "Start",
      languageDe: "DE",
      languageEn: "EN"
    },
    hero: {
      badge: "AI growth agents now executing campaigns",
      title: "We Run Your Marketing. You Run Your Business.",
      copy:
        "ALYN combines AI agents and human strategy to plan, create, launch, and optimize your growth system — without hiring a marketing team.",
      primaryCta: "Start with ALYN",
      secondaryCta: "How It Works"
    },
    dashboardHero: {
      overline: "Growth OS",
      title: "ALYN Command Center",
      assistantOnline: "AI Assistant Online",
      businessAnalysis: "Business Analysis",
      analysisHint: "Audience, offer, website, competitors",
      strategyGenerated: "Strategy Generated",
      campaignRunning: "Campaign Running",
      performanceGraph: "Performance Graph",
      live: "Live"
    },
    problem: {
      title: "Growth is broken for most businesses",
      cards: [
        {
          title: "Hiring is expensive",
          copy: "Building a team costs time, money, and energy before you even see results."
        },
        {
          title: "Agencies are inconsistent",
          copy: "Strategy sounds great, but execution often slows down or breaks."
        },
        {
          title: "Tools don’t execute",
          copy: "Dashboards show problems. They don’t fix them."
        }
      ]
    },
    trust: {
      title: "Trusted by growing businesses",
      copy: "Early-stage companies are already using ALYN to launch and optimize campaigns.",
      stats: ["+20 campaigns launched", "+5000 leads generated", "Used by local businesses in Germany"]
    },
    solution: {
      title: "ALYN doesn’t just suggest. It executes.",
      copy: "ALYN turns diagnosis into shipped growth work, then learns from every signal.",
      cards: [
        { title: "Analyze your business", copy: "We understand your business, audience, and growth gaps.", metric: "42 signals" },
        { title: "Build strategy", copy: "Clear execution roadmap, not just ideas.", metric: "AI roadmap" },
        { title: "Launch campaigns", copy: "Content, ads, and campaigns launched for you.", metric: "Multi-channel" },
        { title: "Optimize continuously", copy: "We improve performance every day.", metric: "Daily loops" }
      ]
    },
    whyAlyn: {
      title: "Why ALYN works",
      cards: [
        {
          title: "Execution, not strategy decks",
          copy: "We don’t just plan. We launch and run your growth."
        },
        {
          title: "One system instead of 4 freelancers",
          copy: "Strategy, content, ads, and optimization — all in one place."
        },
        {
          title: "AI speed + human direction",
          copy: "Fast execution powered by AI, guided by real strategy."
        }
      ]
    },
    steps: {
      title: "How it works",
      items: ["Submit your business", "Get AI audit", "Approve strategy", "Track execution in dashboard"]
    },
    dashboardPreview: {
      title: "Your growth, visible in one place.",
      copy: "No black-box marketing. See exactly what is happening.",
      stageLabel: "Project stage",
      stageValue: "Scale validation",
      stageSteps: ["Audit", "Strategy", "Execution", "Optimization"],
      tasksTitle: "Tasks list",
      taskStatuses: ["Complete", "In progress", "Queued", "Queued"],
      metricsTitle: "Campaign metrics",
      leadsThisWeek: "+19 leads this week",
      calendarTitle: "Content calendar",
      calendarStatus: "Scheduled",
      notificationsTitle: "Notifications",
      notifications: [
        "New winning audience detected.",
        "ALYN paused one low-performing creative.",
        "Growth audit summary is ready for review."
      ]
    },
    services: {
      title: "Not services. One growth system.",
      items: [
        { title: "Strategy", copy: "Know what to do next." },
        { title: "AI Content", copy: "Publish content that moves buyers." },
        { title: "Ads", copy: "Turn spend into qualified demand." },
        { title: "Optimization", copy: "Improve what is already running." },
        { title: "Reporting", copy: "See progress without chasing updates." }
      ]
    },
    offer: {
      eyebrow: "Free audit",
      title: "Start with a Free Growth Plan",
      copy: "See what to fix first and how ALYN would grow your business.",
      checklist: ["Visibility check", "Growth opportunities", "Action plan"],
      cta: "Start with ALYN",
      spots: "Limited onboarding spots this month.",
      support: "We only work with a few businesses at a time to ensure performance."
    },
    finalCta: {
      title: "Ready to stop guessing and start growing?",
      cta: "Start with ALYN"
    },
    footer: {
      copy: "An intelligent growth system for businesses that need execution, clarity, and momentum.",
      privacy: "Privacy",
      terms: "Terms",
      contact: "Contact",
      linkedin: "LinkedIn"
    }
  }
} as const;

const problemIcons = [CircleDollarSign, Target, MousePointer2] as const;
const solutionIcons = [Search, ClipboardList, Rocket, Activity] as const;
const servicesIcons = [Target, FileText, Megaphone, Zap, BarChart3] as const;
const tasks = ["Landing page audit", "Retargeting creative", "Lead magnet outline", "Search intent map"] as const;

function Button({
  children,
  variant = "primary",
  href,
  onClick
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  href?: string;
  onClick?: () => void;
}) {
  const classes =
    variant === "primary"
      ? "bg-neon text-white shadow-glow hover:bg-[#7b73ff]"
      : "border border-white/[0.15] bg-white/[0.06] text-white hover:bg-white/[0.1]";

  const className = `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${classes}`;

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

async function startWithAlyn() {
  const { error } = await signInWithGoogle();

  if (error) {
    console.log("GOOGLE LOGIN ERROR", error);
  }
}

function Header({
  navItems,
  cta,
  startShort,
  language,
  onLanguageChange
}: {
  navItems: readonly { label: string; href: string }[];
  cta: string;
  startShort: string;
  language: PublicLanguage;
  onLanguageChange: (language: PublicLanguage) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0f1a]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a href="/" className="flex items-center gap-3" aria-label="ALYN AI home">
          <BrandLogo />
        </a>

        <nav className="hidden items-center gap-8 text-sm text-white/70 lg:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="transition hover:text-white">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <LanguageSwitcher language={language} onChange={onLanguageChange} />
          <Button onClick={startWithAlyn}>{cta}</Button>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <LanguageSwitcher language={language} onChange={onLanguageChange} />
          <button
            onClick={startWithAlyn}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow"
          >
            {startShort}
          </button>
        </div>
      </div>
    </header>
  );
}

function HeroDashboard({
  labels
}: {
  labels: {
    overline: string;
    title: string;
    assistantOnline: string;
    businessAnalysis: string;
    analysisHint: string;
    strategyGenerated: string;
    campaignRunning: string;
    performanceGraph: string;
    live: string;
  };
}) {
  return (
    <div className="glass relative overflow-hidden rounded-[2rem] p-4 shadow-glass animate-float">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="rounded-[1.45rem] border border-white/10 bg-[#0e1323]/80 p-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/[0.45]">{labels.overline}</p>
            <h3 className="mt-1 text-lg font-semibold">{labels.title}</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {labels.assistantOnline}
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{labels.businessAnalysis}</span>
                <span className="text-neon">70%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-neon to-cyan-300" />
              </div>
              <p className="mt-3 text-xs text-white/50">{labels.analysisHint}</p>
            </div>
            {[labels.strategyGenerated, labels.campaignRunning].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon/[0.15] text-neon">
                  <Check size={17} />
                </span>
                <span className="text-sm font-medium">{item}</span>
              </div>
            ))}
          </div>

          <div className="metric-grid relative min-h-64 rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-white/[0.45]">{labels.performanceGraph}</p>
                <p className="text-2xl font-bold">+38.4%</p>
              </div>
              <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">{labels.live}</span>
            </div>
            <svg viewBox="0 0 330 180" className="h-44 w-full overflow-visible">
              <path d="M8 145 C58 130 74 120 110 126 C155 134 169 72 210 82 C250 93 264 38 322 24" fill="none" stroke="url(#line)" strokeWidth="5" strokeLinecap="round" strokeDasharray="340" className="animate-drawLine" />
              <path d="M8 145 C58 130 74 120 110 126 C155 134 169 72 210 82 C250 93 264 38 322 24 L322 180 L8 180 Z" fill="url(#area)" opacity="0.45" />
              <defs>
                <linearGradient id="line" x1="0" x2="1">
                  <stop stopColor="#6C63FF" />
                  <stop offset="1" stopColor="#67E8F9" />
                </linearGradient>
                <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#6C63FF" />
                  <stop offset="1" stopColor="#6C63FF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

function Hero({
  content,
  dashboardLabels
}: {
  content: {
    badge: string;
    title: string;
    copy: string;
    primaryCta: string;
    secondaryCta: string;
  };
  dashboardLabels: {
    overline: string;
    title: string;
    assistantOnline: string;
    businessAnalysis: string;
    analysisHint: string;
    strategyGenerated: string;
    campaignRunning: string;
    performanceGraph: string;
    live: string;
  };
}) {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
            <Bot size={16} className="text-neon" />
            {content.badge}
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
            {content.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/[0.68]">{content.copy}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={startWithAlyn}>
              {content.primaryCta} <ArrowRight size={17} />
            </Button>
            <Button href="#how-it-works" variant="secondary">
              {content.secondaryCta} <ChevronRight size={17} />
            </Button>
          </div>
        </div>
        <HeroDashboard labels={dashboardLabels} />
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, copy }: { eyebrow?: string; title: string; copy?: string }) {
  return (
    <div className="mx-auto mb-10 max-w-3xl text-center">
      {eyebrow ? <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-neon">{eyebrow}</p> : null}
      <h2 className="text-3xl font-bold tracking-normal sm:text-5xl">{title}</h2>
      {copy ? <p className="mt-4 text-lg text-white/[0.62]">{copy}</p> : null}
    </div>
  );
}

function ProblemSection({ title, cards }: { title: string; cards: readonly { title: string; copy: string }[] }) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title={title} />
        <div className="grid gap-5 md:grid-cols-3">
          {cards.map(({ title: cardTitle, copy }, index) => {
            const Icon = problemIcons[index];
            return (
              <div key={cardTitle} className="glass rounded-3xl p-6">
                <Icon className="mb-8 text-neon" size={28} />
                <h3 className="text-xl font-semibold">{cardTitle}</h3>
                <p className="mt-3 leading-7 text-white/[0.58]">{copy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TrustSection({ title, copy, stats }: { title: string; copy: string; stats: readonly string[] }) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title={title} copy={copy} />
        <div className="grid gap-5 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat} className="glass rounded-3xl p-6">
              <h3 className="text-xl font-semibold">{stat}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection({
  title,
  copy,
  cards
}: {
  title: string;
  copy: string;
  cards: readonly { title: string; copy: string; metric: string }[];
}) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title={title} copy={copy} />
        <div className="grid gap-4 md:grid-cols-4">
          {cards.map(({ title: cardTitle, copy: cardCopy, metric }, index) => {
            const Icon = solutionIcons[index];
            return (
              <div key={cardTitle} className="group rounded-3xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]">
                <div className="mb-8 flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                    <Icon size={22} />
                  </span>
                  <span className="text-xs text-white/[0.45]">{metric}</span>
                </div>
                <h3 className="text-lg font-semibold">{cardTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-white/[0.55]">{cardCopy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WhyAlynSection({ title, cards }: { title: string; cards: readonly { title: string; copy: string }[] }) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title={title} />
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map(({ title: cardTitle, copy }) => (
            <div key={cardTitle} className="group rounded-3xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]">
              <h3 className="text-lg font-semibold">{cardTitle}</h3>
              <p className="mt-3 text-sm leading-6 text-white/[0.55]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks({ title, steps }: { title: string; steps: readonly string[] }) {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title={title} />
        <div className="grid gap-4 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step} className="relative rounded-3xl border border-white/10 bg-white/[0.05] p-6">
              <span className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-neon text-sm font-bold shadow-glow">
                {index + 1}
              </span>
              <h3 className="text-lg font-semibold">{step}</h3>
              {index < steps.length - 1 ? <ArrowRight className="absolute right-6 top-8 hidden text-white/25 lg:block" size={22} /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DashboardPreview({
  content
}: {
  content: {
    title: string;
    copy: string;
    stageLabel: string;
    stageValue: string;
    stageSteps: readonly string[];
    tasksTitle: string;
    taskStatuses: readonly string[];
    metricsTitle: string;
    leadsThisWeek: string;
    calendarTitle: string;
    calendarStatus: string;
    notificationsTitle: string;
    notifications: readonly string[];
  };
}) {
  return (
    <section id="dashboard" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title={content.title} copy={content.copy} />
        <div className="glass overflow-hidden rounded-[2rem] p-4">
          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-[#0d1222]/90 p-4 lg:grid-cols-12">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">{content.stageLabel}</p>
              <h3 className="mt-3 text-2xl font-bold">{content.stageValue}</h3>
              <div className="mt-5 space-y-3">
                {content.stageSteps.map((item, index) => (
                  <div key={item} className="flex items-center gap-3 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${index < 3 ? "bg-neon" : "bg-white/25"}`} />
                    <span className={index < 3 ? "text-white" : "text-white/[0.45]"}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-4">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardList size={18} className="text-neon" />
                <h3 className="font-semibold">{content.tasksTitle}</h3>
              </div>
              <div className="space-y-3">
                {tasks.map((task, index) => (
                  <div key={task} className="flex items-center justify-between rounded-xl bg-white/[0.055] px-3 py-3 text-sm">
                    <span>{task}</span>
                    <span className="text-white/[0.45]">{content.taskStatuses[index] || content.calendarStatus}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LineChart size={18} className="text-neon" />
                  <h3 className="font-semibold">{content.metricsTitle}</h3>
                </div>
                <span className="text-xs text-emerald-200">{content.leadsThisWeek}</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["ROAS", "3.8x"],
                  ["CPL", "$21"],
                  ["CVR", "8.4%"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/[0.055] p-3">
                    <p className="text-xs text-white/[0.45]">{label}</p>
                    <p className="mt-1 text-xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-32 rounded-xl bg-gradient-to-r from-neon/25 via-cyan-300/10 to-white/[0.04] p-3">
                <div className="flex h-full items-end gap-2">
                  {[35, 48, 44, 62, 72, 68, 86].map((height, index) => (
                    <span key={index} className="flex-1 rounded-t-lg bg-white/[0.55]" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-7">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays size={18} className="text-neon" />
                <h3 className="font-semibold">{content.calendarTitle}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {["Offer post", "Case study", "Email test", "Ad variant"].map((item) => (
                  <div key={item} className="min-h-24 rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm">
                    <p className="font-medium">{item}</p>
                    <p className="mt-5 text-xs text-white/[0.45]">{content.calendarStatus}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-5">
              <div className="mb-4 flex items-center gap-2">
                <Bell size={18} className="text-neon" />
                <h3 className="font-semibold">{content.notificationsTitle}</h3>
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <p className="rounded-xl bg-emerald-400/10 p-3 text-emerald-100">{content.notifications[0]}</p>
                <p className="rounded-xl bg-white/[0.055] p-3">{content.notifications[1]}</p>
                <p className="rounded-xl bg-white/[0.055] p-3">{content.notifications[2]}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesGrid({ title, items }: { title: string; items: readonly { title: string; copy: string }[] }) {
  return (
    <section id="services" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title={title} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {items.map(({ title: itemTitle, copy }, index) => {
            const Icon = servicesIcons[index];
            return (
              <div key={itemTitle} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
                <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                  <Icon size={21} />
                </span>
                <h3 className="font-semibold">{itemTitle}</h3>
                <p className="mt-3 text-sm leading-6 text-white/[0.55]">{copy}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function OfferSection({
  content
}: {
  content: {
    eyebrow: string;
    title: string;
    copy: string;
    checklist: readonly string[];
    cta: string;
    spots: string;
    support: string;
  };
}) {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/[0.12] bg-gradient-to-br from-neon/25 via-white/[0.08] to-cyan-300/10 p-8 shadow-glass backdrop-blur-xl sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100">{content.eyebrow}</p>
            <h2 className="text-3xl font-bold sm:text-5xl">{content.title}</h2>
            <p className="mt-4 text-lg text-white/[0.66]">{content.copy}</p>
          </div>
          <div className="rounded-3xl border border-white/[0.12] bg-[#0b0f1a]/[0.55] p-5">
            {content.checklist.map((item) => (
              <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 last:border-0">
                <ShieldCheck className="text-emerald-300" size={20} />
                <span className="font-medium">{item}</span>
              </div>
            ))}
            <div className="mt-5">
              <Button onClick={startWithAlyn}>
                {content.cta} <ArrowRight size={17} />
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/[0.66]">{content.spots}</p>
            <p className="mt-2 text-sm text-white/[0.55]">{content.support}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta({ title, cta }: { title: string; cta: string }) {
  return (
    <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
      <h2 className="text-4xl font-bold sm:text-6xl">{title}</h2>
      <div className="mt-8">
        <Button onClick={startWithAlyn}>
          {cta} <ArrowRight size={17} />
        </Button>
      </div>
    </section>
  );
}

function Footer({
  copy,
  privacy,
  terms,
  contact,
  linkedin
}: {
  copy: string;
  privacy: string;
  terms: string;
  contact: string;
  linkedin: string;
}) {
  return (
    <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <BrandLogo />
          </div>
          <p className="mt-3 max-w-md text-sm text-white/50">{copy}</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-white/[0.55]">
          <a href="#" className="hover:text-white">{privacy}</a>
          <a href="#" className="hover:text-white">{terms}</a>
          <a href="#" className="hover:text-white">{contact}</a>
          <a href="#" className="inline-flex items-center gap-2 hover:text-white">
            <Linkedin size={16} />
            {linkedin}
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  const { language, setLanguage } = useAppLanguage("de");

  const t = useMemo(() => translations[language], [language]);

  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header
        navItems={t.nav}
        cta={t.common.startWithAlyn}
        startShort={t.common.startShort}
        language={language}
        onLanguageChange={setLanguage}
      />
      <Hero content={t.hero} dashboardLabels={t.dashboardHero} />
      <ProblemSection title={t.problem.title} cards={t.problem.cards} />
      <TrustSection title={t.trust.title} copy={t.trust.copy} stats={t.trust.stats} />
      <SolutionSection title={t.solution.title} copy={t.solution.copy} cards={t.solution.cards} />
      <WhyAlynSection title={t.whyAlyn.title} cards={t.whyAlyn.cards} />
      <HowItWorks title={t.steps.title} steps={t.steps.items} />
      <DashboardPreview content={t.dashboardPreview} />
      <ServicesGrid title={t.services.title} items={t.services.items} />
      <OfferSection content={t.offer} />
      <FinalCta title={t.finalCta.title} cta={t.finalCta.cta} />
      <Footer
        copy={t.footer.copy}
        privacy={t.footer.privacy}
        terms={t.footer.terms}
        contact={t.footer.contact}
        linkedin={t.footer.linkedin}
      />
    </main>
  );
}
