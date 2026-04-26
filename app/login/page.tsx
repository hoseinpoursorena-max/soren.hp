import Link from "next/link";
import {
  ArrowRight,
  Facebook,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const codeDigits = ["2", "8", "4", "9", "1", "6"];

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

function Field({
  label,
  placeholder,
  type = "text",
  icon: Icon
}: {
  label: string;
  placeholder: string;
  type?: string;
  icon: typeof Mail;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/[0.72]">{label}</span>
      <span className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-white/[0.45]">
        <Icon size={18} className="text-neon" />
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/[0.38]"
        />
      </span>
    </label>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <Link href="/dashboard" className="hidden min-h-10 items-center justify-center rounded-full border border-white/[0.15] bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.1] sm:inline-flex">
          Dashboard
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-neon">Secure access</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Log in to your growth system</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/[0.62]">
            Access campaign progress, AI recommendations, lead metrics, and execution tasks in one ALYN dashboard.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {["Campaign execution", "Growth plan visibility", "AI assistant ready", "Performance tracking"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <ShieldCheck size={19} className="mb-3 text-emerald-300" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-glass backdrop-blur-xl sm:p-7">
            <h2 className="text-2xl font-bold">Login or create account</h2>
            <p className="mt-2 text-sm text-white/[0.55]">Mock authentication UI only. No real sign-in is connected yet.</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold transition hover:bg-white/[0.09]">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold text-[#0b0f1a]">G</span>
                Continue with Google
              </button>
              <button className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm font-semibold transition hover:bg-white/[0.09]">
                <Facebook size={18} className="text-neon" />
                Continue with Facebook
              </button>
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <h3 className="font-semibold">Email access</h3>
                <Field label="Email" placeholder="you@company.com" type="email" icon={Mail} />
                <Field label="Password" placeholder="••••••••" type="password" icon={KeyRound} />
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold">Mobile access</h3>
                <Field label="Mobile number" placeholder="+49 151 000000" type="tel" icon={Phone} />
                <Field label="Password" placeholder="••••••••" type="password" icon={KeyRound} />
              </div>
            </div>

            <Link href="/dashboard" className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
              Continue to Dashboard
              <ArrowRight size={17} />
            </Link>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl sm:p-7">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                <ShieldCheck size={21} />
              </span>
              <div>
                <h2 className="text-xl font-bold">Enter verification code</h2>
                <p className="text-sm text-white/[0.55]">We sent a 6 digit code to your login method.</p>
              </div>
            </div>
            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {codeDigits.map((digit, index) => (
                <input
                  key={`${digit}-${index}`}
                  value={digit}
                  readOnly
                  className="h-12 rounded-2xl border border-white/10 bg-white/[0.055] text-center text-lg font-bold text-white outline-none focus:border-neon/60 sm:h-14"
                />
              ))}
            </div>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button className="text-sm font-semibold text-white/[0.62] transition hover:text-white">Resend code</button>
              <Link href="/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff]">
                Verify and continue
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
