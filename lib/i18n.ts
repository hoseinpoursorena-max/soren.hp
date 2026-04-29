"use client";

import { useEffect, useState } from "react";

export type AppLanguage = "de" | "en";

export const APP_LANGUAGE_STORAGE_KEY = "alyn-public-language";

export function useAppLanguage(defaultLanguage: AppLanguage = "de") {
  const [language, setLanguage] = useState<AppLanguage>(defaultLanguage);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);

    if (storedLanguage === "de" || storedLanguage === "en") {
      setLanguage(storedLanguage);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  return { language, setLanguage };
}
