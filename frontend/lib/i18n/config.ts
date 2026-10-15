/**
 * Language configuration.
 *
 * To add a language (e.g. Kikamba, widely spoken in Makueni):
 *  1. Add an entry to LOCALES.
 *  2. Create lib/i18n/dictionaries/<code>.ts exporting a full `Dictionary`.
 *  3. Register it in `dictionaryLoaders` (lib/i18n/dictionaries/index.ts).
 * Missing keys fall back to English automatically.
 */
export const LOCALES = [
  { code: "en", label: "English", native: "English", intl: "en-KE" },
  { code: "sw", label: "Swahili", native: "Kiswahili", intl: "sw-KE" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "aquatrace.locale";

export function isLocale(value: unknown): value is Locale {
  return LOCALES.some((l) => l.code === value);
}

export function intlLocale(locale: Locale): string {
  return LOCALES.find((l) => l.code === locale)?.intl ?? "en-KE";
}

/**
 * Text coming from the backend / mock data. The backend can either return a
 * plain string (already translated for the request's Accept-Language) or a map
 * of locale -> string. `useI18n().lt()` resolves either shape.
 */
export type Text = string | Partial<Record<Locale, string>>;

/** Small helper for authoring bilingual sample content. */
export function L(en: string, sw: string): Text {
  return { en, sw };
}
