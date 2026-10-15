"use client";

import { TrendingUp, CheckCircle2 } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Badge, Card, CardHeader, Skeleton } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { WaterOverview } from "@/lib/types";
import { CHART } from "./shared";

export function AllocationCard({ overview }: { overview: WaterOverview | null }) {
  const { t, fmt } = useI18n();

  if (!overview) {
    return (
      <Card>
        <CardHeader title={t("allocation.title")} />
        <Skeleton className="h-64" />
      </Card>
    );
  }

  const a = overview.allocation;
  const remaining = Math.max(0, a.monthlyLitres - a.usedLitres);
  const usedPct = Math.round((a.usedLitres / a.monthlyLitres) * 100);
  const expectedPct = Math.round((a.dayOfMonth / a.daysInMonth) * 100);
  const projected = Math.round((a.usedLitres / Math.max(1, a.dayOfMonth)) * a.daysInMonth);
  const ahead = usedPct > expectedPct + 3;
  const usedColor = ahead ? CHART.over : CHART.used;

  const data = [
    { name: "used", value: a.usedLitres },
    { name: "remaining", value: remaining },
  ];

  return (
    <Card>
      <CardHeader
        title={t("allocation.title")}
        action={
          ahead ? (
            <Badge tone="amber">
              <TrendingUp className="h-3 w-3" />
              {t("allocation.pace")}
            </Badge>
          ) : (
            <Badge tone="green">
              <CheckCircle2 className="h-3 w-3" />
              {t("allocation.pace")}
            </Badge>
          )
        }
      />

      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={58}
              outerRadius={80}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              paddingAngle={remaining > 0 ? 2 : 0}
            >
              <Cell fill={usedColor} />
              <Cell fill="#dcefe2" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-bold text-slate-900">{usedPct}%</p>
            <p className="text-xs text-slate-500">{t("allocation.used")}</p>
          </div>
        </div>
      </div>

      <dl className="mt-4 space-y-2.5 text-sm">
        <div className="flex justify-between">
          <dt className="flex items-center gap-2 text-slate-600">
            <i className="h-2.5 w-2.5 rounded-sm" style={{ background: usedColor }} />
            {t("allocation.used")}
          </dt>
          <dd className="font-semibold text-slate-900">
            {fmt.number(a.usedLitres)} {t("common.litres")}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="flex items-center gap-2 text-slate-600">
            <i className="h-2.5 w-2.5 rounded-sm bg-leaf-100 ring-1 ring-leaf-300" />
            {t("allocation.remaining")}
          </dt>
          <dd className="font-semibold text-slate-900">
            {fmt.number(remaining)} {t("common.litres")}
          </dd>
        </div>
        <div className="flex justify-between border-t border-slate-100 pt-2.5">
          <dt className="text-slate-600">{t("allocation.expected")}</dt>
          <dd className="font-semibold text-slate-900">{expectedPct}%</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-slate-600">{t("allocation.projected")}</dt>
          <dd className="font-semibold text-slate-900">
            {fmt.number(projected)} {t("common.litres")}
          </dd>
        </div>
      </dl>

      <p
        className={`mt-4 rounded-xl px-3 py-2 text-xs font-medium ${
          ahead ? "bg-amber-50 text-amber-800" : "bg-leaf-50 text-leaf-800"
        }`}
      >
        {ahead ? t("allocation.ahead") : t("allocation.onPace")}
      </p>
    </Card>
  );
}
