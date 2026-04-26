"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Building2,
  Globe,
  MapPin,
  Sparkles,
  Target,
  Users
} from "lucide-react";

const channels = ["Meta", "Google", "TikTok", "LinkedIn", "SEO", "Content"];

const initialForm = {
  business_name: "",
  industry: "",
  location: "",
  number_of_employees: "",
  monthly_marketing_budget: "",
  main_growth_problem: "",
  website_url: ""
};

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
  value,
  onChange,
  placeholder,
  icon: Icon,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: typeof Building2;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-white/[0.72]">{label}</span>
      <span className="mt-2 flex min-h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-white/[0.45]">
        <Icon size={18} className="text-neon" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/[0.38]"
        />
      </span>
    </label>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [preferredChannels, setPreferredChannels] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const { user } = await getCurrentUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);
    };

    loadUser();
  }, [router]);

  const updateForm = (key: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleChannel = (channel: string) => {
    setPreferredChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    if (!userId) {
      setMessage("Please log in before completing onboarding.");
      setIsSubmitting(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("business_profiles").insert({
      user_id: userId,
      ...form,
      preferred_channels: preferredChannels
    });

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Logo />
        <Link href="/dashboard" className="hidden min-h-10 items-center justify-center rounded-full border border-white/[0.15] bg-white/[0.06] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.1] sm:inline-flex">
          Dashboard
        </Link>
      </div>

      <section className="mx-auto grid max-w-7xl items-start gap-10 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:py-20">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-neon">Business onboarding</p>
          <h1 className="text-4xl font-bold leading-tight sm:text-6xl">Tell ALYN what to grow</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-white/[0.62]">
            This profile becomes the foundation for your personalized dashboard, campaigns, orders, AI conversations, and reports.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {["Business context", "Growth priorities", "Channel focus", "Dashboard personalization"].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4">
                <Target size={19} className="mb-3 text-neon" />
                <p className="text-sm font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-glass backdrop-blur-xl sm:p-7">
          <h2 className="text-2xl font-bold">Business profile</h2>
          <p className="mt-2 text-sm text-white/[0.55]">Saved to Supabase and linked to your logged-in user.</p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <Field label="Business name" value={form.business_name} onChange={(value) => updateForm("business_name", value)} placeholder="ALYN Studio" icon={Building2} />
            <Field label="Industry" value={form.industry} onChange={(value) => updateForm("industry", value)} placeholder="SaaS, local service, ecommerce..." icon={Target} />
            <Field label="Location" value={form.location} onChange={(value) => updateForm("location", value)} placeholder="Berlin, Germany" icon={MapPin} />
            <Field label="Number of employees" value={form.number_of_employees} onChange={(value) => updateForm("number_of_employees", value)} placeholder="1-10" icon={Users} />
            <Field label="Monthly marketing budget" value={form.monthly_marketing_budget} onChange={(value) => updateForm("monthly_marketing_budget", value)} placeholder="€2,000" icon={Target} />
            <Field label="Website URL" value={form.website_url} onChange={(value) => updateForm("website_url", value)} placeholder="https://example.com" icon={Globe} type="url" />
          </div>

          <label className="mt-5 block">
            <span className="text-sm font-medium text-white/[0.72]">Main growth problem</span>
            <textarea
              value={form.main_growth_problem}
              onChange={(event) => updateForm("main_growth_problem", event.target.value)}
              placeholder="What is blocking growth right now?"
              className="mt-2 min-h-32 w-full rounded-2xl border border-white/10 bg-white/[0.055] p-4 text-sm text-white outline-none placeholder:text-white/[0.38] focus:border-neon/60"
            />
          </label>

          <div className="mt-5">
            <p className="text-sm font-medium text-white/[0.72]">Preferred channels</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {channels.map((channel) => {
                const selected = preferredChannels.includes(channel);

                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      selected
                        ? "border-neon bg-neon text-white shadow-glow"
                        : "border-white/10 bg-white/[0.055] text-white/[0.65] hover:bg-white/[0.09] hover:text-white"
                    }`}
                  >
                    {channel}
                  </button>
                );
              })}
            </div>
          </div>

          {message ? <p className="mt-5 rounded-2xl border border-white/10 bg-white/[0.055] p-3 text-sm text-white/[0.72]">{message}</p> : null}

          <button disabled={isSubmitting} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70">
            {isSubmitting ? "Saving profile..." : "Continue to Dashboard"}
            <ArrowRight size={17} />
          </button>
        </form>
      </section>
    </main>
  );
}
