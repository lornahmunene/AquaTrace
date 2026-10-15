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
  /** Who made the change (display name). */
  by?: string;
  /** Technician-only note. The farmer API must strip these. */
  internal?: boolean;
}

export type ZoneId = "A" | "B" | "C" | "D";
export type IssueOrigin = "farmer" | "sensor" | "technician";

export interface IssueReporter {
  id: string;
  name: string;
  plot: string;
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
  /** Supply zone the issue belongs to (used by technicians). */
  zone?: ZoneId;
  reporter?: IssueReporter;
  /** Where the report came from. Defaults to "farmer" when absent. */
  origin?: IssueOrigin;
}

export interface NewIssueInput {
  type: IssueType;
  severity: IssueSeverity;
  location: LocationKey;
  locationDetail?: string;
  description: string;
}

/* ------------------------------------------------------------------ */
/* Technician / network operations                                     */
/* ------------------------------------------------------------------ */

export interface Technician {
  id: string;
  /** Short display name used in assignments, e.g. "J. Mutua". */
  name: string;
  fullName: string;
  zones: ZoneId[];
  schemeName: string;
}

export interface ZoneStat {
  id: ZoneId;
  name: Text;
  farms: number;
  inflowLitres24h: number;
  consumedLitres24h: number;
  lossLitres24h: number;
  lossPct: number;
  avgPressureBar: number;
  sensorsOnline: number;
  sensorsTotal: number;
  source: ReadingSource;
}

export interface TankStat {
  id: string;
  name: string;
  levelLitres: number;
  capacityLitres: number;
}

export interface NetworkOverview {
  inflowLitres24h: number;
  consumedLitres24h: number;
  lossLitres24h: number;
  lossPct: number;
  /** Utility target for non-revenue water, in percent. */
  targetLossPct: number;
  tanks: TankStat[];
  lastUpdated: string;
  source: ReadingSource;
}

export interface BalancePoint {
  date: string;
  label: string;
  inflowLitres: number;
  consumedLitres: number;
  lossPct: number;
}

export type DetectionStatus = "new" | "investigating" | "dismissed" | "converted";

export interface LeakDetection {
  id: string;
  zone: ZoneId;
  segment: Text;
  signal: Text;
  detectedAt: string;
  estLossLitresPerDay: number;
  confidence: number; // 0..1
  status: DetectionStatus;
  incidentId?: string;
  /** "mock-rules" = demo data, never a trained model or real sensor analysis. */
  generatedBy: "mock-rules" | "ai-model";
}

export type SensorType = "flow" | "pressure" | "tank_level" | "soil_moisture";
export type SensorStatus = "online" | "offline" | "low_battery";

export interface Sensor {
  id: string;
  type: SensorType;
  zone: ZoneId;
  location: Text;
  status: SensorStatus;
  lastSeen: string;
  batteryPct: number | null;
  value: number | null;
  unit: string;
  source: ReadingSource;
}

export type IncidentAction =
  | { type: "acknowledge" }
  | { type: "assign"; to: string }
  | { type: "start" }
  | { type: "resolve"; note: string }
  | { type: "reopen" }
  | { type: "note"; note: string; shareWithFarmer: boolean };
