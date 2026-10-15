export type LossStatus = "ok" | "watch" | "high";

/** Within target = ok; up to 8 points above = watch; beyond = high. */
export function lossStatus(lossPct: number, targetPct: number): LossStatus {
  if (lossPct <= targetPct) return "ok";
  if (lossPct <= targetPct + 8) return "watch";
  return "high";
}

export const LOSS_COLORS: Record<LossStatus, { fill: string; stroke: string; text: string }> = {
  ok: { fill: "#f1f8f3", stroke: "#2f9159", text: "#1a5d39" },
  watch: { fill: "#fffbeb", stroke: "#d97706", text: "#92400e" },
  high: { fill: "#fef2f2", stroke: "#dc2626", text: "#b91c1c" },
};
