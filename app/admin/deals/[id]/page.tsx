import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { ArrowLeft, CreditCard, FileText, Sparkles, Users } from "lucide-react";
import { InvoicePaymentActions } from "./InvoicePaymentActions";
import { AdminRouteGuard } from "../../AdminRouteGuard";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Deal = {
  id: string;
  business_profile_id?: string | null;
  title?: string | null;
  status?: string | null;
  pricing_strategy?: string | null;
  subtotal?: number | string | null;
  discount_amount?: number | string | null;
  total_amount?: number | string | null;
  currency?: string | null;
  payment_status?: string | null;
  customer_message?: string | null;
  internal_notes?: string | null;
  created_at?: string | null;
};

type Customer = {
  id: string;
  business_name?: string | null;
  industry?: string | null;
  location?: string | null;
  monthly_marketing_budget?: string | null;
};

type DealItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  pricing_model?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  management_fee_percent?: number | string | null;
  discount_amount?: number | string | null;
  final_price?: number | string | null;
  total_amount?: number | string | null;
  total?: number | string | null;
};

const getValue = (value: number | string | null | undefined, fallback = "Not set") => {
  if (value === null || value === undefined || value === "") return fallback;
  return value;
};

const formatDate = (value?: string | null) => {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString();
};

const getPaymentStatusLabel = (status?: string | null) => {
  if (status === "paid") return "Paid";
  if (status === "sent") return "Invoice sent";
  return "Pending payment";
};

const getPaymentStatusClassName = (status?: string | null) => {
  if (status === "paid") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "sent") return "border-neon/30 bg-neon/10 text-white";
  return "border-white/10 bg-white/[0.055] text-white/[0.72]";
};

