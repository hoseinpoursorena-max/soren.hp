"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["hoseinpour.sorena@gmail.com"];

type Customer = {
  id: string;
  business_name: string | null;
  industry: string | null;
  location: string | null;
  monthly_marketing_budget: string | null;
  created_at: string | null;
};

export default function AdminCustomersPage() {
  const router = useRouter();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const loadCustomers = async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error("ADMIN CUSTOMERS AUTH CHECK ERROR:", authError);
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

      const { data, error } = await supabase
        .from("business_profiles")
        .select("id, business_name, industry, location, monthly_marketing_budget, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("ADMIN CUSTOMERS FETCH ERROR:", error);
        return;
      }

      setCustomers((data ?? []) as Customer[]);
    };

    loadCustomers();
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
          Back
        </Link>
      </div>

      <section className="mx-auto max-w-7xl py-10">
        <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Admin CRM</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">Customers</h1>
        <p className="mt-3 text-sm text-white/[0.55]">Internal customer profiles created through onboarding.</p>
      </section>

      <section className="mx-auto max-w-7xl rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Users size={22} />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Customer Profiles</h2>
              <p className="mt-1 text-sm text-white/[0.55]">All real business profiles in Supabase.</p>
            </div>
          </div>
          <span className="w-fit rounded-full bg-white/[0.07] px-3 py-1 text-xs text-white/[0.58]">
            {customers.length} profile{customers.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="grid gap-3">
          {customers.length > 0 ? (
            customers.map((customer) => (
              <Link
                key={customer.id}
                href={`/admin/customers/${customer.id}`}
                className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:bg-white/[0.08] md:grid-cols-5 md:items-center"
              >
                <span>
                  <span className="block text-sm font-semibold text-white">{customer.business_name || "Unnamed customer"}</span>
                  <span className="mt-1 block text-xs text-white/[0.42]">
                    Created: {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "No date"}
                  </span>
                </span>
                <span className="text-sm text-white/[0.62]">{customer.industry || "No industry"}</span>
                <span className="text-sm text-white/[0.62]">{customer.location || "No location"}</span>
                <span className="text-sm text-white/[0.62]">{customer.monthly_marketing_budget || "No budget"}</span>
                <span className="text-sm text-white/[0.42]">{customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "No date"}</span>
              </Link>
            ))
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.62]">No customers yet</p>
          )}
        </div>
      </section>
    </main>
  );
}
