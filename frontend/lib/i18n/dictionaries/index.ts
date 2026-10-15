import type { Locale } from "../config";
import { en, type Dictionary } from "./en";

export type { Dictionary, DictKey } from "./en";
export { en };

/**
 * Dictionary loaders. English is bundled; other languages are code-split.
 * FUTURE: a loader can instead fetch `${API_BASE_URL}/i18n/${locale}` so
 * translations (including AI-generated ones) are served by the backend.
 */
export const dictionaryLoaders: Record<Locale, () => Promise<Dictionary>> = {
  en: async () => en,
  sw: async () => (await import("./sw")).sw,
};

export async function loadDictionary(locale: Locale): Promise<Dictionary> {
  try {
    return await dictionaryLoaders[locale]();
  } catch {
    return en;
  }
}
