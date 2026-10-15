import type { Issue, IssueSeverity } from "@/lib/types";

/** Target time (minutes) to first respond to a new report, by severity. */
export const RESPONSE_TARGET_MIN: Record<IssueSeverity, number> = {
  high: 120,
  medium: 480,
  low: 1440,
};

export type SlaState =
  | { kind: "overdue"; minutes: number }
  | { kind: "due"; minutes: number }
  | { kind: "met"; minutes: number }
  | { kind: "none" };

/**
 * Response SLA: a report that is still "reported" is either due or overdue.
 * Once someone has responded, we show how long that took.
 */
export function slaState(issue: Issue, now = Date.now()): SlaState {
  if (issue.status === "resolved") return { kind: "none" };
  const created = new Date(issue.createdAt).getTime();

  if (issue.status === "reported") {
    const due = created + RESPONSE_TARGET_MIN[issue.severity] * 60_000;
    const diffMin = Math.round((due - now) / 60_000);
    return diffMin < 0 ? { kind: "overdue", minutes: -diffMin } : { kind: "due", minutes: diffMin };
  }

  const responded = issue.timeline.find((e) => e.status !== "reported");
  if (!responded) return { kind: "none" };
  return { kind: "met", minutes: Math.max(0, Math.round((new Date(responded.at).getTime() - created) / 60_000)) };
}

const SEVERITY_WEIGHT: Record<IssueSeverity, number> = { high: 3, medium: 2, low: 1 };

/** Most urgent first: open before resolved, overdue, then severity, then oldest. */
export function comparePriority(a: Issue, b: Issue, now = Date.now()): number {
  const open = (i: Issue) => (i.status === "resolved" ? 0 : 1);
  if (open(a) !== open(b)) return open(b) - open(a);
  const over = (i: Issue) => (slaState(i, now).kind === "overdue" ? 1 : 0);
  if (over(a) !== over(b)) return over(b) - over(a);
  if (SEVERITY_WEIGHT[a.severity] !== SEVERITY_WEIGHT[b.severity]) {
    return SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity];
  }
  return a.createdAt.localeCompare(b.createdAt);
}
