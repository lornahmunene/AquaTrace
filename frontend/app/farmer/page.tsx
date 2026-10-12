"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AllocationCard } from "@/components/farmer/AllocationCard";
import { IssueSeverityBadge, IssueStatusBadge, issueTypeIcon } from "@/components/farmer/shared";
import { NotificationItem } from "@/components/farmer/NotificationItem";
import { PageHeader } from "@/components/farmer/PageHeader";
import { QuickReport } from "@/components/farmer/QuickReport";
import { RecommendationCard } from "@/components/farmer/RecommendationCard";
import { ScheduleList } from "@/components/farmer/ScheduleList";
import { StatCards } from "@/components/farmer/StatCards";
import { SupplyStatusCard } from "@/components/farmer/SupplyStatusCard";
import { UsageChart } from "@/components/farmer/UsageChart";
import { Card, CardHeader, EmptyState, ErrorState, Skeleton } from "@/components/ui/primitives";
import { farmerApi } from "@/lib/api/farmer";
import { useAsync } from "@/lib/hooks/useAsync";
import { useIrrigation } from "@/lib/hooks/useIrrigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFarmerData } from "@/lib/state/FarmerDataContext";
import { ymd } from "@/lib/utils/date";
import { CheckCircle2 } from "lucide-react";

const REFRESH_MS = 30_000;

export default function FarmerOverviewPage() {
  const { t, fmt } = useI18n();
  const { profile, notifications, markNotificationsRead, issues, issuesLoading } = useFarmerData();
  const overview = useAsync(() => farmerApi.getOverview(), []);
  const irrigation = useIrrigation();

  // Periodically refresh headline numbers (works the same for real sensor data).
  const reloadOverview = overview.reload;
  useEffect(() => {
    const id = setInterval(reloadOverview, REFRESH_MS);
    return () => clearInterval(id);
  }, [reloadOverview]);

  // Hour is read after mount so server-rendered HTML and the client always agree.
  const [hour, setHour] = useState(9);
  useEffect(() => setHour(new Date().getHours()), []);
  const greetingKey = hour < 12 ? "greeting.morning" : hour < 17 ? "greeting.afternoon" : "greeting.evening";
  const firstName = profile?.name.split(" ")[0] ?? "";

  const today = ymd(new Date());
  const todaySessions = (irrigation.schedules.data ?? []).filter((s) => s.date === today);
  const topRecs = (irrigation.recommendations.data ?? [])
    .filter((r) => r.status !== "dismissed")
    .slice(0, 2);
  const openIssues = issues.filter((i) => i.status !== "resolved");
  const latestAlerts = notifications.slice(0, 3);

  return (
    <div className="space-y-5">
      <PageHeader
        title={t(greetingKey, { name: firstName })}
        subtitle={
          profile
            ? t("overview.subtitle", { scheme: profile.schemeName, plot: `${profile.plotName} (${fmt.number(profile.acres)} ac)` })
            : undefined
        }
      />

      {overview.error ? <ErrorState onRetry={overview.reload} /> : <StatCards overview={overview.data} />}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsageChart />
        </div>
        <AllocationCard overview={overview.data} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title={t("schedule.todayTitle")}
              action={
                <Link href="/farmer/irrigation" className="text-sm font-semibold text-aqua-700 hover:underline">
                  {t("common.viewAll")}
                </Link>
              }
            />
            {irrigation.schedules.error ? (
              <ErrorState onRetry={irrigation.schedules.reload} />
            ) : !irrigation.schedules.data ? (
              <Skeleton className="h-24" />
            ) : (
              <ScheduleList
                schedules={todaySessions}
                onChangeStatus={irrigation.changeStatus}
                busyId={irrigation.busyId}
                emptyText={t("schedule.emptyToday")}
              />
            )}
          </Card>

          <Card>
            <CardHeader
              title={t("overview.topAdvice")}
              subtitle={t("reco.disclaimer")}
              action={
                <Link href="/farmer/irrigation" className="text-sm font-semibold text-aqua-700 hover:underline">
                  {t("common.viewAll")}
                </Link>
              }
            />
            {!irrigation.recommendations.data ? (
              <Skeleton className="h-32" />
            ) : topRecs.length === 0 ? (
              <EmptyState title={t("reco.empty")} />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {topRecs.map((r) => (
                  <RecommendationCard
                    key={r.id}
                    rec={r}
                    compact
                    busy={irrigation.busyId === r.id}
                    onApply={irrigation.applyRecommendation}
                    onDismiss={irrigation.dismissRecommendation}
                  />
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <CardHeader
                title={t("overview.openIssues")}
                action={
                  <Link href="/farmer/issues" className="text-sm font-semibold text-aqua-700 hover:underline">
                    {t("common.viewAll")}
                  </Link>
                }
              />
              {issuesLoading ? (
                <Skeleton className="h-24" />
              ) : openIssues.length === 0 ? (
                <p className="flex items-center gap-2 rounded-xl bg-leaf-50 px-3 py-3 text-sm text-leaf-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {t("overview.noOpenIssues")}
                </p>
              ) : (
                <ul className="space-y-2.5">
                  {openIssues.slice(0, 3).map((i) => {
                    const Icon = issueTypeIcon[i.type];
                    return (
                      <li key={i.id}>
                        <Link
                          href={`/farmer/issues?focus=${i.id}`}
                          className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 hover:border-aqua-300 hover:bg-aqua-50/50"
                        >
                          <Icon className="h-5 w-5 shrink-0 text-aqua-600" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-slate-900">
                              {t(`issues.type.${i.type}`)} · {i.id}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-1.5">
                              <IssueStatusBadge status={i.status} />
                              <IssueSeverityBadge severity={i.severity} />
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader
                title={t("overview.latestAlerts")}
                action={
                  <Link href="/farmer/notifications" className="text-sm font-semibold text-aqua-700 hover:underline">
                    {t("common.viewAll")}
                  </Link>
                }
              />
              {latestAlerts.length === 0 ? (
                <Skeleton className="h-24" />
              ) : (
                <ul className="space-y-2.5">
                  {latestAlerts.map((n) => (
                    <NotificationItem key={n.id} n={n} compact onRead={(id) => markNotificationsRead([id])} />
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <SupplyStatusCard overview={overview.data} />
          <QuickReport />
        </div>
      </div>
    </div>
  );
}
