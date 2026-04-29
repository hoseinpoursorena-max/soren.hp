"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ClipboardList, CreditCard, Users } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAppLanguage } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { BrandLogo } from "../BrandLogo";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage } = useAppLanguage("de");
  const t = {
    de: {
      overview: "Übersicht",
      customers: "Kunden",
      deals: "Deals",
      tasks: "Aufgaben",
      logout: "Abmelden",
      internalOs: "Interne Plattform"
    },
    en: {
      overview: "Overview",
      customers: "Customers",
      deals: "Deals",
      tasks: "Tasks",
      logout: "Logout",
      internalOs: "Internal OS"
    }
  }[language];
  const navItems = [
    { label: t.overview, href: "/admin", icon: BarChart3 },
    { label: t.customers, href: "/admin/customers", icon: Users },
    { label: t.deals, href: "/admin/deals", icon: CreditCard },
    { label: t.tasks, href: "/admin/tasks", icon: ClipboardList }
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white">
      <div className="fixed right-4 top-4 z-50 sm:right-6">
        <div className="flex items-center gap-3">
          <LanguageSwitcher language={language} onChange={setLanguage} />
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-white/[0.72] shadow-glass backdrop-blur-xl transition hover:bg-white/[0.09] hover:text-white"
          >
            {t.logout}
          </button>
        </div>
      </div>

      <aside className="border-b border-white/10 bg-[#0b0f1a]/75 px-4 py-4 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-72 lg:border-b-0 lg:border-r lg:px-6 lg:py-6">
        <div className="flex items-center justify-between gap-4 lg:block">
          <Link href="/" className="flex items-center gap-3" aria-label="ALYN AI home">
            <BrandLogo />
          </Link>
          <span className="rounded-full border border-neon/30 bg-neon/10 px-3 py-1 text-xs font-medium text-white lg:mt-8 lg:inline-flex">
            {t.internalOs}
          </span>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto lg:mt-10 lg:flex-col lg:overflow-visible">
          {navItems.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/admin"
                ? pathname === "/admin"
                : pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={label}
                href={href}
                className={`flex min-h-11 shrink-0 items-center gap-3 rounded-2xl px-4 text-sm font-medium transition ${
                  isActive
                    ? "bg-neon text-white shadow-glow"
                    : "border border-white/10 bg-white/[0.045] text-white/[0.62] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-72">{children}</div>
    </div>
  );
}
