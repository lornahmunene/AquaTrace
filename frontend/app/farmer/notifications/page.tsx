"use client";

import { BellOff, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { NotificationItem } from "@/components/farmer/NotificationItem";
import { PageHeader } from "@/components/farmer/PageHeader";
import { Badge, EmptyState, Segmented, Skeleton } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFarmerData } from "@/lib/state/FarmerDataContext";
import type { NotificationType, Severity } from "@/lib/types";

const TYPES: NotificationType[] = ["supply", "schedule", "leak", "issue", "system"];
const SEVERITIES: Severity[] = ["critical", "warning", "info"];

export default function NotificationsPage() {
  const { t } = useI18n();
  const { notifications, notificationsLoading, unreadCount, markNotificationsRead } = useFarmerData();
  const [scope, setScope] = useState<"all" | "unread">("all");
  const [type, setType] = useState<NotificationType | "all">("all");
  const [severity, setSeverity] = useState<Severity | "all">("all");

  const filtered = useMemo(
    () =>
      notifications.filter(
        (n) =>
          (scope === "all" || !n.read) &&
          (type === "all" || n.type === type) &&
          (severity === "all" || n.severity === severity),
      ),
    [notifications, scope, type, severity],
  );

  return (
    <div>
      <PageHeader
        title={t("notif.title")}
        subtitle={t("notif.subtitle")}
        action={
          <button
            className="btn-outline"
            disabled={unreadCount === 0}
            onClick={() => markNotificationsRead()}
          >
            <CheckCheck className="h-4 w-4" />
            {t("notif.markAll")}
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Segmented<"all" | "unread">
          value={scope}
          onChange={setScope}
          label={t("notif.title")}
          options={[
            { value: "all", label: t("common.all") },
            { value: "unread", label: `${t("notif.unread")} (${unreadCount})` },
          ]}
        />
        <div className="w-40">
          <label htmlFor="n-type" className="label">
            {t("notif.filter.type")}
          </label>
          <select
            id="n-type"
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as NotificationType | "all")}
          >
            <option value="all">{t("common.all")}</option>
            {TYPES.map((x) => (
              <option key={x} value={x}>
                {t(`notif.type.${x}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="w-40">
          <label htmlFor="n-sev" className="label">
            {t("notif.filter.severity")}
          </label>
          <select
            id="n-sev"
            className="input"
            value={severity}
            onChange={(e) => setSeverity(e.target.value as Severity | "all")}
          >
            <option value="all">{t("common.all")}</option>
            {SEVERITIES.map((x) => (
              <option key={x} value={x}>
                {t(`notif.severity.${x}`)}
              </option>
            ))}
          </select>
        </div>
        {unreadCount === 0 && <Badge tone="green">{t("notif.allRead")}</Badge>}
      </div>

      {notificationsLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<BellOff className="h-8 w-8" />} title={t("notif.empty")} />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((n) => (
            <NotificationItem key={n.id} n={n} onRead={(id) => markNotificationsRead([id])} />
          ))}
        </ul>
      )}
    </div>
  );
}
