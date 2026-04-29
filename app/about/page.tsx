import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Compass,
  Rocket,
  Sparkles,
  Target,
  Zap
} from "lucide-react";

const sections = [
  {
    title: "Mission",
    copy: "Give businesses the execution power they need to grow without building a full marketing department.",
    icon: Target
  },
  {
    title: "Vision",
    copy: "A growth system where strategy, content, ads, optimization, and reporting work together in one intelligent platform.",
    icon: Compass
  },
  {
    title: "Why ALYN exists",
    copy: "Most businesses do not need more dashboards or strategy decks. They need clear priorities and consistent execution.",
    icon: Rocket
  },
  {
    title: "What makes ALYN different",
    copy: "ALYN combines AI speed with human strategy so growth work can move faster without losing direction.",
    icon: Zap
  }
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="ALYN AI home">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon shadow-glow">
        <Sparkles size={19} />
      </span>
      <span className="text-lg font-bold tracking-wide">ALYN AI</span>
    </Link>
  );
}

export default function AboutPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />

        <div className="hidden items-center gap-3 sm:flex">
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]"
          >
            Start with ALYN
          </Link>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-neon">
            About ALYN
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">
            ALYN is a growth execution system
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/[0.66]">
            ALYN is not an agency and not just an AI tool. It is built for businesses that need execution, clarity, and growth.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]"
            >
              Dashboard
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon text-white shadow-glow">
              <Bot size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-bold">AI speed + human strategy</h2>
              <p className="mt-1 text-sm text-white/[0.55]">
                Fast execution guided by real direction.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {["Plan", "Create", "Launch", "Optimize"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                <p className="text-xl font-bold">{item}</p>
                <p className="mt-2 text-sm text-white/[0.55]">
                  Part of one connected growth system.
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          {sections.map(({ title, copy, icon: Icon }) => (
            <div
              key={title}
              className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-xl"
            >
              <span className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                <Icon size={22} />
              </span>
              <h2 className="text-2xl font-bold">{title}</h2>
              <p className="mt-3 leading-7 text-white/[0.6]">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}