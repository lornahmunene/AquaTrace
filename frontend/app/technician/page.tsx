"use client";

import { Activity, Droplets, Siren, Timer } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, EmptyState, ErrorState, Skeleton } from "@/components/ui/primitives";
import { StatCard } from "@/components/ui/StatCard";
import { IncidentRow } from "@/components/technician/IncidentRow";
import { LeakDetectionList } from "@/components/technician/LeakDetectionList";
import { LossByZoneChart } from "@/components/technician/LossByZoneChart";
import { NetworkSchematic } from "@/components/technician/NetworkSchematic";
import { technicianApi } from "@/lib/api/technician";
import { useAsync } from "@/lib/hooks/useAsync";
import { openIncidentCounts, useNetwork } from "@/lib/hooks/useNetwork";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTechnicianData } from "@/lib/state/TechnicianDataContext";
import type { ZoneId } from "@/lib/types";
import { lossStatus } from "@/lib/utils/network";
import { comparePriority, slaState } from "@/lib/utils/sla";

export default function TechnicianOverviewPage() {
  const { t, fmt } = useI18n();
  const { profile, incidents, incidentsLoading, incidentsError, reloadIncidents, act, openIncident } =
    useTechnicianData();
  const { overview, zones } = useNetwork();
  const sensors = useAsync(() => technicianApi.getSensors(), []);
  const [zone, setZone] = useState<ZoneId | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const open = useMemo(() => incidents.filter((i) => i.status !== "resolved"), [incidents]);
  const counts = useMemo(() => openIncidentCounts(incidents), [incidents]);
  const queue = useMemo(
    () => open.filter((i) => !zone || i.zone === zone).sort((a, b) => comparePriority(a, b)),
    [open, zone],
  );
  const mine = open.filter((i) => profile && i.assignedTo === profile.name);

  const highOpen = open.filter((i) => i.severity === "high").length;
  const overdue = open.filter((i) => slaState(i).kind === "overdue").length;
  const waiting = open.filter((i) => i.status === "reported").length;

  const sensorList = sensors.data ?? [];
  const reporting = sensorList.filter((s) => s.status !== "offline").length;
  const attention = sensorList.filter((s) => s.status !== "online").length;

  async function acknowledge(id: string) {
    setBusyId(id);
    await act(id, { type: "acknowledge" });
    setBusyId(null);
  }

  const ov = overview.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("tov.title")}
        subtitle={profile ? t("tov.subtitle", { scheme: profile.schemeName }) : undefined}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Siren}
          tint="blue"
          label={t("tstat.open")}
          value={incidentsLoading ? "…" : open.length}
          sub={t("tstat.openSub", { n: highOpen })}
        />
        <StatCard
          icon={Timer}
          tint={overdue > 0 ? "red" : "green"}
          label={t("tstat.overdue")}
          value={incidentsLoading ? "…" : overdue}
          sub={t("tstat.overdueSub", { n: waiting })}
        />
        <StatCard
          icon={Droplets}
          tint={ov ? (lossStatus(ov.lossPct, ov.targetLossPct) === "ok" ? "green" : "amber") : "blue"}
          label={t("tstat.loss")}
          value={ov ? `${ov.lossPct.toFixed(1)}%` : "…"}
          sub={t("tstat.lossSub", { target: ov?.targetLossPct ?? 20 })}
        />
        <StatCard
          icon={Activity}
          tint={attention > 0 ? "amber" : "green"}
          label={t("tstat.sensors")}
          value={sensors.data ? `${reporting}/${sensorList.length}` : "…"}
          progress={sensorList.length ? (reporting / sensorList.length) * 100 : 0}
          progressTone={attention > 0 ? "amber" : "green"}
          sub={t("tstat.sensorsSub", { n: attention })}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title={t("tov.queue")}
              subtitle={t("tov.queueSub")}
              action={
                <div className="flex items-center gap-3">
                  {zone && (
                    <button className="btn-ghost btn-sm" onClick={() => setZone(null)}>
                      {t("net.zone", { id: zone })} ✕
                    </button>
                  )}
                  <Link href="/technician/incidents" className="text-sm font-semibold text-aqua-700 hover:underline">
                    {t("common.viewAll")}
                  </Link>
                </div>
              }
            />
            {incidentsError ? (
              <ErrorState onRetry={reloadIncidents} />
            ) : incidentsLoading ? (
              <Skeleton className="h-60" />
            ) : queue.length === 0 ? (
              <EmptyState title={t("tov.noOpen")} />
            ) : (
              <ul className="space-y-2.5">
                {queue.slice(0, 5).map((i) => (
                  <IncidentRow
                    key={i.id}
                    issue={i}
                    onOpen={openIncident}
                    onAcknowledge={acknowledge}
                    busy={busyId === i.id}
                  />
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-5">
            <Card>
              <CardHeader title={t("net.schematic")} subtitle={t("net.schematicNote")} />
              {zones.data && ov ? (
                <div className="mx-auto max-w-lg">
                  <NetworkSchematic
                    zones={zones.data}
                    tanks={ov.tanks}
                    targetLossPct={ov.targetLossPct}
                    incidentCounts={counts}
                    selected={zone}
                    onSelect={setZone}
                  />
                </div>
              ) : zones.error ? (
                <ErrorState onRetry={zones.reload} />
              ) : (
                <Skeleton className="h-64" />
              )}
            </Card>
            <Card>
              <CardHeader title={t("net.lossByZone")} subtitle={t("net.lossByZoneSub")} />
              {zones.data && ov ? (
                <LossByZoneChart zones={zones.data} targetLossPct={ov.targetLossPct} selected={zone} onSelect={setZone} />
              ) : zones.error ? (
                <ErrorState onRetry={zones.reload} />
              ) : (
                <Skeleton className="h-56" />
              )}
              {ov && (
                <p className="mt-2 text-xs text-slate-500">
                  {t("net.inflow")} {fmt.number(ov.inflowLitres24h)} {t("common.litres")} · {t("net.loss")}{" "}
                  {fmt.number(ov.lossLitres24h)} {t("common.litres")}
                </p>
              )}
            </Card>
          </div>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title={t("tov.myTasks")} />
            {incidentsLoading ? (
              <Skeleton className="h-24" />
            ) : mine.length === 0 ? (
              <EmptyState title={t("tov.noTasks")} />
            ) : (
              <ul className="space-y-2.5">
                {mine
                  .sort((a, b) => comparePriority(a, b))
                  .map((i) => (
                    <IncidentRow key={i.id} issue={i} compact onOpen={openIncident} />
                  ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader
              title={t("leak.title")}
              subtitle={t("leak.subtitle")}
              action={
                <Link href="/technician/network" className="text-sm font-semibold text-aqua-700 hover:underline">
                  {t("common.viewAll")}
                </Link>
              }
            />
            <LeakDetectionList zone={zone} limit={3} />
          </Card>
        </div>
      </div>
    </div>
  );
}
