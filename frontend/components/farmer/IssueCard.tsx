"use client";

import { ChevronDown, Clock, Loader2, MapPin, RotateCcw, User } from "lucide-react";
import { Badge, ProgressBar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ISSUE_STATUS_ORDER, type Issue } from "@/lib/types";
import { IssueSeverityBadge, IssueStatusBadge, issueTypeIcon } from "./shared";

interface Props {
  issue: Issue;
  expanded: boolean;
  busy?: boolean;
  onToggle: () => void;
  onReopen: (id: string) => void;
}

export function IssueCard({ issue, expanded, busy, onToggle, onReopen }: Props) {
  const { t, lt, fmt } = useI18n();
  const Icon = issueTypeIcon[issue.type];
  const step = ISSUE_STATUS_ORDER.indexOf(issue.status) + 1;
  const resolved = issue.status === "resolved";
  const location = `${t(`loc.${issue.location}`)}${issue.locationDetail ? ` — ${issue.locationDetail}` : ""}`;

  return (
    <li
      id={issue.id}
      className={cn(
        "card overflow-hidden transition",
        expanded && "ring-2 ring-aqua-200",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
            resolved ? "bg-leaf-100 text-leaf-700" : "bg-aqua-100 text-aqua-700",
          )}
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-sm font-semibold text-slate-900">{t(`issues.type.${issue.type}`)}</h3>
            <span className="text-xs font-medium text-slate-400">{issue.id}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <IssueStatusBadge status={issue.status} />
            <IssueSeverityBadge severity={issue.severity} />
          </div>
          <p className={cn("mt-2 text-sm text-slate-600", !expanded && "line-clamp-1")}>
            {issue.description}
          </p>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("issues.reportedAt", { time: fmt.relative(issue.createdAt) })}
            </span>
          </p>
        </div>

        <ChevronDown
          className={cn("mt-1 h-5 w-5 shrink-0 text-slate-400 transition", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("issues.progress")}
            </h4>
            <span className="text-xs text-slate-500">
              {step}/{ISSUE_STATUS_ORDER.length}
            </span>
          </div>
          <ProgressBar
            value={(step / ISSUE_STATUS_ORDER.length) * 100}
            tone={resolved ? "green" : "blue"}
            label={t("issues.progress")}
          />

          <ol className="mt-4 space-y-4 border-l-2 border-aqua-100 pl-4">
            {issue.timeline.map((ev, i) => (
              <li key={i} className="relative">
                <span
                  className={cn(
                    "absolute -left-[23px] top-1 h-3 w-3 rounded-full ring-4 ring-slate-50",
                    ev.status === "resolved" ? "bg-leaf-500" : "bg-aqua-500",
                  )}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <IssueStatusBadge status={ev.status} />
                  <time className="text-xs text-slate-500" dateTime={ev.at}>
                    {fmt.date(ev.at, { day: "numeric", month: "short" })}, {fmt.time(ev.at)}
                  </time>
                </div>
                {ev.note && <p className="mt-1 text-sm text-slate-600">{lt(ev.note)}</p>}
              </li>
            ))}
          </ol>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              {issue.assignedTo && (
                <Badge tone="blue">
                  <User className="h-3 w-3" />
                  {t("issues.assigned", { name: issue.assignedTo })}
                </Badge>
              )}
              <span>{t("issues.updatedAt", { time: fmt.relative(issue.updatedAt) })}</span>
            </div>
            {resolved && (
              <button className="btn-outline btn-sm" disabled={busy} onClick={() => onReopen(issue.id)}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                {t("issues.reopen")}
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
