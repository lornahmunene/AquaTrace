"use client";

import { useEffect } from "react";
import { technicianApi } from "@/lib/api/technician";
import type { Issue, ZoneId } from "@/lib/types";
import { useAsync } from "./useAsync";

const REFRESH_MS = 30_000;

/** Network overview + zone stats, refreshed periodically (same code path for real sensors). */
export function useNetwork() {
  const overview = useAsync(() => technicianApi.getNetworkOverview(), []);
  const zones = useAsync(() => technicianApi.getZones(), []);
  const reloadOverview = overview.reload;
  const reloadZones = zones.reload;

  useEffect(() => {
    const id = setInterval(() => {
      reloadOverview();
      reloadZones();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [reloadOverview, reloadZones]);

  return { overview, zones };
}

/** Open incidents per zone. */
export function openIncidentCounts(incidents: Issue[]): Partial<Record<ZoneId, number>> {
  const out: Partial<Record<ZoneId, number>> = {};
  for (const i of incidents) {
    if (i.status === "resolved" || !i.zone) continue;
    out[i.zone] = (out[i.zone] ?? 0) + 1;
  }
  return out;
}
