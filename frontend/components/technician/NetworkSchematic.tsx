"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";
import type { TankStat, ZoneId, ZoneStat } from "@/lib/types";
import { LOSS_COLORS, lossStatus } from "@/lib/utils/network";

const ZONE_TOP: Record<ZoneId, number> = { A: 20, B: 95, C: 170, D: 245 };
const ZONE_H = 58;
const TANK_TOP = 116;
const TANK_H = 72;

interface Props {
  zones: ZoneStat[];
  tanks: TankStat[];
  targetLossPct: number;
  incidentCounts: Partial<Record<ZoneId, number>>;
  selected: ZoneId | null;
  onSelect: (zone: ZoneId | null) => void;
}

/**
 * Stylised supply schematic (NOT a GIS map, not to scale):
 * intake -> tanks -> trunk main -> four zones. Zones are coloured by water loss
 * and show open-incident counts. Future: replace with a real map layer
 * (e.g. MapLibre) fed by pipe/zone GeoJSON from the backend.
 */
export function NetworkSchematic({ zones, tanks, targetLossPct, incidentCounts, selected, onSelect }: Props) {
  const { t } = useI18n();
  const pipe = { stroke: "#2cc3ff", strokeWidth: 4, strokeLinecap: "round" as const };
  const tankX = [100, 196];

  return (
    <svg
      viewBox="0 0 480 320"
      className="h-auto w-full"
      role="group"
      aria-label={t("net.schematic")}
      fontFamily="ui-sans-serif, system-ui, sans-serif"
    >
      {/* pipes */}
      <line x1="62" y1="152" x2="100" y2="152" {...pipe} />
      <line x1="162" y1="152" x2="196" y2="152" {...pipe} />
      <line x1="258" y1="152" x2="300" y2="152" {...pipe} />
      <line x1="300" y1="49" x2="300" y2="274" {...pipe} />
      {(Object.keys(ZONE_TOP) as ZoneId[]).map((id) => (
        <line key={id} x1="300" y1={ZONE_TOP[id] + ZONE_H / 2} x2="330" y2={ZONE_TOP[id] + ZONE_H / 2} {...pipe} />
      ))}

      {/* intake */}
      <rect x="6" y="130" width="56" height="44" rx="10" fill="#def3ff" stroke="#0086d1" strokeWidth="1.5" />
      <text x="34" y="156" textAnchor="middle" fontSize="11" fontWeight="600" fill="#084b73">
        {t("net.intake")}
      </text>

      {/* tanks */}
      {tanks.slice(0, 2).map((tank, i) => {
        const pct = tank.levelLitres / tank.capacityLitres;
        const x = tankX[i];
        return (
          <g key={tank.id}>
            <rect x={x} y={TANK_TOP} width="62" height={TANK_H} rx="9" fill="#ffffff" stroke="#0086d1" strokeWidth="1.5" />
            <rect
              x={x + 2}
              y={TANK_TOP + 2 + (TANK_H - 4) * (1 - pct)}
              width="58"
              height={(TANK_H - 4) * pct}
              rx="7"
              fill="#75d7ff"
              opacity="0.65"
            />
            <text x={x + 31} y={TANK_TOP + 42} textAnchor="middle" fontSize="14" fontWeight="700" fill="#084b73">
              {Math.round(pct * 100)}%
            </text>
            <text x={x + 31} y={TANK_TOP + TANK_H + 16} textAnchor="middle" fontSize="11" fill="#475569">
              {t("net.tank")} {i + 1}
            </text>
          </g>
        );
      })}

      {/* zones */}
      {zones.map((z) => {
        const status = lossStatus(z.lossPct, targetLossPct);
        const c = LOSS_COLORS[status];
        const top = ZONE_TOP[z.id];
        const isSel = selected === z.id;
        const dim = selected !== null && !isSel;
        const count = incidentCounts[z.id] ?? 0;
        return (
          <g
            key={z.id}
            role="button"
            tabIndex={0}
            aria-pressed={isSel}
            aria-label={`${t("net.zone", { id: z.id })}, ${t("net.lossPctShort", { pct: z.lossPct.toFixed(1) })}`}
            onClick={() => onSelect(isSel ? null : z.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(isSel ? null : z.id);
              }
            }}
            style={{ cursor: "pointer", outline: "none" }}
            opacity={dim ? 0.5 : 1}
          >
            {isSel && (
              <rect x="326" y={top - 4} width="150" height={ZONE_H + 8} rx="14" fill="none" stroke="#0086d1" strokeWidth="2.5" />
            )}
            <rect x="330" y={top} width="142" height={ZONE_H} rx="10" fill={c.fill} stroke={c.stroke} strokeWidth="1.5" />
            <text x="342" y={top + 23} fontSize="13" fontWeight="700" fill="#0f172a">
              {t("net.zone", { id: z.id })}
            </text>
            <text x="342" y={top + 43} fontSize="12" fontWeight="600" fill={c.text}>
              {t("net.lossPctShort", { pct: z.lossPct.toFixed(1) })}
            </text>
            {count > 0 && (
              <g>
                <circle cx="458" cy={top + 16} r="10" fill="#dc2626" />
                <text x="458" y={top + 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff">
                  {count}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
