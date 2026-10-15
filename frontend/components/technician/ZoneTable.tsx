"use client";

import { Badge, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ZoneId, ZoneStat } from "@/lib/types";
import { lossStatus, type LossStatus } from "@/lib/utils/network";

const tone: Record<LossStatus, Tone> = { ok: "green", watch: "amber", high: "red" };

interface Props {
  zones: ZoneStat[];
  targetLossPct: number;
  incidentCounts: Partial<Record<ZoneId, number>>;
  selected: ZoneId | null;
  onSelect: (zone: ZoneId | null) => void;
}

export function ZoneTable({ zones, targetLossPct, incidentCounts, selected, onSelect }: Props) {
  const { t, lt, fmt } = useI18n();
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3 font-semibold">{t("net.col.zone")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("net.col.inflow")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("net.col.consumed")}</th>
            <th className="px-3 py-2 font-semibold">{t("net.col.loss")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("net.col.pressure")}</th>
            <th className="px-3 py-2 text-right font-semibold">{t("net.col.sensors")}</th>
            <th className="py-2 pl-3 text-right font-semibold">{t("net.col.incidents")}</th>
          </tr>
        </thead>
        <tbody>
          {zones.map((z) => {
            const st = lossStatus(z.lossPct, targetLossPct);
            const sel = selected === z.id;
            return (
              <tr
                key={z.id}
                onClick={() => onSelect(sel ? null : z.id)}
                className={cn(
                  "cursor-pointer border-b border-slate-100 transition hover:bg-aqua-50/50",
                  sel && "bg-aqua-50",
                )}
              >
                <td className="py-3 pr-3">
                  <p className="font-semibold text-slate-900">{t("net.zone", { id: z.id })}</p>
                  <p className="text-xs text-slate-500">
                    {lt(z.name)} · {t("net.farms", { n: z.farms })}
                  </p>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{fmt.number(z.inflowLitres24h)}</td>
                <td className="px-3 py-3 text-right tabular-nums">{fmt.number(z.consumedLitres24h)}</td>
                <td className="px-3 py-3">
                  <Badge tone={tone[st]}>
                    {z.lossPct.toFixed(1)}% · {t(`net.lossStatus.${st}`)}
                  </Badge>
                </td>
                <td className="px-3 py-3 text-right tabular-nums">{z.avgPressureBar.toFixed(1)} {t("supply.bar")}</td>
                <td className="px-3 py-3 text-right tabular-nums">
                  <span className={cn(z.sensorsOnline < z.sensorsTotal && "font-semibold text-amber-700")}>
                    {z.sensorsOnline}/{z.sensorsTotal}
                  </span>
                </td>
                <td className="py-3 pl-3 text-right tabular-nums">{incidentCounts[z.id] ?? 0}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
