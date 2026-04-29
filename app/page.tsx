"use client";

import { signInWithGoogle } from "@/lib/auth";
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
  Sparkles,
  Target,
  Zap
} from "lucide-react";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "About", href: "/about" }
];

const problems = [
  {
    title: "Hiring is expensive",
    copy: "Building a team costs time, money, and energy before you even see results.",
    icon: CircleDollarSign
  },
  {
    title: "Agencies are inconsistent",
    copy: "Strategy sounds great, but execution often slows down or breaks.",
    icon: Target
  },
  {
    title: "Tools don’t execute",
    copy: "Dashboards show problems. They don’t fix them.",
    icon: MousePointer2
  }
];

const solution = [
  { title: "Analyze your business", copy: "We understand your business, audience, and growth gaps.", icon: Search, metric: "42 signals" },
  { title: "Build strategy", copy: "Clear execution roadmap, not just ideas.", icon: ClipboardList, metric: "AI roadmap" },
  { title: "Launch campaigns", copy: "Content, ads, and campaigns launched for you.", icon: Rocket, metric: "Multi-channel" },
  { title: "Optimize continuously", copy: "We improve performance every day.", icon: Activity, metric: "Daily loops" }
];

const steps = [
  "Submit your business",
  "Get AI audit",
  "Approve strategy",
  "Track execution in dashboard"
];

const services = [
  { title: "Strategy", copy: "Know what to do next.", icon: Target },
  { title: "AI Content", copy: "Publish content that moves buyers.", icon: FileText },
  { title: "Ads", copy: "Turn spend into qualified demand.", icon: Megaphone },
  { title: "Optimization", copy: "Improve what is already running.", icon: Zap },
  { title: "Reporting", copy: "See progress without chasing updates.", icon: BarChart3 }
];

const trustStats = [
  "+20 campaigns launched",
  "+5000 leads generated",
  "Used by local businesses in Germany"
];

const whyAlyn = [
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
];

const tasks = [
  ["Landing page audit", "Complete"],
  ["Retargeting creative", "In progress"],
  ["Lead magnet outline", "Queued"],
  ["Search intent map", "Queued"]
];

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

function Header() {
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
          <Button onClick={startWithAlyn}>Start with ALYN</Button>
        </div>

        <button
          onClick={startWithAlyn}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow sm:hidden"
        >
          Start
        </button>
      </div>
    </header>
  );
}

