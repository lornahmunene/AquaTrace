"use client";

import { Languages } from "lucide-react";
import { LOCALES, isLocale } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/I18nProvider";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("shell.language")}</span>
      <Languages className="pointer-events-none absolute left-2.5 h-4 w-4 text-aqua-700" />
      <select
        value={locale}
        onChange={(e) => isLocale(e.target.value) && setLocale(e.target.value)}
        className="h-9 cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-sm font-medium text-slate-700 hover:border-aqua-300 focus:outline-none focus:ring-2 focus:ring-aqua-200"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.native}
          </option>
        ))}
      </select>
    </label>
  );
}
