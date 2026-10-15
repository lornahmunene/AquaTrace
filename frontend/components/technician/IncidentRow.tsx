"use client";

import { CheckCheck, Clock, Loader2, MapPin, User } from "lucide-react";
import { IssueSeverityBadge, IssueStatusBadge, issueTypeIcon } from "@/components/common/issue-ui";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Issue } from "@/lib/types";
import { slaState } from "@/lib/utils/sla";
import { SlaTag } from "./SlaTag";

interface Props {
  issue: Issue;
  onOpen: (id: string) => void;
  /** Shows a one-tap "Acknowledge" button on new reports. */
  onAcknowledge?: (id: string) => void;
  busy?: boolean;
  compact?: boolean;
}

export function IncidentRow({ issue, onOpen, onAcknowledge, busy, compact }: Props) {
  const { t, fmt } = useI18n();
  const Icon = issueTypeIcon[issue.type];
  const overdue = slaState(issue).kind === "overdue";
  const resolved = issue.status === "resolved";
  const origin = issue.origin ?? "farmer";
  const who = issue.reporter
    ? t("inc.reporter", { name: issue.reporter.name, plot: issue.reporter.plot })
    : t(`inc.origin.${origin}`);
  const where = `${t(`loc.${issue.location}`)}${issue.locationDetail ? ` — ${issue.locationDetail}` : ""}`;
  const canAck = issue.status === "reported" && !!onAcknowledge;

  return (
    <li
      className={cn(
        "flex flex-col rounded-xl border transition sm:flex-row sm:items-center",
        overdue ? "border-red-200 bg-red-50/40" : "border-slate-200 bg-white hover:border-aqua-300",
        resolved && "opacity-80",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(issue.id)}
        className="flex min-w-0 flex-1 items-start gap-3 rounded-xl p-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500"
      >
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
            resolved ? "bg-leaf-100 text-leaf-700" : "bg-aqua-100 text-aqua-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-slate-900">{t(`issues.type.${issue.type}`)}</span>
            <span className="text-xs font-medium text-slate-400">{issue.id}</span>
            {issue.zone && <Badge tone="slate">{t("net.zone", { id: issue.zone })}</Badge>}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <IssueStatusBadge status={issue.status} />
            <IssueSeverityBadge severity={issue.severity} />
            <SlaTag issue={issue} />
          </span>
          {!compact && (
            <span className="mt-2 line-clamp-1 block text-sm text-slate-600">{issue.description}</span>
          )}
          <span className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {who}
            </span>
            {!compact && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {where}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {fmt.relative(issue.createdAt)}
            </span>
            <span className={cn(!issue.assignedTo && !resolved && "font-semibold text-amber-700")}>
              {issue.assignedTo ?? t("inc.unassigned")}
            </span>
          </span>
        </span>
      </button>

      {canAck && (
        <div className="px-3 pb-3 sm:pb-0 sm:pr-3">
          <button
            className="btn-outline btn-sm w-full sm:w-auto"
            disabled={busy}
            onClick={() => onAcknowledge?.(issue.id)}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            {t("inc.action.acknowledge")}
          </button>
        </div>
      )}
    </li>
  );
}
