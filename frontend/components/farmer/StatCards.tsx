"use client";

import { Droplets, Gauge, Waves, Wallet } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { ProgressBar, Skeleton, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { WaterOverview } from "@/lib/types";

function StatCard({
  icon: Icon,
  tint,
  label,
  value,
  unit,
  sub,
  progress,
  progressTone,
}: {
  icon: ComponentType<{ className?: string }>;
  tint: "blue" | "green";
  label: string;
  value: ReactNode;
  unit?: string;
  sub: string;
  progress?: number;
  progressTone?: Tone;
}) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl",
            tint === "blue" ? "bg-aqua-100 text-aqua-700" : "bg-leaf-100 text-leaf-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>}
      </p>
      {progress !== undefined && (
        <div className="mt-2.5">
          <ProgressBar value={progress} tone={progressTone} label={label} />
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">{sub}</p>
    </div>
  );
}

export function StatCards({ overview }: { overview: WaterOverview | null }) {
  const { t, fmt } = useI18n();

  if (!overview) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-36" />
        ))}
      </div>
    );
  }

  const tankPct = Math.round((overview.tank.levelLitres / overview.tank.capacityLitres) * 100);
  const a = overview.allocation;
  const remaining = Math.max(0, a.monthlyLitres - a.usedLitres);
  const remainingPct = Math.round((remaining / a.monthlyLitres) * 100);
  const todayPct = Math.round((overview.usedTodayLitres / a.dailyLitres) * 100);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard
        icon={Waves}
        tint="blue"
        label={t("stat.tank")}
        value={`${tankPct}%`}
        progress={tankPct}
        progressTone={tankPct < 25 ? "red" : tankPct < 45 ? "amber" : "blue"}
        sub={t("stat.ofCapacity", { capacity: fmt.number(overview.tank.capacityLitres) })}
      />
      <StatCard
        icon={Wallet}
        tint="green"
        label={t("stat.remaining")}
        value={fmt.number(remaining)}
        unit={t("common.litres")}
        progress={remainingPct}
        progressTone={remainingPct < 20 ? "red" : remainingPct < 40 ? "amber" : "green"}
        sub={t("stat.ofAllocation", { allocation: fmt.number(a.monthlyLitres) })}
      />
      <StatCard
        icon={Droplets}
        tint="blue"
        label={t("stat.today")}
        value={fmt.number(overview.usedTodayLitres)}
        unit={t("common.litres")}
        progress={Math.min(100, todayPct)}
        progressTone={todayPct > 100 ? "red" : "blue"}
        sub={t("stat.vsDaily", { pct: todayPct })}
      />
      <StatCard
        icon={Gauge}
        tint="green"
        label={t("stat.pressure")}
        value={overview.pressureBar.toFixed(1)}
        unit={t("supply.bar")}
        sub={t(`supply.status.${overview.supplyStatus}`)}
      />
    </div>
  );
}
