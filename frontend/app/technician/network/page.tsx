"use client";

import { useMemo, useState } from "react";
import { LeakDetectionList } from "@/components/technician/LeakDetectionList";
import { LossByZoneChart } from "@/components/technician/LossByZoneChart";
import { NetworkSchematic } from "@/components/technician/NetworkSchematic";
import { WaterBalanceChart } from "@/components/technician/WaterBalanceChart";
import { ZoneTable } from "@/components/technician/ZoneTable";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, ErrorState, SimulatedTag, Skeleton } from "@/components/ui/primitives";
import { openIncidentCounts, useNetwork } from "@/lib/hooks/useNetwork";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTechnicianData } from "@/lib/state/TechnicianDataContext";
import type { ZoneId } from "@/lib/types";

export default function NetworkPage() {
  const { t } = useI18n();
  const { incidents } = useTechnicianData();
  const { overview, zones } = useNetwork();
  const [zone, setZone] = useState<ZoneId | null>(null);
  const counts = useMemo(() => openIncidentCounts(incidents), [incidents]);
  const ov = overview.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("net.title")}
        subtitle={t("net.subtitle")}
        action={
          zone ? (
            <button className="btn-outline btn-sm" onClick={() => setZone(null)}>
              {t("net.zone", { id: zone })} ✕ · {t("net.clearZone")}
            </button>
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("net.schematic")} subtitle={t("net.schematicNote")} action={<SimulatedTag />} />
          {zones.data && ov ? (
            <NetworkSchematic
              zones={zones.data}
              tanks={ov.tanks}
              targetLossPct={ov.targetLossPct}
              incidentCounts={counts}
              selected={zone}
              onSelect={setZone}
            />
          ) : zones.error ? (
            <ErrorState onRetry={zones.reload} />
          ) : (
            <Skeleton className="h-72" />
          )}
        </Card>
        <Card>
          <CardHeader title={t("net.lossByZone")} subtitle={t("net.lossByZoneSub")} action={<SimulatedTag />} />
          {zones.data && ov ? (
            <LossByZoneChart zones={zones.data} targetLossPct={ov.targetLossPct} selected={zone} onSelect={setZone} />
          ) : zones.error ? (
            <ErrorState onRetry={zones.reload} />
          ) : (
            <Skeleton className="h-56" />
          )}
        </Card>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <WaterBalanceChart />
        </div>
        <Card>
          <CardHeader title={t("leak.title")} subtitle={t("leak.subtitle")} />
          <LeakDetectionList zone={zone} />
        </Card>
      </div>

      <Card>
        <CardHeader title={t("net.zones")} action={<SimulatedTag />} />
        {zones.data && ov ? (
          <ZoneTable
            zones={zones.data}
            targetLossPct={ov.targetLossPct}
            incidentCounts={counts}
            selected={zone}
            onSelect={setZone}
          />
        ) : zones.error ? (
          <ErrorState onRetry={zones.reload} />
        ) : (
          <Skeleton className="h-48" />
        )}
      </Card>
    </div>
  );
}
