"use client";
import { useLocale } from "./locale-context";
import { dictionary, type TranslationKey } from "./dictionary";

export function useTranslation() {
  const { locale } = useLocale();
  const dict = dictionary[locale];

  function t(
    key: TranslationKey | string,
    vars?: Record<string, string | number> & { fallback?: string }
  ): string {
    const raw = (dict as Record<string, string>)[key] ?? vars?.fallback ?? key;
    if (!vars) return raw;
    return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ""));
  }

  return { t, locale };
}
