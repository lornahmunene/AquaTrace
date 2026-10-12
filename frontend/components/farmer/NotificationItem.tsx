"use client";

import { CalendarClock, CircleAlert, Droplet, FileText, Info, Waves } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { Badge } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Notification, NotificationType } from "@/lib/types";
import { alertSeverityTone } from "./shared";

const typeIcon: Record<NotificationType, ComponentType<{ className?: string }>> = {
  supply: Waves,
  schedule: CalendarClock,
  leak: Droplet,
  system: Info,
  issue: FileText,
};

export function NotificationItem({
  n,
  compact,
  onRead,
}: {
  n: Notification;
  compact?: boolean;
  onRead?: (id: string) => void;
}) {
  const { t, lt, fmt } = useI18n();
  const Icon = n.severity === "critical" ? CircleAlert : typeIcon[n.type];

  return (
    <li
      className={cn(
        "flex gap-3 rounded-xl border p-3.5 transition",
        n.read ? "border-slate-200 bg-white" : "border-aqua-200 bg-aqua-50/50",
      )}
    >
      <span
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
          n.severity === "critical"
            ? "bg-red-100 text-red-700"
            : n.severity === "warning"
              ? "bg-amber-100 text-amber-700"
              : "bg-aqua-100 text-aqua-700",
        )}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {!n.read && <span className="h-2 w-2 rounded-full bg-aqua-600" aria-label={t("notif.unread")} />}
          <h3 className="text-sm font-semibold text-slate-900">{lt(n.title)}</h3>
          {!compact && (
            <>
              <Badge tone={alertSeverityTone[n.severity]}>{t(`notif.severity.${n.severity}`)}</Badge>
              <Badge tone="slate">{t(`notif.type.${n.type}`)}</Badge>
            </>
          )}
        </div>
        {!compact && <p className="mt-1 text-sm text-slate-600">{lt(n.body)}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <time dateTime={n.createdAt}>{fmt.relative(n.createdAt)}</time>
          {n.issueId && !compact && (
            <Link href={`/farmer/issues?focus=${n.issueId}`} className="font-semibold text-aqua-700 hover:underline">
              {n.issueId}
            </Link>
          )}
          {!n.read && onRead && (
            <button onClick={() => onRead(n.id)} className="font-semibold text-aqua-700 hover:underline">
              {t("notif.markRead")}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
