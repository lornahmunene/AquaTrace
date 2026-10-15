"use client";

import { Droplet, DropletOff, Gauge } from "lucide-react";
import type { ComponentType } from "react";
import { Badge, type Tone } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { IssueSeverity, IssueStatus, IssueType, LocationKey } from "@/lib/types";

/** Issue presentation shared by the farmer and technician apps. */
export const ISSUE_TYPES: IssueType[] = ["leak", "low_pressure", "shortage"];
export const LOCATION_KEYS: LocationKey[] = ["inlet", "lateral", "tank", "standpipe", "field", "other"];

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

export function IssueStatusBadge({ status }: { status: IssueStatus }) {
  const { t } = useI18n();
  return <Badge tone={issueStatusTone[status]}>{t(`issues.status.${status}`)}</Badge>;
}

export function IssueSeverityBadge({ severity }: { severity: IssueSeverity }) {
  const { t } = useI18n();
  return <Badge tone={issueSeverityTone[severity]}>{t(`issues.severity.${severity}`)}</Badge>;
}