function HeroDashboard() {
  return (
    <div className="glass relative overflow-hidden rounded-[2rem] p-4 shadow-glass animate-float">
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
      <div className="rounded-[1.45rem] border border-white/10 bg-[#0e1323]/80 p-4">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-white/[0.45]">Growth OS</p>
            <h3 className="mt-1 text-lg font-semibold">ALYN Command Center</h3>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            AI Assistant Online
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div className="space-y-4 md:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Business Analysis</span>
                <span className="text-neon">70%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-neon to-cyan-300" />
              </div>
              <p className="mt-3 text-xs text-white/50">Audience, offer, website, competitors</p>
            </div>
            {["Strategy Generated", "Campaign Running"].map((item) => (
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
                <p className="text-xs text-white/[0.45]">Performance Graph</p>
                <p className="text-2xl font-bold">+38.4%</p>
              </div>
              <span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">Live</span>
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

function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
            <Bot size={16} className="text-neon" />
            AI growth agents now executing campaigns
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
            We Run Your Marketing. You Run Your Business.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/[0.68]">
            ALYN combines AI agents and human strategy to plan, create, launch, and optimize your growth system — without hiring a marketing team.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={startWithAlyn}>
              Start with ALYN <ArrowRight size={17} />
            </Button>
            <Button href="#how-it-works" variant="secondary">
              How It Works <ChevronRight size={17} />
            </Button>
          </div>
        </div>
        <HeroDashboard />
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

function ProblemSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Growth is broken for most businesses" />
        <div className="grid gap-5 md:grid-cols-3">
          {problems.map(({ title, copy, icon: Icon }) => (
            <div key={title} className="glass rounded-3xl p-6">
              <Icon className="mb-8 text-neon" size={28} />
              <h3 className="text-xl font-semibold">{title}</h3>
              <p className="mt-3 leading-7 text-white/[0.58]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Trusted by growing businesses" copy="Early-stage companies are already using ALYN to launch and optimize campaigns." />
        <div className="grid gap-5 md:grid-cols-3">
          {trustStats.map((stat) => (
            <div key={stat} className="glass rounded-3xl p-6">
              <h3 className="text-xl font-semibold">{stat}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="ALYN doesn’t just suggest. It executes." copy="ALYN turns diagnosis into shipped growth work, then learns from every signal." />
        <div className="grid gap-4 md:grid-cols-4">
          {solution.map(({ title, copy, icon: Icon, metric }) => (
            <div key={title} className="group rounded-3xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]">
              <div className="mb-8 flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                  <Icon size={22} />
                </span>
                <span className="text-xs text-white/[0.45]">{metric}</span>
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/[0.55]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyAlynSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Why ALYN works" />
        <div className="grid gap-4 md:grid-cols-3">
          {whyAlyn.map(({ title, copy }) => (
            <div key={title} className="group rounded-3xl border border-white/10 bg-white/[0.055] p-5 transition hover:-translate-y-1 hover:bg-white/[0.08]">
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/[0.55]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="How it works" />
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

function DashboardPreview() {
  return (
    <section id="dashboard" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Your growth, visible in one place." copy="No black-box marketing. See exactly what is happening." />
        <div className="glass overflow-hidden rounded-[2rem] p-4">
          <div className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-[#0d1222]/90 p-4 lg:grid-cols-12">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-3">
              <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Project stage</p>
              <h3 className="mt-3 text-2xl font-bold">Scale validation</h3>
              <div className="mt-5 space-y-3">
                {["Audit", "Strategy", "Execution", "Optimization"].map((item, index) => (
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
                <h3 className="font-semibold">Tasks list</h3>
              </div>
              <div className="space-y-3">
                {tasks.map(([task, status]) => (
                  <div key={task} className="flex items-center justify-between rounded-xl bg-white/[0.055] px-3 py-3 text-sm">
                    <span>{task}</span>
                    <span className="text-white/[0.45]">{status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LineChart size={18} className="text-neon" />
                  <h3 className="font-semibold">Campaign metrics</h3>
                </div>
                <span className="text-xs text-emerald-200">+19 leads this week</span>
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
                <h3 className="font-semibold">Content calendar</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {["Offer post", "Case study", "Email test", "Ad variant"].map((item) => (
                  <div key={item} className="min-h-24 rounded-xl border border-white/10 bg-white/[0.045] p-3 text-sm">
                    <p className="font-medium">{item}</p>
                    <p className="mt-5 text-xs text-white/[0.45]">Scheduled</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 lg:col-span-5">
              <div className="mb-4 flex items-center gap-2">
                <Bell size={18} className="text-neon" />
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="space-y-3 text-sm text-white/70">
                <p className="rounded-xl bg-emerald-400/10 p-3 text-emerald-100">New winning audience detected.</p>
                <p className="rounded-xl bg-white/[0.055] p-3">ALYN paused one low-performing creative.</p>
                <p className="rounded-xl bg-white/[0.055] p-3">Growth audit summary is ready for review.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesGrid() {
  return (
    <section id="services" className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <SectionHeading title="Not services. One growth system." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {services.map(({ title, copy, icon: Icon }) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5">
              <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                <Icon size={21} />
              </span>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/[0.55]">{copy}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OfferSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/[0.12] bg-gradient-to-br from-neon/25 via-white/[0.08] to-cyan-300/10 p-8 shadow-glass backdrop-blur-xl sm:p-12">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-100">Free audit</p>
            <h2 className="text-3xl font-bold sm:text-5xl">Start with a Free Growth Plan</h2>
            <p className="mt-4 text-lg text-white/[0.66]">See what to fix first and how ALYN would grow your business.</p>
          </div>
          <div className="rounded-3xl border border-white/[0.12] bg-[#0b0f1a]/[0.55] p-5">
            {["Visibility check", "Growth opportunities", "Action plan"].map((item) => (
              <div key={item} className="flex items-center gap-3 border-b border-white/10 py-4 last:border-0">
                <ShieldCheck className="text-emerald-300" size={20} />
                <span className="font-medium">{item}</span>
              </div>
            ))}
            <div className="mt-5">
              <Button onClick={startWithAlyn}>
                Start with ALYN <ArrowRight size={17} />
              </Button>
            </div>
            <p className="mt-4 text-sm text-white/[0.66]">Limited onboarding spots this month.</p>
            <p className="mt-2 text-sm text-white/[0.55]">We only work with a few businesses at a time to ensure performance.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-4 py-20 text-center sm:px-6 lg:px-8">
      <h2 className="text-4xl font-bold sm:text-6xl">Ready to stop guessing and start growing?</h2>
      <div className="mt-8">
        <Button onClick={startWithAlyn}>
          Start with ALYN <ArrowRight size={17} />
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/10 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-neon">
              <Sparkles size={18} />
            </span>
            <span className="text-lg font-bold">ALYN AI</span>
          </div>
          <p className="mt-3 max-w-md text-sm text-white/50">An intelligent growth system for businesses that need execution, clarity, and momentum.</p>
        </div>
        <div className="flex flex-wrap items-center gap-5 text-sm text-white/[0.55]">
          <a href="#" className="hover:text-white">Privacy</a>
          <a href="#" className="hover:text-white">Terms</a>
          <a href="#" className="hover:text-white">Contact</a>
          <a href="#" className="inline-flex items-center gap-2 hover:text-white">
            <Linkedin size={16} />
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <Header />
      <Hero />
      <ProblemSection />
      <TrustSection />
      <SolutionSection />
      <WhyAlynSection />
      <HowItWorks />
      <DashboardPreview />
      <ServicesGrid />
      <OfferSection />
      <FinalCta />
      <Footer />
    </main>
  );
}