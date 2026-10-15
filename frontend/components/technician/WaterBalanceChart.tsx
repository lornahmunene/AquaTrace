"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART } from "@/components/common/chart";
import { Card, CardHeader, ErrorState, Segmented, SimulatedTag, Skeleton } from "@/components/ui/primitives";
import { technicianApi } from "@/lib/api/technician";
import { useAsync } from "@/lib/hooks/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { UsageRange } from "@/lib/types";

export function WaterBalanceChart() {
  const { t, fmt } = useI18n();
  const [range, setRange] = useState<UsageRange>("14d");
  const { data, loading, error, reload } = useAsync(() => technicianApi.getWaterBalance(range), [range]);

  const rows = useMemo(
    () =>
      (data ?? []).map((p) => ({
        name: fmt.date(`${p.date}T12:00:00`, { day: "numeric", month: "short" }),
        inflow: p.inflowLitres,
        consumed: p.consumedLitres,
        lossPct: p.lossPct,
      })),
    [data, fmt],
  );

  const avgLoss = rows.length ? rows.reduce((s, r) => s + r.lossPct, 0) / rows.length : 0;
  const worst = rows.reduce<(typeof rows)[number] | null>((w, r) => (!w || r.lossPct > w.lossPct ? r : w), null);

  return (
    <Card>
      <CardHeader
        title={t("net.balance")}
        subtitle={t("net.balanceSub")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <SimulatedTag />
            <Segmented<UsageRange>
              value={range}
              onChange={setRange}
              label={t("net.balance")}
              options={[
                { value: "7d", label: t("usage.range.7d") },
                { value: "14d", label: t("usage.range.14d") },
                { value: "30d", label: t("usage.range.30d") },
              ]}
            />
          </div>
        }
      />

      {error ? (
        <ErrorState onRetry={reload} />
      ) : !data ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className={loading ? "opacity-60 transition" : "transition"}>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -6 }}>
                  <defs>
                    <linearGradient id="inflowFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART.used} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={CHART.used} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={20} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    domain={["dataMin - 40000", "auto"]}
                    tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(v: number, name: string) => [`${fmt.number(v)} ${t("common.litres")}`, name]}
                    labelFormatter={(label: string, items) => {
                      const loss = (items?.[0]?.payload as { lossPct?: number } | undefined)?.lossPct;
                      return loss === undefined ? label : `${label} · ${t("net.loss")} ${loss}%`;
                    }}
                  />
                  <Area
                    name={t("net.inflow")}
                    dataKey="inflow"
                    type="monotone"
                    stroke={CHART.used}
                    strokeWidth={2}
                    fill="url(#inflowFill)"
                  />
                  <Area
                    name={t("net.consumed")}
                    dataKey="consumed"
                    type="monotone"
                    stroke={CHART.flow}
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    fill="#2f9159"
                    fillOpacity={0.12}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <i className="h-0.5 w-4 rounded" style={{ background: CHART.used }} />
              {t("net.inflow")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: CHART.flow }} />
              {t("net.consumed")}
            </span>
            <span className="text-slate-400">{t("net.loss")} = {t("net.inflow")} − {t("net.consumed")}</span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
            <div>
              <dt className="text-xs text-slate-500">{t("net.avgLoss")}</dt>
              <dd className="text-lg font-bold text-slate-900">{avgLoss.toFixed(1)}%</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">{t("net.worstDay")}</dt>
              <dd className="text-lg font-bold text-slate-900">
                {worst ? `${worst.lossPct}%` : "—"}{" "}
                <span className="text-xs font-medium text-slate-500">{worst?.name}</span>
              </dd>
            </div>
          </dl>
        </>
      )}
    </Card>
  );
}
