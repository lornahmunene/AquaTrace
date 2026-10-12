/**
 * Shared domain types. These double as the API contract: the FastAPI/Flask
 * backend should return JSON in exactly these shapes (see docs/API_CONTRACT.md).
 * Timestamps are ISO-8601 strings; volumes are litres; pressure is bar.
 */
import type { Text } from "@/lib/i18n/config";

/** Where a reading came from. Mock data is ALWAYS "simulated". */
export type ReadingSource = "simulated" | "sensor";

export interface Farmer {
  id: string;
  name: string;
  schemeName: string;
  zone: string;
  plotName: string;
  connectionId: string;
  acres: number;
  crops: string[];
}

export type SupplyStatus =
  | "normal"
  | "low_pressure"
  | "interrupted"
  | "scheduled_outage";

export interface WaterOverview {
  tank: { levelLitres: number; capacityLitres: number; name: string };
  allocation: {
    monthlyLitres: number;
    usedLitres: number;
    dailyLitres: number;
    dayOfMonth: number;
    daysInMonth: number;
  };
  usedTodayLitres: number;
  pressureBar: number;
  flowLpm: number;
  supplyStatus: SupplyStatus;
  supplyStatusNote?: Text;
  nextSupplyWindow?: { start: string; end: string };
  lastUpdated: string;
  source: ReadingSource;
}

export type UsageRange = "7d" | "14d" | "30d";

export interface UsagePoint {
  date: string; // yyyy-mm-dd
  label: string;
  usedLitres: number;
  allocatedLitres: number;
}

export interface SupplyReading {
  time: string;
  label: string;
  pressureBar: number;
  flowLpm: number;
  source: ReadingSource;
}

export type IrrigationMethod = "drip" | "furrow" | "sprinkler";
export type ScheduleStatus = "scheduled" | "running" | "completed" | "skipped";

export interface Schedule {
  id: string;
  date: string; // yyyy-mm-dd
  startTime: string; // HH:MM (24h)
  durationMin: number;
  litres: number;
  blockId: string;
  blockName: string;
  crop: string;
  method: IrrigationMethod;
  status: ScheduleStatus;
  aiAdjusted: boolean;
  note?: Text;
}

export interface FieldBlock {
  id: string;
  name: string;
  crop: string;
  acres: number;
  method: IrrigationMethod;
  soilMoisturePct: number;
  targetMinPct: number;
  targetMaxPct: number;
  lastReading: string;
  source: ReadingSource;
}

export type RecommendationStatus = "new" | "applied" | "dismissed";
export type Priority = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  title: Text;
  detail: Text;
  impact: Text;
  priority: Priority;
  confidence: number; // 0..1
  status: RecommendationStatus;
  /** Present when applying changes a schedule session. */
  scheduleId?: string;
  patch?: Partial<Pick<Schedule, "startTime" | "durationMin">>;
  /** Makes clear where the advice came from. "mock-rules" = demo data. */
  generatedBy: "mock-rules" | "ai-model";
}

export type NotificationType = "supply" | "schedule" | "leak" | "system" | "issue";
export type Severity = "info" | "warning" | "critical";

export interface Notification {
  id: string;
  type: NotificationType;
  severity: Severity;
  title: Text;
  body: Text;
  createdAt: string;
  read: boolean;
  issueId?: string;
}

export type IssueType = "leak" | "low_pressure" | "shortage";
export type IssueSeverity = "low" | "medium" | "high";
export type IssueStatus =
  | "reported"
  | "acknowledged"
  | "technician_assigned"
  | "in_progress"
  | "resolved";

export const ISSUE_STATUS_ORDER: IssueStatus[] = [
  "reported",
  "acknowledged",
  "technician_assigned",
  "in_progress",
  "resolved",
];

export type LocationKey =
  | "inlet"
  | "lateral"
  | "tank"
  | "standpipe"
  | "field"
  | "other";

export interface IssueEvent {
  status: IssueStatus;
  at: string;
  note?: Text;
}

export interface Issue {
  id: string; // e.g. ISS-1042
  type: IssueType;
  severity: IssueSeverity;
  location: LocationKey;
  locationDetail?: string;
  description: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  timeline: IssueEvent[];
}

export interface NewIssueInput {
  type: IssueType;
  severity: IssueSeverity;
  location: LocationKey;
  locationDetail?: string;
  description: string;
}
