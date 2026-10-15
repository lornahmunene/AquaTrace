"use client";

import { Cylinder, Gauge, Sprout, Waves } from "lucide-react";
import type { ComponentType } from "react";
import { Badge, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Sensor, SensorStatus, SensorType } from "@/lib/types";

export const SENSOR_TYPES: SensorType[] = ["flow", "pressure", "tank_level", "soil_moisture"];
export const SENSOR_STATUSES: SensorStatus[] = ["online", "low_battery", "offline"];

const typeIcon: Record<SensorType, ComponentType<{ className?: string }>> = {
  flow: Waves,
  pressure: Gauge,
  tank_level: Cylinder,
  soil_moisture: Sprout,
};
export const sensorStatusTone: Record<SensorStatus, Tone> = {
  online: "green",
  low_battery: "amber",
  offline: "red",
};

export function SensorTable({ sensors }: { sensors: Sensor[] }) {
  const { t, lt, fmt } = useI18n();

  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-3 font-semibold">{t("sen.col.device")}</th>
            <th className="px-3 py-2 font-semibold">{t("sen.col.location")}</th>
            <th className="px-3 py-2 font-semibold">{t("issues.filter.status")}</th>
            <th className="px-3 py-2 font-semibold">{t("sen.col.reading")}</th>
            <th className="px-3 py-2 font-semibold">{t("sen.col.battery")}</th>
            <th className="py-2 pl-3 font-semibold">{t("sen.col.lastSeen")}</th>
          </tr>
        </thead>
        <tbody>
          {sensors.map((s) => {
            const Icon = typeIcon[s.type];
            return (
              <tr key={s.id} className="border-b border-slate-100">
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-aqua-50 text-aqua-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{s.id}</p>
                      <p className="text-xs text-slate-500">{t(`sen.type.${s.type}`)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <p className="text-slate-800">{lt(s.location)}</p>
                  <p className="text-xs text-slate-500">{t("net.zone", { id: s.zone })}</p>
                </td>
                <td className="px-3 py-3">
                  <Badge tone={sensorStatusTone[s.status]}>{t(`sen.status.${s.status}`)}</Badge>
                </td>
                <td className="px-3 py-3 tabular-nums">
                  {s.value === null ? (
                    <span className="text-slate-400">{t("sen.noReading")}</span>
                  ) : (
                    <span className="font-semibold text-slate-900">
                      {fmt.number(s.value)} <span className="text-xs font-medium text-slate-500">{s.unit}</span>
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {s.batteryPct === null ? (
                    <span className="text-xs text-slate-400">{t("sen.powered")}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={cn("h-full rounded-full", s.batteryPct < 20 ? "bg-red-500" : "bg-leaf-500")}
                          style={{ width: `${s.batteryPct}%` }}
                        />
                      </div>
                      <span className={cn("text-xs tabular-nums", s.batteryPct < 20 ? "font-semibold text-red-700" : "text-slate-600")}>
                        {s.batteryPct}%
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-3 pl-3 text-xs text-slate-500">{fmt.relative(s.lastSeen)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
