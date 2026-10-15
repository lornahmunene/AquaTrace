"use client";

import { Badge, Card, CardHeader, ErrorState, SimulatedTag, Skeleton, type Tone } from "@/components/ui/primitives";
import { farmerApi } from "@/lib/api/farmer";
import { useAsync } from "@/lib/hooks/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { FieldBlock } from "@/lib/types";

function moistureState(b: FieldBlock): { key: "dry" | "optimal" | "wet"; tone: Tone } {
  if (b.soilMoisturePct < b.targetMinPct) return { key: "dry", tone: "amber" };
  if (b.soilMoisturePct > b.targetMaxPct) return { key: "wet", tone: "blue" };
  return { key: "optimal", tone: "green" };
}

export function FieldBlocksCard() {
  const { t } = useI18n();
  const { data, error, reload } = useAsync(() => farmerApi.getFieldBlocks(), []);
  const simulated = data?.some((b) => b.source !== "sensor");

  return (
    <Card>
      <CardHeader
        title={t("fields.title")}
        subtitle={t("fields.moisture")}
        action={simulated ? <SimulatedTag /> : undefined}
      />
      {error ? (
        <ErrorState onRetry={reload} />
      ) : !data ? (
        <Skeleton className="h-40" />
      ) : (
        <ul className="space-y-4">
          {data.map((b) => {
            const st = moistureState(b);
            return (
              <li key={b.id}>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {b.name} · {b.crop}
                  </p>
                  <Badge tone={st.tone}>
                    {t(`fields.${st.key}`)} · {b.soilMoisturePct}%
                  </Badge>
                </div>
                {/* track with target band and current marker */}
                <div className="relative h-3 rounded-full bg-slate-100">
                  <div
                    className="absolute inset-y-0 rounded-full bg-leaf-200"
                    style={{
                      left: `${b.targetMinPct}%`,
                      width: `${b.targetMaxPct - b.targetMinPct}%`,
                    }}
                  />
                  <div
                    className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua-700 ring-2 ring-white"
                    style={{ left: `${Math.min(99, Math.max(1, b.soilMoisturePct))}%` }}
                    aria-label={`${b.soilMoisturePct}%`}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {t("fields.target", { min: b.targetMinPct, max: b.targetMaxPct })} · {t(`schedule.method.${b.method}`)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
