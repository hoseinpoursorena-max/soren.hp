"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppLanguage } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, CreditCard, Sparkles } from "lucide-react";

const dealStatuses = ["draft", "proposed", "accepted", "rejected", "paid", "cancelled"] as const;
const ADMIN_EMAILS = ["hoseinpour.sorena@gmail.com"];
type DealStatus = (typeof dealStatuses)[number];

const getDealStatus = (status?: string | null): DealStatus => {
  const normalized = status?.toLowerCase().trim();
  return normalized && dealStatuses.includes(normalized as DealStatus) ? (normalized as DealStatus) : "draft";
};

type Customer = {
  id: string;
  business_name: string | null;
};

type Deal = {
  id: string;
  business_profile_id: string | null;
  title?: string | null;
  status?: string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  payment_status?: string | null;
  created_at?: string | null;
};

export default function AdminDealsPage() {
  const router = useRouter();
  const { language } = useAppLanguage("de");
  const t = {
    de: {
      back: "Zurück",
      crm: "Admin CRM",
      title: "Deals-Pipeline",
      subtitle: "Vollständige interne Pipeline, gruppiert nach Deal-Status.",
      loading: "Deals werden geladen...",
      empty: "Noch keine Deals. Erstelle den ersten Deal, um Umsatz zu verfolgen.",
      noDeals: "Keine Deals",
      noCustomer: "Kein Kunde",
      status: "Status",
      payment: "Zahlung",
      noDate: "Kein Datum",
      pending: "ausstehend",
      statuses: {
        draft: "Entwurf",
        proposed: "Vorgeschlagen",
        accepted: "Akzeptiert",
        rejected: "Abgelehnt",
        paid: "Bezahlt",
        cancelled: "Storniert"
      }
    },
    en: {
      back: "Back",
      crm: "Admin CRM",
      title: "Deals Pipeline",
      subtitle: "Full internal pipeline grouped by deal status.",
      loading: "Loading deals...",
      empty: "No deals yet. Create your first deal to start tracking revenue.",
      noDeals: "No deals",
      noCustomer: "No customer",
      status: "Status",
      payment: "Payment",
      noDate: "No date",
      pending: "pending",
      statuses: {
        draft: "Draft",
        proposed: "Proposed",
        accepted: "Accepted",
        rejected: "Rejected",
        paid: "Paid",
        cancelled: "Cancelled"
      }
    }
  }[language];
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isLoadingDeals, setIsLoadingDeals] = useState(true);
  const [dealsError, setDealsError] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadDeals = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("ADMIN DEALS AUTH CHECK ERROR:", authError);
      }

      if (!authData.user) {
        router.push("/login");
        return;
      }

      if (!authData.user.email || !ADMIN_EMAILS.includes(authData.user.email)) {
        router.push("/dashboard");
        return;
      }

      setIsCheckingAdmin(false);
      setIsLoadingDeals(true);
      setDealsError("");

      const { data: dealData, error: dealsError } = await supabase
        .from("customer_deals")
        .select("id, business_profile_id, title, status, total_amount, currency, payment_status, created_at")
        .order("created_at", { ascending: false });

      if (dealsError) {
        console.error("DEALS FETCH ERROR:", dealsError);
        setDealsError(dealsError.message);
        setIsLoadingDeals(false);
        return;
      }

      const nextDeals = (dealData ?? []) as Deal[];
      console.log(nextDeals);
      setDeals(nextDeals);

      const businessProfileIds = Array.from(
        new Set(nextDeals.map((deal) => deal.business_profile_id).filter(Boolean))
      ) as string[];

      if (businessProfileIds.length > 0) {
        const { data: customers, error: customersError } = await supabase
          .from("business_profiles")
          .select("id, business_name")
          .in("id", businessProfileIds);

        if (customersError) {
          console.error("DEALS CUSTOMERS FETCH ERROR:", customersError);
        } else {
          setCustomerNames(
            ((customers ?? []) as Customer[]).reduce<Record<string, string>>((acc, customer) => {
              acc[customer.id] = customer.business_name || "Unnamed customer";
              return acc;
            }, {})
          );
        }
      }

      setIsLoadingDeals(false);
    };

    loadDeals();
  }, [router]);

  if (isCheckingAdmin) {
    return <main className="min-h-screen bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] text-white" />;
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3" aria-label="Back to admin">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon shadow-glow">
            <Sparkles size={19} />
          </span>
          <span className="text-lg font-bold tracking-wide">ALYN AI Admin</span>
        </Link>
        <Link href="/admin" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
          <ArrowLeft size={16} />
          {t.back}
        </Link>
      </div>

      <section className="mx-auto max-w-7xl py-10">
        <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">{t.crm}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{t.title}</h1>
        <p className="mt-3 text-sm text-white/[0.55]">{t.subtitle}</p>
      </section>

      {dealsError ? (
        <section className="mx-auto max-w-7xl pb-6">
          <p className="rounded-3xl border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">{dealsError}</p>
        </section>
      ) : null}

      {isLoadingDeals ? (
        <section className="mx-auto max-w-7xl pb-10">
          <p className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 text-sm text-white/[0.58] shadow-glass backdrop-blur-xl">{t.loading}</p>
        </section>
      ) : deals.length === 0 ? (
        <section className="mx-auto max-w-7xl pb-10">
          <p className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 text-sm text-white/[0.58] shadow-glass backdrop-blur-xl">
            {t.empty}
          </p>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-4 pb-10 xl:grid-cols-6">
        {dealStatuses.map((status) => {
          const statusDeals = deals.filter((deal) => getDealStatus(deal.status) === status);

          return (
            <div key={status} className="flex max-h-[680px] min-h-[420px] flex-col rounded-3xl border border-white/10 bg-white/[0.055] p-4 shadow-glass backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={17} className="text-neon" />
                  <h2 className="text-sm font-semibold capitalize">{t.statuses[status]}</h2>
                </div>
                <span className="rounded-full bg-white/[0.07] px-2 py-1 text-xs text-white/[0.5]">{statusDeals.length}</span>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {statusDeals.length > 0 ? (
                  statusDeals.map((deal) => {
                    const customerName = deal.business_profile_id
                      ? customerNames[deal.business_profile_id] || deal.business_profile_id
                      : t.noCustomer;

                    return (
                      <Link
                        key={deal.id}
                        href={`/admin/deals/${deal.id}`}
                        className="block w-full rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-left transition hover:bg-white/[0.08]"
                      >
                        <p className="text-sm font-semibold text-white">{deal.title || deal.id}</p>
                        <p className="mt-1 text-xs text-white/[0.5]">{customerName}</p>
                        <p className="mt-3 text-sm font-semibold text-white/[0.72]">{deal.total_amount ?? "0"} {deal.currency || "EUR"}</p>
                        <p className="mt-1 text-xs text-white/[0.42]">{t.status}: {t.statuses[getDealStatus(deal.status)]}</p>
                        <p className="mt-1 text-xs text-white/[0.42]">{t.payment}: {deal.payment_status || t.pending}</p>
                        <p className="mt-1 text-xs text-white/[0.42]">{deal.created_at ? new Date(deal.created_at).toLocaleDateString() : t.noDate}</p>
                      </Link>
                    );
                  })
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-xs text-white/[0.42]">{t.noDeals}</p>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