export default async function AdminDealDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams?: { invoice?: string };
}) {
  const dealId = params.id;
  const showInvoice = searchParams?.invoice === "1";

  async function markAsSent() {
    "use server";

    const { error } = await supabase
      .from("customer_deals")
      .update({ payment_status: "sent" })
      .eq("id", dealId);

    if (error) {
      console.error("INVOICE MARK AS SENT ERROR:", error);
      return;
    }

    revalidatePath(`/admin/deals/${dealId}`);
  }

  async function markAsPaid() {
    "use server";

    const { error } = await supabase
      .from("customer_deals")
      .update({ payment_status: "paid", status: "paid" })
      .eq("id", dealId);

    if (error) {
      console.error("INVOICE MARK AS PAID ERROR:", error);
      return;
    }

    revalidatePath(`/admin/deals/${dealId}`);
  }

  const { data: dealData, error: dealError } = await supabase
    .from("customer_deals")
    .select("id, title, status, pricing_strategy, subtotal, discount_amount, total_amount, currency, payment_status, customer_message, internal_notes, created_at, business_profile_id")
    .eq("id", dealId)
    .maybeSingle();

  if (dealError) {
    console.error("DEAL FETCH ERROR:", dealError);
  }

  const deal = dealData as Deal | null;

  let customer: Customer | null = null;

  if (deal?.business_profile_id) {
    const { data: customerData, error: customerError } = await supabase
      .from("business_profiles")
      .select("id, business_name, industry, location, monthly_marketing_budget")
      .eq("id", deal.business_profile_id)
      .maybeSingle();

    if (customerError) {
      console.error("DEAL CUSTOMER FETCH ERROR:", customerError);
    } else {
      customer = (customerData as Customer | null) ?? null;
    }
  }

  const { data: itemData, error: itemError } = await supabase
    .from("deal_items")
    .select("*")
    .eq("deal_id", dealId);

  if (itemError) {
    console.error("DEAL ITEMS FETCH ERROR:", itemError);
  }

  const items = (itemData ?? []) as DealItem[];
  const invoiceTitle = `Invoice - ${deal?.title || "Deal"}`;
  const currency = deal?.currency || "EUR";
  const subtotal = getValue(deal?.subtotal);
  const discount = getValue(deal?.discount_amount);
  const totalAmount = getValue(deal?.total_amount);
  const paymentStatus = deal?.payment_status || "unpaid";
  const paymentStatusLabel = getPaymentStatusLabel(paymentStatus);
  const paymentStatusClassName = getPaymentStatusClassName(paymentStatus);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <AdminRouteGuard />
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link href="/admin/deals" className="flex items-center gap-3" aria-label="Back to deals">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon shadow-glow">
            <Sparkles size={19} />
          </span>
          <span className="text-lg font-bold tracking-wide">ALYN AI Admin</span>
        </Link>
        <Link href="/admin/deals" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold text-white/[0.72] transition hover:bg-white/[0.09] hover:text-white">
          <ArrowLeft size={16} />
          Back
        </Link>
      </div>

      <section className="mx-auto max-w-7xl py-10">
        <p className="text-xs uppercase tracking-[0.24em] text-white/[0.45]">Deal</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-5xl">{deal?.title || "Deal detail"}</h1>
        <p className="mt-3 text-sm text-white/[0.55]">Internal pricing, customer context, payment status, and service items.</p>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 pb-10">
        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <CreditCard size={22} />
            </span>
            <h2 className="text-xl font-semibold">Deal Overview</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <p className="text-sm text-white/[0.55]">Status: {deal?.status || "Not set"}</p>
            <p className="text-sm text-white/[0.55]">Payment status: {paymentStatusLabel}</p>
            <p className="text-sm text-white/[0.55]">Created: {formatDate(deal?.created_at)}</p>
            <p className="text-sm text-white/[0.55]">Business profile ID: {deal?.business_profile_id || "Not set"}</p>
          </div>
          <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${paymentStatusClassName}`}>
            {paymentStatusLabel}
          </span>
          <Link
            href={`/admin/deals/${dealId}?invoice=1`}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]"
          >
            Generate Invoice
          </Link>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <Users size={22} />
            </span>
            <h2 className="text-xl font-semibold">Customer Info</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <p className="text-sm text-white/[0.55]">Business: {customer?.business_name || "Not set"}</p>
            <p className="text-sm text-white/[0.55]">Industry: {customer?.industry || "Not set"}</p>
            <p className="text-sm text-white/[0.55]">Location: {customer?.location || "Not set"}</p>
            <p className="text-sm text-white/[0.55]">Budget: {customer?.monthly_marketing_budget || "Not set"}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <h2 className="text-xl font-semibold">Pricing Strategy</h2>
          <p className="mt-3 text-sm leading-6 text-white/[0.62]">{deal?.pricing_strategy || "No pricing strategy saved."}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <p className="text-sm text-white/[0.55]">Subtotal: {getValue(deal?.subtotal)} {currency}</p>
            <p className="text-sm text-white/[0.55]">Discount: {getValue(deal?.discount_amount)} {currency}</p>
            <p className="text-sm text-white/[0.55]">Total: {getValue(deal?.total_amount)} {currency}</p>
            <p className="text-sm text-white/[0.55]">Payment: {paymentStatusLabel}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Customer Message</h2>
            <p className="mt-3 text-sm leading-6 text-white/[0.62]">{deal?.customer_message || "No customer message."}</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Internal Notes</h2>
            <p className="mt-3 text-sm leading-6 text-white/[0.62]">{deal?.internal_notes || "No internal notes."}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
          <div className="mb-5 flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
              <FileText size={22} />
            </span>
            <h2 className="text-xl font-semibold">Deal Items</h2>
          </div>
          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="font-semibold">{item.title || item.name || "Deal item"}</p>
                  <p className="mt-1 text-sm text-white/[0.55]">{item.description || "No description"}</p>
                  <p className="mt-2 text-sm text-white/[0.62]">Qty: {getValue(item.quantity, "1")} | Unit: {getValue(item.unit_price)} | Total: {getValue(item.final_price ?? item.total_amount ?? item.total)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-white/[0.55]">No deal items yet.</p>
            )}
          </div>
        </section>

        {showInvoice ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                  <FileText size={22} />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">{invoiceTitle}</h2>
                  <p className="mt-1 text-sm text-white/[0.55]">Invoice date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <InvoicePaymentActions
                markAsSent={markAsSent}
                markAsPaid={markAsPaid}
                paymentStatus={paymentStatus}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <p className="text-sm text-white/[0.55]">Customer: {customer?.business_name || "Not set"}</p>
              <p className="text-sm text-white/[0.55]">Deal: {deal?.title || "Untitled deal"}</p>
              <p className="text-sm text-white/[0.55]">Payment status: {paymentStatusLabel}</p>
            </div>
            <span className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${paymentStatusClassName}`}>
              {paymentStatusLabel}
            </span>

            <div className="mt-6 space-y-3">
              {items.length > 0 ? (
                items.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{item.title || item.name || "Deal item"}</p>
                        <p className="mt-1 text-sm leading-6 text-white/[0.55]">{item.description || "No description"}</p>
                      </div>
                      <p className="text-sm font-semibold text-white/[0.76]">
                        {getValue(item.final_price ?? item.total_amount ?? item.total)} {currency}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-5">
                      <p className="text-xs text-white/[0.5]">Pricing model: {item.pricing_model || "Not set"}</p>
                      <p className="text-xs text-white/[0.5]">Unit price: {getValue(item.unit_price)} {currency}</p>
                      <p className="text-xs text-white/[0.5]">Management fee: {getValue(item.management_fee_percent)}</p>
                      <p className="text-xs text-white/[0.5]">Discount: {getValue(item.discount_amount)} {currency}</p>
                      <p className="text-xs text-white/[0.5]">Final price: {getValue(item.final_price ?? item.total_amount ?? item.total)} {currency}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                  <p className="font-semibold">{deal?.title || "Deal invoice"}</p>
                  <p className="mt-3 text-sm text-white/[0.55]">Subtotal: {subtotal} {currency}</p>
                  <p className="mt-1 text-sm text-white/[0.55]">Discount amount: {discount} {currency}</p>
                  <p className="mt-1 text-sm text-white/[0.55]">Total amount: {totalAmount} {currency}</p>
                  <p className="mt-1 text-sm text-white/[0.55]">Payment status: {paymentStatusLabel}</p>
                </div>
              )}
            </div>

            <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-4">
              <p className="text-sm text-white/[0.55]">Subtotal: {subtotal} {currency}</p>
              <p className="text-sm text-white/[0.55]">Discount: {discount} {currency}</p>
              <p className="text-sm font-semibold text-white">Total amount: {totalAmount} {currency}</p>
              <p className="text-sm text-white/[0.55]">Currency: {currency}</p>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
