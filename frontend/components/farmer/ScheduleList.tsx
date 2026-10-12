"use client";

import { Clock, RotateCcw, SkipForward, Sparkles, Sprout } from "lucide-react";
import { useMemo } from "react";
import { Badge, EmptyState, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useDayLabel } from "@/lib/hooks/useDayLabel";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Schedule, ScheduleStatus } from "@/lib/types";

const statusTone: Record<ScheduleStatus, Tone> = {
  scheduled: "blue",
  running: "green",
  completed: "slate",
  skipped: "amber",
};

interface Props {
  schedules: Schedule[];
  onChangeStatus: (id: string, status: ScheduleStatus) => void;
  busyId?: string | null;
  grouped?: boolean;
  emptyText?: string;
}

export function ScheduleList({ schedules, onChangeStatus, busyId, grouped = false, emptyText }: Props) {
  const { t, fmt, lt } = useI18n();
  const dayLabel = useDayLabel();

  const groups = useMemo(() => {
    const map = new Map<string, Schedule[]>();
    for (const s of [...schedules].sort((a, b) =>
      (a.date + a.startTime).localeCompare(b.date + b.startTime),
    )) {
      map.set(s.date, [...(map.get(s.date) ?? []), s]);
    }
    return [...map.entries()];
  }, [schedules]);

  if (!schedules.length) {
    return <EmptyState icon={<Sprout className="h-8 w-8" />} title={emptyText ?? t("schedule.empty")} />;
  }

  const row = (s: Schedule) => (
    <li
      key={s.id}
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center",
        s.status === "running" ? "border-leaf-300 bg-leaf-50/60" : "border-slate-200 bg-white",
        s.status === "skipped" && "opacity-75",
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-aqua-50 text-center">
          <span className="text-sm font-bold text-aqua-800">{s.startTime}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-semibold text-slate-900">
              {s.blockName} · {s.crop}
            </p>
            {s.aiAdjusted && (
              <Badge tone="blue">
                <Sparkles className="h-3 w-3" />
                {t("schedule.aiAdjusted")}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("schedule.at", { time: s.startTime, min: s.durationMin })}
            </span>
            <span>{t("schedule.litres", { litres: fmt.number(s.litres) })}</span>
            <span>{t(`schedule.method.${s.method}`)}</span>
          </p>
          {s.note && <p className="mt-1 text-xs italic text-slate-500">{lt(s.note)}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <Badge tone={statusTone[s.status]}>{t(`schedule.status.${s.status}`)}</Badge>
        {s.status === "scheduled" && (
          <button
            className="btn-outline btn-sm"
            disabled={busyId === s.id}
            onClick={() => onChangeStatus(s.id, "skipped")}
          >
            <SkipForward className="h-3.5 w-3.5" />
            {t("schedule.skip")}
          </button>
        )}
        {s.status === "skipped" && (
          <button
            className="btn-outline btn-sm"
            disabled={busyId === s.id}
            onClick={() => onChangeStatus(s.id, "scheduled")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("schedule.restore")}
          </button>
        )}
      </div>
    </li>
  );

  if (!grouped) return <ul className="space-y-2.5">{schedules.map(row)}</ul>;

  return (
    <div className="space-y-5">
      {groups.map(([date, items]) => (
        <div key={date}>
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {dayLabel(date)}
            <span className="font-normal normal-case text-slate-400">
              · {fmt.date(`${date}T12:00:00`)}
            </span>
          </h3>
          <ul className="space-y-2.5">{items.map(row)}</ul>
        </div>
      ))}
    </div>
  );
}
