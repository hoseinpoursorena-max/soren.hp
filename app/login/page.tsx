"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { getCurrentUser, getLatestBusinessProfileForUser, signInWithGoogle } from "@/lib/auth";

const ADMIN_EMAILS = ["hoseinpour.sorena@gmail.com"];

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

export default function LoginPage() {
  const router = useRouter();
  const [authMessage, setAuthMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const routeSignedInUser = async () => {
      const { user, error } = await getCurrentUser();

      if (error) {
        console.log("GOOGLE SESSION ERROR", error);
        setAuthMessage(error.message);
        setIsCheckingSession(false);
        return;
      }

      if (!user) {
        setIsCheckingSession(false);
        return;
      }

      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        router.push("/admin");
        return;
      }

      const { data: profile, error: profileError } = await getLatestBusinessProfileForUser(user.id);

      if (profileError) {
        console.log("PROFILE CHECK ERROR", profileError);
        setAuthMessage(profileError.message);
        setIsCheckingSession(false);
        return;
      }

      router.push(profile ? "/dashboard" : "/onboarding");
    };

    routeSignedInUser();
  }, [router]);

  const handleGoogleLogin = async () => {
    setAuthMessage("");
    setIsSubmitting(true);

    const { error } = await signInWithGoogle();

    if (error) {
      console.log("GOOGLE LOGIN ERROR", error);
      setAuthMessage(error.message);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <Link href="/" className="hidden min-h-10 items-center justify-center rounded-full border border-white/[0.15] bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.1] sm:inline-flex">
          Back home
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-neon">Secure access</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Start your ALYN workspace</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/[0.62]">
            Continue with Google to access your growth dashboard, onboarding, reports, and AI assistant without passwords.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {["Google-only access", "Growth plan visibility", "AI assistant ready", "Performance tracking"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <ShieldCheck size={19} className="mb-3 text-emerald-300" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-glass backdrop-blur-xl sm:p-7">
          <h2 className="text-2xl font-bold">Continue with Google</h2>
          <p className="mt-2 text-sm text-white/[0.55]">
            ALYN uses secure Google sign-in only. No passwords, no duplicate accounts, no friction.
          </p>

          {authMessage ? <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-100">{authMessage}</p> : null}

          <button onClick={handleGoogleLogin} disabled={isSubmitting || isCheckingSession} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-sm font-bold text-[#0b0f1a]">G</span>
            {isCheckingSession ? "Checking session..." : isSubmitting ? "Opening Google..." : "Continue with Google"}
            <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </main>
  );
}
