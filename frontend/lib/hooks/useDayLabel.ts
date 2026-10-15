"use client";

import { useCallback } from "react";
import { addDays, ymd } from "@/lib/utils/date";
import { useI18n } from "@/lib/i18n/I18nProvider";

/** "Today" / "Tomorrow" / "Yesterday" or a short localized date for a yyyy-mm-dd string. */
export function useDayLabel() {
  const { t, fmt } = useI18n();
  return useCallback(
    (dateStr: string) => {
      const today = new Date();
      if (dateStr === ymd(today)) return t("common.today");
      if (dateStr === ymd(addDays(today, 1))) return t("common.tomorrow");
      if (dateStr === ymd(addDays(today, -1))) return t("common.yesterday");
      return fmt.date(`${dateStr}T12:00:00`);
    },
    [t, fmt],
  );
}
