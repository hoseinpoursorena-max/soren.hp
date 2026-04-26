"use client";

import { useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  BarChart3,
  Bell,
  CircleDollarSign,
  Home,
  Megaphone,
  Settings,
  Sparkles,
  TrendingUp,
  User,
  Users
} from "lucide-react";

const sidebarItems = [
  { label: "Dashboard", href: "/dashboard", icon: Home, active: true },
  { label: "Analytics", href: "#", icon: BarChart3, active: false },
  { label: "Settings", href: "#", icon: Settings, active: false }
];

const metrics = [
  { label: "Leads", value: "5,284", change: "+18.2%", icon: Users },
  { label: "Conversion rate", value: "8.7%", change: "+2.4%", icon: TrendingUp },
  { label: "Revenue", value: "€42.8K", change: "+12.9%", icon: CircleDollarSign },
  { label: "Active campaigns", value: "14", change: "4 live tests", icon: Megaphone }
];

const chartData = [38, 52, 47, 69, 74, 66, 82, 91, 86, 104, 118, 132];

const campaigns = [
  ["Search Ads", "Running", "2,180 leads"],
  ["Retargeting", "Optimizing", "846 leads"],
  ["Content Sprint", "Scheduled", "18 assets"],
  ["Local SEO", "In progress", "42 pages"]
];

function Sidebar() {
  return (
    <aside className="border-b border-white/10 bg-[#0b0f1a]/75 px-4 py-4 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
      <div className="flex items-center justify-between gap-4 lg:block">
        <Link href="/" className="flex items-center gap-3" aria-label="ALYN AI home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon shadow-glow">
            <Sparkles size={19} />
          </span>
          <span className="text-lg font-bold tracking-wide">ALYN AI</span>
        </Link>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200 lg:mt-8 lg:inline-flex">
          Live system
        </span>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-10 lg:flex-col lg:overflow-visible">
        {sidebarItems.map(({ label, href, icon: Icon, active }) => (
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

function Topbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0b0f1a]/70 px-4 py-4 backdrop-blur-xl sm:px-6 lg:ml-72 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Growth command center</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.055] text-white/[0.7] transition hover:bg-white/[0.09] hover:text-white">
            <Bell size={18} />
          </button>
          <button className="flex min-h-11 items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] py-1 pl-2 pr-4 transition hover:bg-white/[0.09]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-neon text-white">
              <User size={16} />
            </span>
            <span className="hidden text-sm font-semibold sm:inline">Soren</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function MetricCards() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map(({ label, value, change, icon: Icon }) => (
        <div key={label} className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Icon size={22} />
            </span>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">{change}</span>
          </div>
          <p className="text-sm text-white/[0.55]">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
      ))}
    </section>
  );
}

function GrowthChart() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl lg:col-span-2">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Lead growth</h2>
          <p className="mt-1 text-sm text-white/[0.55]">Fake campaign data for the last 12 weeks.</p>
        </div>
        <span className="w-fit rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-200">+34.6% trend</span>
      </div>
      <div className="metric-grid h-80 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex h-full items-end gap-2 sm:gap-3">
          {chartData.map((value, index) => (
            <div key={value} className="flex h-full flex-1 flex-col justify-end gap-2">
              <span
                className="rounded-t-xl bg-gradient-to-t from-neon to-cyan-300 shadow-glow transition hover:opacity-80"
                style={{ height: `${value / 1.45}%` }}
              />
              <span className="text-center text-[10px] text-white/[0.38]">{index + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CampaignPanel() {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Campaigns</h2>
        <span className="rounded-full bg-white/[0.07] px-3 py-1 text-xs text-white/[0.58]">Live</span>
      </div>
      <div className="space-y-3">
        {campaigns.map(([name, status, result]) => (
          <div key={name} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{name}</h3>
                <p className="mt-1 text-sm text-white/[0.5]">{status}</p>
              </div>
              <span className="text-sm font-medium text-white/[0.72]">{result}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("test").select("*");
      console.log("SUPABASE DATA:", data);
      console.log("SUPABASE ERROR:", error);
    };

    fetchData();
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white">
      <Sidebar />
      <Topbar />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:ml-72 lg:px-8">
        <MetricCards />
        <div className="grid gap-6 lg:grid-cols-3">
          <GrowthChart />
          <CampaignPanel />
        </div>
      </div>
    </main>
  );
}
