"use client";

import { CheckCircle2, CalendarClock, OctagonX, TriangleAlert } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Card,
  CardHeader,
  ErrorState,
  Segmented,
  SimulatedTag,
  Skeleton,
  type Tone,
} from "@/components/ui/primitives";
import { farmerApi } from "@/lib/api/farmer";
import { useAsync } from "@/lib/hooks/useAsync";
import { useDayLabel } from "@/lib/hooks/useDayLabel";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ymd } from "@/lib/utils/date";
import type { SupplyStatus, WaterOverview } from "@/lib/types";
import { CHART } from "./shared";

const LOW_PRESSURE_BAR = 1.5;

const statusMeta: Record<
  SupplyStatus,
  { tone: Tone; icon: typeof CheckCircle2; box: string }
> = {
  normal: { tone: "green", icon: CheckCircle2, box: "bg-leaf-50 text-leaf-800" },
  low_pressure: { tone: "amber", icon: TriangleAlert, box: "bg-amber-50 text-amber-800" },
  interrupted: { tone: "red", icon: OctagonX, box: "bg-red-50 text-red-700" },
  scheduled_outage: { tone: "amber", icon: CalendarClock, box: "bg-amber-50 text-amber-800" },
};

type Metric = "pressure" | "flow";

export function SupplyStatusCard({ overview }: { overview: WaterOverview | null }) {
  const { t, fmt, lt } = useI18n();
  const dayLabel = useDayLabel();
  const [metric, setMetric] = useState<Metric>("pressure");
  const trend = useAsync(() => farmerApi.getSupplyTrend(), []);

  const meta = overview ? statusMeta[overview.supplyStatus] : null;
  const StatusIcon = meta?.icon;

  const rows = (trend.data ?? []).map((r) => ({
    label: r.label,
    value: metric === "pressure" ? r.pressureBar : r.flowLpm,
  }));
  const unit = metric === "pressure" ? t("supply.bar") : t("supply.lpm");
  const color = metric === "pressure" ? CHART.pressure : CHART.flow;

  return (
    <Card>
      <CardHeader
        title={t("supply.title")}
        action={overview?.source !== "sensor" ? <SimulatedTag /> : <Badge tone="green">{t("supply.sensorReading")}</Badge>}
      />

      {!overview || !meta || !StatusIcon ? (
        <Skeleton className="h-72" />
      ) : (
        <>
          <div className={`flex items-start gap-3 rounded-xl p-3 ${meta.box}`}>
            <StatusIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="text-sm font-semibold">{t(`supply.status.${overview.supplyStatus}`)}</p>
              {overview.supplyStatusNote && (
                <p className="mt-0.5 text-xs opacity-90">{lt(overview.supplyStatusNote)}</p>
              )}
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t("supply.pressure")}</dt>
              <dd className="text-lg font-bold text-slate-900">
                {overview.pressureBar.toFixed(2)}{" "}
                <span className="text-xs font-medium text-slate-500">{t("supply.bar")}</span>
              </dd>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <dt className="text-xs text-slate-500">{t("supply.flow")}</dt>
              <dd className="text-lg font-bold text-slate-900">
                {overview.flowLpm}{" "}
                <span className="text-xs font-medium text-slate-500">{t("supply.lpm")}</span>
              </dd>
            </div>
          </dl>

          {overview.nextSupplyWindow && (
            <p className="mt-3 flex flex-wrap items-center gap-x-2 text-sm text-slate-600">
              <CalendarClock className="h-4 w-4 text-aqua-600" />
              <span>{t("supply.nextWindow")}:</span>
              <b className="text-slate-900">
                {dayLabel(ymd(new Date(overview.nextSupplyWindow.start)))},{" "}
                {fmt.time(overview.nextSupplyWindow.start)}–{fmt.time(overview.nextSupplyWindow.end)}
              </b>
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">{t("supply.trend")}</h3>
            <Segmented<Metric>
              value={metric}
              onChange={setMetric}
              label={t("supply.trend")}
              options={[
                { value: "pressure", label: t("supply.pressure") },
                { value: "flow", label: t("supply.flow") },
              ]}
            />
          </div>

          {trend.error ? (
            <ErrorState onRetry={trend.reload} />
          ) : !trend.data ? (
            <Skeleton className="mt-3 h-44" />
          ) : (
            <div className="mt-3 h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="supplyFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={28}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={metric === "pressure" ? [0, 3.5] : [0, "auto"]}
                    width={44}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${v} ${unit}`, metric === "pressure" ? t("supply.pressure") : t("supply.flow")]}
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  />
                  {metric === "pressure" && (
                    <ReferenceLine
                      y={LOW_PRESSURE_BAR}
                      stroke={CHART.danger}
                      strokeDasharray="4 4"
                      label={{
                        value: `${t("supply.threshold")} ${LOW_PRESSURE_BAR}`,
                        position: "insideTopRight",
                        fill: CHART.danger,
                        fontSize: 10,
                      }}
                    />
                  )}
                  <Area
                    dataKey="value"
                    type="monotone"
                    stroke={color}
                    strokeWidth={2}
                    fill="url(#supplyFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          <p className="mt-2 text-[11px] text-slate-400">
            {t("supply.updated", { time: fmt.time(overview.lastUpdated) })} ·{" "}
            {overview.source === "sensor" ? t("supply.sensorReading") : t("supply.simulatedReading")}
          </p>
        </>
      )}
    </Card>
  );
}
