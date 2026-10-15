import type {
  Farmer,
  FieldBlock,
  Issue,
  NewIssueInput,
  Notification,
  Recommendation,
  Schedule,
  ScheduleStatus,
  SupplyReading,
  UsagePoint,
  UsageRange,
  WaterOverview,
} from "@/lib/types";
import { mockFarmerApi } from "@/lib/mock/farmerApi";
import { USE_MOCK, apiFetch } from "./client";

/**
 * Everything the farmer UI needs from a backend. Components only ever call
 * `farmerApi`, so swapping mock -> real is a one-line env change.
 */
export interface FarmerApi {
  getProfile(): Promise<Farmer>;
  getOverview(): Promise<WaterOverview>;
  getUsage(range: UsageRange): Promise<UsagePoint[]>;
  getSupplyTrend(): Promise<SupplyReading[]>;
  getFieldBlocks(): Promise<FieldBlock[]>;

  getSchedules(): Promise<Schedule[]>;
  updateScheduleStatus(id: string, status: ScheduleStatus): Promise<Schedule>;

  getRecommendations(): Promise<Recommendation[]>;
  applyRecommendation(
    id: string,
  ): Promise<{ recommendation: Recommendation; schedule?: Schedule }>;
  dismissRecommendation(id: string): Promise<Recommendation>;

  getNotifications(): Promise<Notification[]>;
  markNotificationsRead(ids?: string[]): Promise<void>;

  getIssues(): Promise<Issue[]>;
  createIssue(input: NewIssueInput): Promise<Issue>;
  reopenIssue(id: string): Promise<Issue>;
}

/** Real backend. Endpoints are documented in docs/API_CONTRACT.md. */
const httpFarmerApi: FarmerApi = {
  getProfile: () => apiFetch("/farmer/profile"),
  getOverview: () => apiFetch("/farmer/overview"),
  getUsage: (range) => apiFetch("/farmer/usage", { query: { range } }),
  getSupplyTrend: () => apiFetch("/farmer/supply-trend"),
  getFieldBlocks: () => apiFetch("/farmer/field-blocks"),

  getSchedules: () => apiFetch("/farmer/schedules"),
  updateScheduleStatus: (id, status) =>
    apiFetch(`/farmer/schedules/${id}`, { method: "PATCH", body: { status } }),

  getRecommendations: () => apiFetch("/farmer/recommendations"),
  applyRecommendation: (id) =>
    apiFetch(`/farmer/recommendations/${id}/apply`, { method: "POST" }),
  dismissRecommendation: (id) =>
    apiFetch(`/farmer/recommendations/${id}/dismiss`, { method: "POST" }),

  getNotifications: () => apiFetch("/farmer/notifications"),
  markNotificationsRead: (ids) =>
    apiFetch("/farmer/notifications/read", { method: "POST", body: { ids } }),

  getIssues: () => apiFetch("/farmer/issues"),
  createIssue: (input) => apiFetch("/farmer/issues", { method: "POST", body: input }),
  reopenIssue: (id) => apiFetch(`/farmer/issues/${id}/reopen`, { method: "POST" }),
};

export const farmerApi: FarmerApi = USE_MOCK ? mockFarmerApi : httpFarmerApi;
