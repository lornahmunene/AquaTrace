"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "@/components/ui/Toast";
import { technicianApi } from "@/lib/api/technician";
import { useAsync } from "@/lib/hooks/useAsync";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { IncidentAction, Issue, LeakDetection, Technician } from "@/lib/types";

const REFRESH_MS = 30_000;

/**
 * State shared by all technician screens: the incident list (also the source
 * of header badges), the team, leak detections, and the global incident
 * detail dialog (so any screen can open an incident).
 */
interface TechnicianData {
  profile: Technician | null;
  technicians: Technician[];

  incidents: Issue[];
  incidentsLoading: boolean;
  incidentsError: boolean;
  reloadIncidents: () => void;
  /** Resolves true on success. Shows its own success/error toast. */
  act: (id: string, action: IncidentAction) => Promise<boolean>;

  detections: LeakDetection[];
  detectionsLoading: boolean;
  detectionsError: boolean;
  reloadDetections: () => void;
  investigateDetection: (id: string) => Promise<void>;
  dismissDetection: (id: string) => Promise<void>;
  createIncidentFromDetection: (id: string) => Promise<void>;

  selectedId: string | null;
  openIncident: (id: string) => void;
  closeIncident: () => void;
}

const Ctx = createContext<TechnicianData | null>(null);

export function TechnicianDataProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const toast = useToast();

  const profile = useAsync(() => technicianApi.getProfile(), []);
  const team = useAsync(() => technicianApi.getTechnicians(), []);
  const incidentsQ = useAsync(() => technicianApi.getIncidents(), []);
  const detectionsQ = useAsync(() => technicianApi.getLeakDetections(), []);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const setIncidents = incidentsQ.setData;
  const setDetections = detectionsQ.setData;
  const reloadIncidents = incidentsQ.reload;
  const reloadDetections = detectionsQ.reload;

  // New farmer reports and sensor alerts arrive over time: poll the queue.
  useEffect(() => {
    const id = setInterval(reloadIncidents, REFRESH_MS);
    return () => clearInterval(id);
  }, [reloadIncidents]);

  const act = useCallback(
    async (id: string, action: IncidentAction) => {
      try {
        const updated = await technicianApi.applyIncidentAction(id, action);
        setIncidents((prev) => (prev ? prev.map((i) => (i.id === id ? updated : i)) : prev));
        const messages = {
          acknowledge: t("inc.toast.acknowledged", { id }),
          assign: t("inc.toast.assigned", { id, name: action.type === "assign" ? action.to : "" }),
          start: t("inc.toast.started", { id }),
          resolve: t("inc.toast.resolved", { id }),
          reopen: t("inc.toast.reopened", { id }),
          note: t("inc.toast.noted", { id }),
        };
        toast.push(messages[action.type], "success");
        return true;
      } catch {
        toast.push(t("common.error"), "error");
        return false;
      }
    },
    [setIncidents, t, toast],
  );

  const replaceDetection = useCallback(
    (d: LeakDetection) =>
      setDetections((prev) => (prev ? prev.map((x) => (x.id === d.id ? d : x)) : prev)),
    [setDetections],
  );

  const investigateDetection = useCallback(
    async (id: string) => {
      try {
        replaceDetection(await technicianApi.investigateDetection(id));
        toast.push(t("leak.toast.investigating"), "info");
      } catch {
        toast.push(t("common.error"), "error");
      }
    },
    [replaceDetection, t, toast],
  );

  const dismissDetection = useCallback(
    async (id: string) => {
      try {
        replaceDetection(await technicianApi.dismissDetection(id));
        toast.push(t("leak.toast.dismissed"), "info");
      } catch {
        toast.push(t("common.error"), "error");
      }
    },
    [replaceDetection, t, toast],
  );

  const createIncidentFromDetection = useCallback(
    async (id: string) => {
      try {
        const { detection, issue } = await technicianApi.createIncidentFromDetection(id);
        replaceDetection(detection);
        setIncidents((prev) => [issue, ...(prev ?? [])]);
        toast.push(t("leak.toast.created", { id: issue.id }), "success");
      } catch {
        toast.push(t("common.error"), "error");
      }
    },
    [replaceDetection, setIncidents, t, toast],
  );

  const openIncident = useCallback((id: string) => setSelectedId(id), []);
  const closeIncident = useCallback(() => setSelectedId(null), []);

  const value = useMemo<TechnicianData>(
    () => ({
      profile: profile.data,
      technicians: team.data ?? [],
      incidents: incidentsQ.data ?? [],
      incidentsLoading: incidentsQ.loading && !incidentsQ.data,
      incidentsError: !!incidentsQ.error && !incidentsQ.data,
      reloadIncidents,
      act,
      detections: detectionsQ.data ?? [],
      detectionsLoading: detectionsQ.loading && !detectionsQ.data,
      detectionsError: !!detectionsQ.error && !detectionsQ.data,
      reloadDetections,
      investigateDetection,
      dismissDetection,
      createIncidentFromDetection,
      selectedId,
      openIncident,
      closeIncident,
    }),
    [
      profile.data,
      team.data,
      incidentsQ.data,
      incidentsQ.loading,
      incidentsQ.error,
      detectionsQ.data,
      detectionsQ.loading,
      detectionsQ.error,
      reloadIncidents,
      reloadDetections,
      act,
      investigateDetection,
      dismissDetection,
      createIncidentFromDetection,
      selectedId,
      openIncident,
      closeIncident,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTechnicianData(): TechnicianData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTechnicianData must be used inside <TechnicianDataProvider>");
  return ctx;
}
