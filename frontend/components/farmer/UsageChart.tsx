"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardHeader,
  ErrorState,
  Segmented,
  Skeleton,
} from "@/components/ui/primitives";
import { farmerApi } from "@/lib/api/farmer";
import { useAsync } from "@/lib/hooks/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { UsageRange } from "@/lib/types";
import { CHART } from "./shared";

interface TipProps {
  active?: boolean;
  payload?: { payload: { name: string; used: number; allocated: number; over: boolean } }[];
}

export function UsageChart() {
  const { t, fmt } = useI18n();
  const [range, setRange] = useState<UsageRange>("7d");
  const [showAllocation, setShowAllocation] = useState(true);
  const { data, loading, error, reload } = useAsync(() => farmerApi.getUsage(range), [range]);

  const rows = useMemo(
    () =>
      (data ?? []).map((p) => ({
        name: fmt.date(`${p.date}T12:00:00`, { day: "numeric", month: "short" }),
        used: p.usedLitres,
        allocated: p.allocatedLitres,
        over: p.usedLitres > p.allocatedLitres,
      })),
    [data, fmt],
  );

  const total = rows.reduce((s, r) => s + r.used, 0);
  const avg = rows.length ? Math.round(total / rows.length) : 0;
  const overDays = rows.filter((r) => r.over).length;

  function ChartTip({ active, payload }: TipProps) {
    if (!active || !payload?.length) return null;
    const p = payload[0].payload;
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
        <p className="mb-1 font-semibold text-slate-900">{p.name}</p>
        <p className="text-slate-600">
          {t("usage.used")}: <b className="text-slate-900">{fmt.number(p.used)} {t("common.litres")}</b>
        </p>
        <p className="text-slate-600">
          {t("usage.allocated")}: <b className="text-slate-900">{fmt.number(p.allocated)} {t("common.litres")}</b>
        </p>
        {p.over && <p className="mt-1 font-semibold text-amber-700">⚠ {t("usage.overTag")}</p>}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader
        title={t("usage.title")}
        subtitle={t("usage.subtitle")}
        action={
          <Segmented<UsageRange>
            value={range}
            onChange={setRange}
            label={t("usage.title")}
            options={[
              { value: "7d", label: t("usage.range.7d") },
              { value: "14d", label: t("usage.range.14d") },
              { value: "30d", label: t("usage.range.30d") },
            ]}
          />
        }
      />

      {error ? (
        <ErrorState onRetry={reload} />
      ) : !data ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className={loading ? "opacity-60 transition" : "transition"}>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={18}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                    width={44}
                  />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(0,134,209,0.06)" }} />
                  <Bar dataKey="used" radius={[6, 6, 0, 0]} maxBarSize={28}>
                    {rows.map((r, i) => (
                      <Cell key={i} fill={r.over ? CHART.over : CHART.used} />
                    ))}
                  </Bar>
                  {showAllocation && (
                    <Line
                      dataKey="allocated"
                      type="monotone"
                      stroke={CHART.allocation}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      dot={false}
                      activeDot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART.used }} />
              {t("usage.used")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-2.5 w-2.5 rounded-sm" style={{ background: CHART.over }} />
              {t("usage.overTag")}
            </span>
            <label className="inline-flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={showAllocation}
                onChange={(e) => setShowAllocation(e.target.checked)}
                className="h-3.5 w-3.5 accent-leaf-600"
              />
              <i
                className="h-0 w-4 border-t-2 border-dashed"
                style={{ borderColor: CHART.allocation }}
              />
              {t("usage.showAllocation")}
            </label>
          </div>

          <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            <div>
              <dt className="text-xs text-slate-500">{t("usage.total")}</dt>
              <dd className="text-base font-bold text-slate-900 sm:text-lg">
                {fmt.number(total)} <span className="text-xs font-medium text-slate-500">{t("common.litres")}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t("usage.avg")}</dt>
              <dd className="text-base font-bold text-slate-900 sm:text-lg">
                {fmt.number(avg)} <span className="text-xs font-medium text-slate-500">{t("common.litres")}</span>
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t("usage.over")}</dt>
              <dd className="text-base font-bold text-slate-900 sm:text-lg">{overDays}</dd>
            </div>
          </dl>
        </>
      )}
    </Card>
  );
}
