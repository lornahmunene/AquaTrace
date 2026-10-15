"use client";

import { Timer } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { useDuration } from "@/lib/hooks/useDuration";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Issue } from "@/lib/types";
import { slaState } from "@/lib/utils/sla";

/** Response-time tag: overdue / due soon / how fast it was answered. */
export function SlaTag({ issue }: { issue: Issue }) {
  const { t } = useI18n();
  const dur = useDuration();
  const sla = slaState(issue);

  if (sla.kind === "none") return null;
  if (sla.kind === "overdue") {
    return (
      <Badge tone="red">
        <Timer className="h-3 w-3" />
        {t("inc.sla.overdue", { time: dur(sla.minutes) })}
      </Badge>
    );
  }
  if (sla.kind === "due") {
    return (
      <Badge tone={sla.minutes <= 30 ? "amber" : "slate"}>
        <Timer className="h-3 w-3" />
        {t("inc.sla.due", { time: dur(sla.minutes) })}
      </Badge>
    );
  }
  return (
    <Badge tone="green">
      <Timer className="h-3 w-3" />
      {t("inc.sla.met", { time: dur(sla.minutes) })}
    </Badge>
  );
}
