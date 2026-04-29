"use client";

import Link from "next/link";
import { ArrowRight, Bot, Compass, Rocket, Target, Zap } from "lucide-react";
import { BrandLogo } from "../BrandLogo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAppLanguage } from "@/lib/i18n";

const sectionIcons = [Target, Compass, Rocket, Zap] as const;

export default function AboutPage() {
  const { language, setLanguage } = useAppLanguage("de");

  const t = {
    de: {
      cta: "Mit ALYN starten",
      eyebrow: "Über ALYN",
      title: "ALYN ist ein Wachstumsausführungssystem",
      subtitle:
        "ALYN ist weder eine Agentur noch nur ein KI-Tool. Es ist für Unternehmen gebaut, die Umsetzung, Klarheit und Wachstum brauchen.",
      dashboard: "Dashboard",
      speedTitle: "KI-Geschwindigkeit + menschliche Strategie",
      speedCopy: "Schnelle Umsetzung mit echter Richtung dahinter.",
      flow: ["Planen", "Erstellen", "Launchen", "Optimieren"],
      flowCopy: "Teil eines verbundenen Wachstumssystems.",
      sections: [
        {
          title: "Mission",
          copy: "Unternehmen die Umsetzungskraft geben, die sie für Wachstum brauchen, ohne ein komplettes Marketing-Team aufbauen zu müssen."
        },
        {
          title: "Vision",
          copy: "Ein Wachstumssystem, in dem Strategie, Content, Ads, Optimierung und Reporting in einer intelligenten Plattform zusammenarbeiten."
        },
        {
          title: "Warum ALYN existiert",
          copy: "Die meisten Unternehmen brauchen nicht mehr Dashboards oder Strategiedecks. Sie brauchen klare Prioritäten und konsequente Umsetzung."
        },
        {
          title: "Was ALYN anders macht",
          copy: "ALYN verbindet KI-Geschwindigkeit mit menschlicher Strategie, damit Wachstumsarbeit schneller vorankommt, ohne die Richtung zu verlieren."
        }
      ]
    },
    en: {
      cta: "Start with ALYN",
      eyebrow: "About ALYN",
      title: "ALYN is a growth execution system",
      subtitle:
        "ALYN is not an agency and not just an AI tool. It is built for businesses that need execution, clarity, and growth.",
      dashboard: "Dashboard",
      speedTitle: "AI speed + human strategy",
      speedCopy: "Fast execution guided by real direction.",
      flow: ["Plan", "Create", "Launch", "Optimize"],
      flowCopy: "Part of one connected growth system.",
      sections: [
        {
          title: "Mission",
          copy: "Give businesses the execution power they need to grow without building a full marketing department."
        },
        {
          title: "Vision",
          copy: "A growth system where strategy, content, ads, optimization, and reporting work together in one intelligent platform."
        },
        {
          title: "Why ALYN exists",
          copy: "Most businesses do not need more dashboards or strategy decks. They need clear priorities and consistent execution."
        },
        {
          title: "What makes ALYN different",
          copy: "ALYN combines AI speed with human strategy so growth work can move faster without losing direction."
        }
      ]
    }
  }[language];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="ALYN AI home">
          <BrandLogo />
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          <LanguageSwitcher language={language} onChange={setLanguage} />
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]"
          >
            {t.cta}
          </Link>
        </div>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-neon">{t.eyebrow}</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/[0.66]">{t.subtitle}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]"
            >
              {t.dashboard}
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
              <h2 className="text-2xl font-bold">{t.speedTitle}</h2>
              <p className="mt-1 text-sm text-white/[0.55]">{t.speedCopy}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {t.flow.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                <p className="text-xl font-bold">{item}</p>
                <p className="mt-2 text-sm text-white/[0.55]">{t.flowCopy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl pb-16">
        <div className="grid gap-5 md:grid-cols-2">
          {t.sections.map(({ title, copy }, index) => {
            const Icon = sectionIcons[index];
            return (
              <div key={title} className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-xl">
                <span className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                  <Icon size={22} />
                </span>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="mt-3 leading-7 text-white/[0.6]">{copy}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
