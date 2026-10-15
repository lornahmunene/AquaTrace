"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setApiLocale } from "@/lib/api/client";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  intlLocale,
  isLocale,
  type Locale,
  type Text,
} from "./config";
import { en, loadDictionary, type DictKey, type Dictionary } from "./dictionaries";

type Vars = Record<string, string | number>;

interface Formatters {
  number: (n: number, opts?: Intl.NumberFormatOptions) => string;
  time: (iso: string) => string;
  date: (iso: string, opts?: Intl.DateTimeFormatOptions) => string;
  relative: (iso: string) => string;
}

interface I18nValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a UI string key. Falls back to English, then to the key. */
  t: (key: DictKey, vars?: Vars) => string;
  /** Resolve backend/mock text (plain string or per-locale map). */
  lt: (text: Text | undefined) => string;
  fmt: Formatters;
}

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [dict, setDict] = useState<Dictionary>(en);

  // Restore saved language (client only, avoids SSR mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved)) setLocaleState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setApiLocale(locale);
    document.documentElement.lang = locale;
    loadDictionary(locale).then((d) => {
      if (!cancelled) setDict(d);
    });
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: DictKey, vars?: Vars) => interpolate(dict[key] ?? en[key] ?? key, vars),
    [dict],
  );

  const lt = useCallback(
    (text: Text | undefined) => {
      if (!text) return "";
      if (typeof text === "string") return text;
      return text[locale] ?? text.en ?? Object.values(text)[0] ?? "";
    },
    [locale],
  );

  const fmt = useMemo<Formatters>(() => {
    const tag = intlLocale(locale);
    return {
      number: (n, opts) => new Intl.NumberFormat(tag, opts).format(n),
      time: (iso) =>
        new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit", hour12: false }).format(
          new Date(iso),
        ),
      date: (iso, opts) =>
        new Intl.DateTimeFormat(
          tag,
          opts ?? { weekday: "short", day: "numeric", month: "short" },
        ).format(new Date(iso)),
      relative: (iso) => {
        const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
        const rtf = new Intl.RelativeTimeFormat(tag, { numeric: "auto" });
        const abs = Math.abs(diffSec);
        if (abs < 60) return rtf.format(Math.round(diffSec / 1) , "second");
        if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
        if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
        return rtf.format(Math.round(diffSec / 86400), "day");
      },
    };
  }, [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, t, lt, fmt }),
    [locale, setLocale, t, lt, fmt],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
