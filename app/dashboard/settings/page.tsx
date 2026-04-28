"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Sparkles, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["hoseinpour.sorena@gmail.com"];

type BusinessProfile = {
  id: string;
  business_name: string | null;
  industry: string | null;
  location: string | null;
  monthly_marketing_budget: string | null;
};

export default function CustomerSettingsPage() {
  const router = useRouter();
  const [profileId, setProfileId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setErrorMessage("");

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("SETTINGS USER FETCH ERROR:", userError);
        setErrorMessage(userError.message);
        setIsLoading(false);
        return;
      }

      if (!user) {
        router.push("/login");
        return;
      }

      if (user.email && ADMIN_EMAILS.includes(user.email)) {
        router.push("/admin");
        return;
      }

      const { data, error } = await supabase
        .from("business_profiles")
        .select("id, business_name, industry, location, monthly_marketing_budget")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("SETTINGS PROFILE FETCH ERROR:", error);
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      if (!data) {
        router.push("/onboarding");
        return;
      }

      const profile = data as BusinessProfile;
      setProfileId(profile.id);
      setBusinessName(profile.business_name || "");
      setIndustry(profile.industry || "");
      setLocation(profile.location || "");
      setBudget(profile.monthly_marketing_budget || "");
      setIsLoading(false);
    };

    loadProfile();
  }, [router]);

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      const message = userError?.message || "Please log in again.";
      console.error("SETTINGS SAVE USER ERROR:", userError);
      setErrorMessage(message);
      setIsSaving(false);
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("business_profiles")
      .update({
        business_name: businessName,
        industry,
        location,
        monthly_marketing_budget: budget
      })
      .eq("user_id", user.id)
      .eq("id", profileId);

    if (error) {
      console.error("SETTINGS PROFILE UPDATE ERROR:", error);
      setErrorMessage(error.message);
      setIsSaving(false);
      return;
    }

    setSuccessMessage("Saved successfully");
    setIsSaving(false);
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#0b0f1a_0%,#12172a_48%,#1a1f3a_100%)] px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.055] p-5 shadow-glass backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-white/[0.62] transition hover:text-white">
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>
            <div className="mt-5 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neon text-white shadow-glow">
                <Sparkles size={20} />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-neon">Customer settings</p>
                <h1 className="mt-1 text-3xl font-bold">Workspace settings</h1>
              </div>
            </div>
          </div>
          <span className="w-fit rounded-full border border-white/10 bg-white/[0.045] px-4 py-2 text-sm text-white/[0.58]">
            Customer only
          </span>
        </header>

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 p-4 text-sm font-semibold text-emerald-100">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-sm font-semibold text-red-100">
            {errorMessage}
          </div>
        ) : null}

        {isLoading ? (
          <section className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-xl">
            <p className="text-sm text-white/[0.58]">Loading settings...</p>
          </section>
        ) : (
          <div className="grid gap-6">
            <form onSubmit={handleSaveProfile} className="rounded-3xl border border-white/10 bg-white/[0.055] p-6 shadow-glass backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-neon/[0.15] text-neon">
                  <User size={20} />
                </span>
                <div>
                  <h2 className="text-2xl font-bold">Business profile</h2>
                  <p className="mt-1 text-sm text-white/[0.55]">Update the business context ALYN uses for your workspace.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {[
                  { label: "Business name", value: businessName, onChange: setBusinessName },
                  { label: "Industry", value: industry, onChange: setIndustry },
                  { label: "Location", value: location, onChange: setLocation },
                  { label: "Budget", value: budget, onChange: setBudget }
                ].map((field) => (
                  <label key={field.label} className="grid gap-2">
                    <span className="text-sm font-semibold text-white/[0.72]">{field.label}</span>
                    <input
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value)}
                      className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none placeholder:text-white/[0.36] focus:border-neon/60"
                    />
                  </label>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-neon px-5 text-sm font-semibold text-white shadow-glow transition hover:bg-[#7b73ff] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Save size={17} />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
