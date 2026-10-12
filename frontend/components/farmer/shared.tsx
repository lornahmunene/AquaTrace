"use client";

import { Droplet, DropletOff, Gauge } from "lucide-react";
import type { ComponentType } from "react";
import { Badge, type Tone } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { IssueSeverity, IssueStatus, IssueType, LocationKey, Severity } from "@/lib/types";

export const ISSUE_TYPES: IssueType[] = ["leak", "low_pressure", "shortage"];
export const LOCATION_KEYS: LocationKey[] = [
  "inlet",
  "lateral",
  "tank",
  "standpipe",
  "field",
  "other",
];

export const issueTypeIcon: Record<IssueType, ComponentType<{ className?: string }>> = {
  leak: Droplet,
  low_pressure: Gauge,
  shortage: DropletOff,
};

export const issueStatusTone: Record<IssueStatus, Tone> = {
  reported: "slate",
  acknowledged: "blue",
  technician_assigned: "blue",
  in_progress: "amber",
  resolved: "green",
};

export const issueSeverityTone: Record<IssueSeverity, Tone> = {
  low: "slate",
  medium: "amber",
  high: "red",
};

export const alertSeverityTone: Record<Severity, Tone> = {
  info: "blue",
  warning: "amber",
  critical: "red",
};

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const { t } = useI18n();
  return <Badge tone={issueStatusTone[status]}>{t(`issues.status.${status}`)}</Badge>;
}

export function IssueSeverityBadge({ severity }: { severity: IssueSeverity }) {
  const { t } = useI18n();
  return <Badge tone={issueSeverityTone[severity]}>{t(`issues.severity.${severity}`)}</Badge>;
}

export function litres(n: number, fmtNumber: (n: number) => string) {
  return fmtNumber(Math.round(n));
}

/** Shared chart palette (also used for non-color cues like labels/dashes). */
export const CHART = {
  used: "#0086d1",
  over: "#d97706",
  allocation: "#1f7545",
  grid: "#e2e8f0",
  pressure: "#0086d1",
  flow: "#2f9159",
  danger: "#dc2626",
};
