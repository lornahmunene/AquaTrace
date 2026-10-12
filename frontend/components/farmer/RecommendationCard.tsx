"use client";

import { CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { Badge, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Priority, Recommendation } from "@/lib/types";

const priorityTone: Record<Priority, Tone> = { high: "red", medium: "amber", low: "slate" };

interface Props {
  rec: Recommendation;
  busy?: boolean;
  compact?: boolean;
  onApply: (id: string) => void;
  onDismiss: (id: string) => void;
}

export function RecommendationCard({ rec, busy, compact, onApply, onDismiss }: Props) {
  const { t, lt } = useI18n();
  const actionable = !!rec.patch;
  const applied = rec.status === "applied";

  return (
    <article
      className={cn(
        "rounded-xl border p-4",
        applied ? "border-leaf-200 bg-leaf-50/50" : "border-aqua-100 bg-gradient-to-br from-aqua-50/60 to-white",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-aqua-600 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <Badge tone={priorityTone[rec.priority]}>{t(`reco.priority.${rec.priority}`)}</Badge>
        {rec.generatedBy === "mock-rules" && <Badge tone="amber">{t("reco.sample")}</Badge>}
        {!actionable && <Badge tone="slate">{t("reco.advisory")}</Badge>}
      </div>

      <h3 className="text-sm font-semibold text-slate-900">{lt(rec.title)}</h3>
      {!compact && <p className="mt-1 text-sm text-slate-600">{lt(rec.detail)}</p>}

      <p className="mt-2 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
        <b className="text-leaf-700">{lt(rec.impact)}</b>
        <span>{t("reco.confidence", { pct: Math.round(rec.confidence * 100) })}</span>
      </p>

      <div className="mt-3 flex items-center gap-2">
        {applied ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-leaf-700">
            <CheckCircle2 className="h-4 w-4" />
            {t("reco.applied")}
          </span>
        ) : (
          <>
            {actionable && (
              <button className="btn-primary btn-sm" disabled={busy} onClick={() => onApply(rec.id)}>
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t("reco.apply")}
              </button>
            )}
            <button className="btn-ghost btn-sm" disabled={busy} onClick={() => onDismiss(rec.id)}>
              {t("reco.dismiss")}
            </button>
          </>
        )}
      </div>
    </article>
  );
}
