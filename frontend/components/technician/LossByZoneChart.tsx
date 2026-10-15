"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART } from "@/components/common/chart";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ZoneId, ZoneStat } from "@/lib/types";
import { LOSS_COLORS, lossStatus } from "@/lib/utils/network";

interface Props {
  zones: ZoneStat[];
  targetLossPct: number;
  selected: ZoneId | null;
  onSelect: (zone: ZoneId | null) => void;
}

export function LossByZoneChart({ zones, targetLossPct, selected, onSelect }: Props) {
  const { t, fmt } = useI18n();
  const rows = zones.map((z) => ({
    id: z.id,
    name: t("net.zone", { id: z.id }),
    loss: z.lossPct,
    litres: z.lossLitres24h,
  }));

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 16, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} unit="%" domain={[0, 40]} width={40} />
          <Tooltip
            cursor={{ fill: "rgba(0,134,209,0.06)" }}
            formatter={(v: number, _n, item) => [
              `${v}% · ${fmt.number((item.payload as { litres: number }).litres)} ${t("common.litres")}`,
              t("net.loss"),
            ]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
          />
          <ReferenceLine
            y={targetLossPct}
            stroke={CHART.allocation}
            strokeDasharray="5 4"
            label={{ value: `${t("net.target")} ${targetLossPct}%`, position: "insideTopRight", fill: CHART.allocation, fontSize: 10 }}
          />
          <Bar dataKey="loss" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {rows.map((r) => {
              const c = LOSS_COLORS[lossStatus(r.loss, targetLossPct)];
              return (
                <Cell
                  key={r.id}
                  fill={c.stroke}
                  fillOpacity={selected && selected !== r.id ? 0.35 : 1}
                  stroke={selected === r.id ? "#0f172a" : "none"}
                  strokeWidth={2}
                  style={{ cursor: "pointer" }}
                  onClick={() => onSelect(selected === r.id ? null : r.id)}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
