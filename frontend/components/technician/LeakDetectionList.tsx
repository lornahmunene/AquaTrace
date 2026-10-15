"use client";

import { Eye, Loader2, Plus, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge, EmptyState, ErrorState, SimulatedTag, Skeleton, type Tone } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTechnicianData } from "@/lib/state/TechnicianDataContext";
import type { DetectionStatus, ZoneId } from "@/lib/types";

const statusTone: Record<DetectionStatus, Tone> = {
  new: "amber",
  investigating: "blue",
  dismissed: "slate",
  converted: "green",
};
const order: Record<DetectionStatus, number> = { new: 0, investigating: 1, converted: 2, dismissed: 3 };

/** AI/rule-flagged possible leaks. Demo data is labelled as such. */
export function LeakDetectionList({ zone, limit }: { zone?: ZoneId | null; limit?: number }) {
  const { t, lt, fmt } = useI18n();
  const {
    detections,
    detectionsLoading,
    detectionsError,
    reloadDetections,
    investigateDetection,
    dismissDetection,
    createIncidentFromDetection,
    openIncident,
  } = useTechnicianData();
  const [busyId, setBusyId] = useState<string | null>(null);

  const items = useMemo(
    () =>
      detections
        .filter((d) => d.status !== "dismissed" && (!zone || d.zone === zone))
        .sort((a, b) => order[a.status] - order[b.status] || b.estLossLitresPerDay - a.estLossLitresPerDay)
        .slice(0, limit ?? 99),
    [detections, zone, limit],
  );
  const sample = detections.some((d) => d.generatedBy === "mock-rules");

  async function run(id: string, fn: (id: string) => Promise<void>) {
    setBusyId(id);
    await fn(id);
    setBusyId(null);
  }

  if (detectionsError) return <ErrorState onRetry={reloadDetections} />;
  if (detectionsLoading) return <Skeleton className="h-40" />;

  return (
    <div>
      {sample && (
        <p className="mb-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <SimulatedTag className="shrink-0" />
          <span>{t("leak.sampleNote")}</span>
        </p>
      )}
      {items.length === 0 ? (
        <EmptyState title={t("leak.empty")} />
      ) : (
        <ul className="space-y-3">
          {items.map((d) => {
            const busy = busyId === d.id;
            return (
              <li key={d.id} className="rounded-xl border border-slate-200 bg-white p-3.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="grid h-6 w-6 place-items-center rounded-md bg-aqua-600 text-white">
                    <Sparkles className="h-3.5 w-3.5" />
                  </span>
                  <Badge tone="slate">{t("net.zone", { id: d.zone })}</Badge>
                  <Badge tone={statusTone[d.status]}>{t(`leak.status.${d.status}`)}</Badge>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-slate-900">{lt(d.segment)}</h3>
                <p className="mt-0.5 text-sm text-slate-600">{lt(d.signal)}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <b className="text-red-700">{t("leak.estLoss", { n: fmt.number(d.estLossLitresPerDay) })}</b>
                  <span>{t("leak.confidence", { pct: Math.round(d.confidence * 100) })}</span>
                  <span>{t("leak.detected", { time: fmt.relative(d.detectedAt) })}</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {d.status === "converted" && d.incidentId ? (
                    <button className="btn-outline btn-sm" onClick={() => openIncident(d.incidentId!)}>
                      {t("leak.viewIncident", { id: d.incidentId })}
                    </button>
                  ) : (
                    <>
                      <button className="btn-primary btn-sm" disabled={busy} onClick={() => run(d.id, createIncidentFromDetection)}>
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        {t("leak.createIncident")}
                      </button>
                      {d.status === "new" && (
                        <button className="btn-outline btn-sm" disabled={busy} onClick={() => run(d.id, investigateDetection)}>
                          <Eye className="h-3.5 w-3.5" />
                          {t("leak.investigate")}
                        </button>
                      )}
                      <button className="btn-ghost btn-sm" disabled={busy} onClick={() => run(d.id, dismissDetection)}>
                        <X className="h-3.5 w-3.5" />
                        {t("leak.dismiss")}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
