"use client";

import { AppLanguage } from "@/lib/i18n";

export function LanguageSwitcher({
  language,
  onChange
}: {
  language: AppLanguage;
  onChange: (language: AppLanguage) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] p-1">
      {(["de", "en"] as const).map((value) => {
        const isActive = language === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isActive ? "bg-neon text-white shadow-glow" : "text-white/[0.62] hover:text-white"
            }`}
          >
            {value.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
