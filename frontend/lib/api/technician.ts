import type {
  BalancePoint,
  IncidentAction,
  Issue,
  LeakDetection,
  NetworkOverview,
  Sensor,
  Technician,
  UsageRange,
  ZoneStat,
} from "@/lib/types";
import { mockTechnicianApi } from "@/lib/mock/technicianApi";
import { USE_MOCK, apiFetch } from "./client";

/**
 * Everything the technician UI needs from a backend. Components only call
 * `technicianApi`; mock vs real is decided by NEXT_PUBLIC_USE_MOCK.
 */
export interface TechnicianApi {
  getProfile(): Promise<Technician>;
  getTechnicians(): Promise<Technician[]>;

  getNetworkOverview(): Promise<NetworkOverview>;
  getZones(): Promise<ZoneStat[]>;
  getWaterBalance(range: UsageRange): Promise<BalancePoint[]>;
  getSensors(): Promise<Sensor[]>;

  getLeakDetections(): Promise<LeakDetection[]>;
  investigateDetection(id: string): Promise<LeakDetection>;
  dismissDetection(id: string): Promise<LeakDetection>;
  createIncidentFromDetection(id: string): Promise<{ detection: LeakDetection; issue: Issue }>;

  getIncidents(): Promise<Issue[]>;
  applyIncidentAction(id: string, action: IncidentAction): Promise<Issue>;
}

/** Real backend. Endpoints are documented in docs/API_CONTRACT.md. */
const httpTechnicianApi: TechnicianApi = {
  getProfile: () => apiFetch("/technician/profile"),
  getTechnicians: () => apiFetch("/technician/team"),

  getNetworkOverview: () => apiFetch("/network/overview"),
  getZones: () => apiFetch("/network/zones"),
  getWaterBalance: (range) => apiFetch("/network/water-balance", { query: { range } }),
  getSensors: () => apiFetch("/network/sensors"),

  getLeakDetections: () => apiFetch("/network/leak-detections"),
  investigateDetection: (id) => apiFetch(`/network/leak-detections/${id}/investigate`, { method: "POST" }),
  dismissDetection: (id) => apiFetch(`/network/leak-detections/${id}/dismiss`, { method: "POST" }),
  createIncidentFromDetection: (id) => apiFetch(`/network/leak-detections/${id}/incident`, { method: "POST" }),

  getIncidents: () => apiFetch("/technician/incidents"),
  applyIncidentAction: (id, action) =>
    apiFetch(`/technician/incidents/${id}/actions`, { method: "POST", body: action }),
};

export const technicianApi: TechnicianApi = USE_MOCK ? mockTechnicianApi : httpTechnicianApi;
