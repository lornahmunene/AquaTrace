"use client";

import { useMemo, useState } from "react";
import { FieldBlocksCard } from "@/components/farmer/FieldBlocksCard";
import { PageHeader } from "@/components/farmer/PageHeader";
import { RecommendationCard } from "@/components/farmer/RecommendationCard";
import { ScheduleList } from "@/components/farmer/ScheduleList";
import { Card, CardHeader, EmptyState, ErrorState, Segmented, Skeleton } from "@/components/ui/primitives";
import { useIrrigation } from "@/lib/hooks/useIrrigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ScheduleStatus } from "@/lib/types";
import { ymd } from "@/lib/utils/date";

type Scope = "upcoming" | "past" | "all";

export default function IrrigationPage() {
  const { t } = useI18n();
  const irrigation = useIrrigation();
  const [scope, setScope] = useState<Scope>("upcoming");
  const [crop, setCrop] = useState("all");
  const [status, setStatus] = useState<ScheduleStatus | "all">("all");

  const all = irrigation.schedules.data;
  const today = ymd(new Date());

  const crops = useMemo(() => [...new Set((all ?? []).map((s) => s.crop))], [all]);

  const filtered = useMemo(
    () =>
      (all ?? []).filter((s) => {
        if (scope === "upcoming" && s.date < today) return false;
        if (scope === "past" && s.date >= today) return false;
        if (crop !== "all" && s.crop !== crop) return false;
        if (status !== "all" && s.status !== status) return false;
        return true;
      }),
    [all, scope, crop, status, today],
  );

  const recs = (irrigation.recommendations.data ?? []).filter((r) => r.status !== "dismissed");
  const filtersActive = crop !== "all" || status !== "all" || scope !== "upcoming";

  return (
    <div>
      <PageHeader title={t("irrigation.title")} subtitle={t("irrigation.subtitle")} />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={t("schedule.title")}
              action={
                <Segmented<Scope>
                  value={scope}
                  onChange={setScope}
                  label={t("schedule.title")}
                  options={[
                    { value: "upcoming", label: t("schedule.scope.upcoming") },
                    { value: "past", label: t("schedule.scope.past") },
                    { value: "all", label: t("common.all") },
                  ]}
                />
              }
            />

            <div className="mb-4 grid grid-cols-2 gap-2.5 sm:max-w-md">
              <div>
                <label htmlFor="f-crop" className="label">
                  {t("schedule.filter.crop")}
                </label>
                <select id="f-crop" className="input" value={crop} onChange={(e) => setCrop(e.target.value)}>
                  <option value="all">{t("common.all")}</option>
                  {crops.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-status" className="label">
                  {t("schedule.filter.status")}
                </label>
                <select
                  id="f-status"
                  className="input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ScheduleStatus | "all")}
                >
                  <option value="all">{t("common.all")}</option>
                  {(["scheduled", "running", "completed", "skipped"] as const).map((s) => (
                    <option key={s} value={s}>
                      {t(`schedule.status.${s}`)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {irrigation.schedules.error ? (
              <ErrorState onRetry={irrigation.schedules.reload} />
            ) : !all ? (
              <Skeleton className="h-64" />
            ) : (
              <>
                <ScheduleList
                  schedules={filtered}
                  grouped
                  onChangeStatus={irrigation.changeStatus}
                  busyId={irrigation.busyId}
                />
                {filtersActive && filtered.length === 0 && (
                  <div className="mt-3 text-center">
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => {
                        setScope("upcoming");
                        setCrop("all");
                        setStatus("all");
                      }}
                    >
                      {t("common.clearFilters")}
                    </button>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title={t("reco.title")} subtitle={t("reco.disclaimer")} />
            {irrigation.recommendations.error ? (
              <ErrorState onRetry={irrigation.recommendations.reload} />
            ) : !irrigation.recommendations.data ? (
              <Skeleton className="h-48" />
            ) : recs.length === 0 ? (
              <EmptyState title={t("reco.empty")} />
            ) : (
              <div className="space-y-3">
                {recs.map((r) => (
                  <RecommendationCard
                    key={r.id}
                    rec={r}
                    busy={irrigation.busyId === r.id}
                    onApply={irrigation.applyRecommendation}
                    onDismiss={irrigation.dismissRecommendation}
                  />
                ))}
              </div>
            )}
          </Card>

          <FieldBlocksCard />
        </div>
      </div>
    </div>
  );
}
