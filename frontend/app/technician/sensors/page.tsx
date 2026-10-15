"use client";

import { FlaskConical, Radio, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { SENSOR_STATUSES, SENSOR_TYPES, SensorTable, sensorStatusTone } from "@/components/technician/SensorTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, Card, EmptyState, ErrorState, Skeleton } from "@/components/ui/primitives";
import { technicianApi } from "@/lib/api/technician";
import { cn } from "@/lib/cn";
import { useAsync } from "@/lib/hooks/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { SensorStatus, SensorType, ZoneId } from "@/lib/types";

const ZONES: ZoneId[] = ["A", "B", "C", "D"];

export default function SensorsPage() {
  const { t, lt } = useI18n();
  const { data, error, reload } = useAsync(() => technicianApi.getSensors(), []);
  const [status, setStatus] = useState<SensorStatus | "all">("all");
  const [type, setType] = useState<SensorType | "all">("all");
  const [zone, setZone] = useState<ZoneId | "all">("all");
  const [query, setQuery] = useState("");

  const sensors = data ?? [];
  const simulated = sensors.some((s) => s.source !== "sensor");

  const counts = useMemo(() => {
    const c: Record<SensorStatus, number> = { online: 0, low_battery: 0, offline: 0 };
    for (const s of sensors) c[s.status]++;
    return c;
  }, [sensors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sensors
      .filter((s) => {
        if (status !== "all" && s.status !== status) return false;
        if (type !== "all" && s.type !== type) return false;
        if (zone !== "all" && s.zone !== zone) return false;
        if (q && !`${s.id} ${lt(s.location)} ${t(`sen.type.${s.type}`)}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const rank = { offline: 0, low_battery: 1, online: 2 } as const;
        return rank[a.status] - rank[b.status] || a.id.localeCompare(b.id);
      });
  }, [sensors, status, type, zone, query, lt, t]);

  const filtersActive = status !== "all" || type !== "all" || zone !== "all" || !!query;

  return (
    <div>
      <PageHeader title={t("sen.title")} subtitle={t("sen.subtitle")} />

      {simulated && (
        <p className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" />
          {t("sen.note")}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {SENSOR_STATUSES.map((s) => {
          const active = status === s;
          return (
            <button
              key={s}
              onClick={() => setStatus(active ? "all" : s)}
              aria-pressed={active}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition",
                active ? "border-aqua-500 bg-aqua-50 ring-2 ring-aqua-200" : "border-slate-200 bg-white hover:border-aqua-300",
              )}
            >
              <span className="text-xl font-bold text-slate-900">{counts[s]}</span>
              <Badge tone={sensorStatusTone[s]}>{t(`sen.status.${s}`)}</Badge>
            </button>
          );
        })}
      </div>

      <div className="mb-4 grid gap-2.5 sm:grid-cols-[1fr_10rem_10rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder={t("sen.search")}
            aria-label={t("common.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select className="input" aria-label={t("sen.filter.type")} value={type} onChange={(e) => setType(e.target.value as SensorType | "all")}>
          <option value="all">{t("sen.filter.type")}: {t("common.all")}</option>
          {SENSOR_TYPES.map((x) => (
            <option key={x} value={x}>{t(`sen.type.${x}`)}</option>
          ))}
        </select>
        <select className="input" aria-label={t("sen.filter.zone")} value={zone} onChange={(e) => setZone(e.target.value as ZoneId | "all")}>
          <option value="all">{t("sen.filter.zone")}: {t("common.all")}</option>
          {ZONES.map((x) => (
            <option key={x} value={x}>{t("net.zone", { id: x })}</option>
          ))}
        </select>
      </div>

      <Card className="p-4">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <Skeleton className="h-64" />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Radio className="h-8 w-8" />}
            title={t("sen.empty")}
            action={
              filtersActive ? (
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => {
                    setStatus("all");
                    setType("all");
                    setZone("all");
                    setQuery("");
                  }}
                >
                  {t("common.clearFilters")}
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <p className="mb-2 text-xs text-slate-500">{t("sen.count", { n: filtered.length })}</p>
            <SensorTable sensors={filtered} />
          </>
        )}
      </Card>
    </div>
  );
}
