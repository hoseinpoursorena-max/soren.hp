import Link from "next/link";
import {
  ArrowRight,
  Check,
  CreditCard,
  Mail,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const plans = [
  {
    name: "Free Growth Audit",
    price: "€0",
    benefits: ["Visibility check", "Growth opportunities", "Action plan"]
  },
  {
    name: "Growth Sprint",
    price: "€1,500",
    benefits: ["Campaign launch", "AI content system", "Weekly optimization"]
  },
  {
    name: "Custom Growth System",
    price: "Custom",
    benefits: ["Full growth roadmap", "Multi-channel execution", "Reporting dashboard"]
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

function PaymentField({ label, placeholder, className = "" }: { label: string; placeholder: string; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-white/[0.72]">{label}</span>
      <input
        placeholder={placeholder}
        className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none placeholder:text-white/[0.38] focus:border-neon/60"
      />
    </label>
  );
}

export default function PaymentPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <div className="hidden items-center gap-3 sm:flex">
          <Link href="/login" className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/[0.15] bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.1]">
            Continue with Google
          </Link>
          <Link href="/dashboard" className="inline-flex min-h-10 items-center justify-center rounded-full bg-neon px-4 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
            Dashboard
          </Link>
        </div>
      </div>

      <section className="mx-auto max-w-7xl py-12 lg:py-20">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-neon">Pricing</p>
          <h1 className="text-4xl font-bold sm:text-6xl">Choose your Growth Plan</h1>
          <p className="mt-4 text-lg text-white/[0.62]">Mock pricing and payment UI for activating an ALYN growth system.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.name} className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-xl">
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              <p className="mt-3 text-4xl font-black">{plan.price}</p>
              <div className="mt-6 space-y-3">
                {plan.benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3 text-sm text-white/[0.72]">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-neon/[0.15] text-neon">
                      <Check size={14} />
                    </span>
                    {benefit}
                  </div>
                ))}
              </div>
              <button className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
                Activate Plan
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-xl">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                <ShieldCheck size={21} />
              </span>
              <div>
                <h2 className="text-xl font-bold">Secure checkout mock</h2>
                <p className="text-sm text-white/[0.55]">No real payment will be processed.</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-white/[0.62]">
              This frontend-only page shows how plan activation will look once billing is connected.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-6 shadow-glass backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <CreditCard size={20} className="text-neon" />
              <h2 className="text-xl font-bold">Payment details</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <PaymentField label="Cardholder name" placeholder="Soren Hansen" className="sm:col-span-2" />
              <PaymentField label="Card number" placeholder="4242 4242 4242 4242" className="sm:col-span-2" />
              <PaymentField label="Expiry" placeholder="MM / YY" />
              <PaymentField label="CVC" placeholder="123" />
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-white/[0.72]">Billing email</span>
                <span className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-white/[0.45]">
                  <Mail size={18} className="text-neon" />
                  <input
                    placeholder="billing@company.com"
                    className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/[0.38]"
                  />
                </span>
              </label>
            </div>
            <button className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
              Activate Plan
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
