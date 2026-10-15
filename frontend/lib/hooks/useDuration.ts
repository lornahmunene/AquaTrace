"use client";

import { useCallback } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** Formats minutes as "45 min", "3 h 20 min" or "2 d". */
export function useDuration() {
  const { t } = useI18n();
  return useCallback(
    (minutes: number) => {
      const m = Math.max(0, Math.round(minutes));
      if (m < 60) return `${m} ${t("common.min")}`;
      const h = Math.floor(m / 60);
      if (h >= 48) return `${Math.round(h / 24)} ${t("common.dayShort")}`;
      const r = m % 60;
      return r ? `${h} ${t("common.hourShort")} ${r} ${t("common.min")}` : `${h} ${t("common.hourShort")}`;
    },
    [t],
  );
}
