/**
 * In-memory TechnicianApi. Incidents come from the shared store (lib/mock/store.ts)
 * so they stay in sync with the farmer app.
 */
import { L, type Text } from "@/lib/i18n/config";
import type { TechnicianApi } from "@/lib/api/technician";
import type { Issue, IssueEvent, IssueStatus, UsageRange } from "@/lib/types";
import { FARMER } from "./seed";
import { getStore, nextIssueId } from "./store";
import {
  ME,
  TECHNICIANS,
  buildDetections,
  buildNetworkOverview,
  buildSensors,
  buildWaterBalance,
  buildZones,
} from "./technicianSeed";

const delay = (ms = 180 + Math.random() * 220) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => structuredClone(v);

let state: ReturnType<typeof init> | null = null;
function init() {
  const sensors = buildSensors();
  const zones = buildZones(sensors);
  const overview = buildNetworkOverview(zones);
  return { sensors, zones, overview, balance: buildWaterBalance(overview), detections: buildDetections() };
}
const s = () => (state ??= init());

/** Queue a notification for the demo farmer when one of THEIR reports changes. */
function notifyFarmer(issue: Issue, title: Text, body: Text) {
  if (issue.reporter?.id !== FARMER.id) return;
  getStore().farmerInbox.push({
    id: `n-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: "issue",
    severity: "info",
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
    issueId: issue.id,
  });
}

export const mockTechnicianApi: TechnicianApi = {
  async getProfile() {
    await delay(100);
    return clone(ME);
  },
  async getTechnicians() {
    await delay(100);
    return clone(TECHNICIANS);
  },

  async getNetworkOverview() {
    await delay();
    return clone({ ...s().overview, lastUpdated: new Date().toISOString() });
  },
  async getZones() {
    await delay();
    return clone(s().zones);
  },
  async getWaterBalance(range: UsageRange) {
    await delay();
    const n = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return clone(s().balance.slice(-n));
  },
  async getSensors() {
    await delay();
    return clone(s().sensors);
  },

  async getLeakDetections() {
    await delay();
    return clone(s().detections);
  },
  async investigateDetection(id) {
    await delay(150);
    const d = s().detections.find((x) => x.id === id);
    if (!d) throw new Error("Detection not found");
    d.status = "investigating";
    return clone(d);
  },
  async dismissDetection(id) {
    await delay(150);
    const d = s().detections.find((x) => x.id === id);
    if (!d) throw new Error("Detection not found");
    d.status = "dismissed";
    return clone(d);
  },
  async createIncidentFromDetection(id) {
    await delay(300);
    const d = s().detections.find((x) => x.id === id);
    if (!d) throw new Error("Detection not found");
    const now = new Date().toISOString();
    const text = (t: Text) => (typeof t === "string" ? t : (t.en ?? ""));
    const issue: Issue = {
      id: nextIssueId(),
      type: "leak",
      severity: d.estLossLitresPerDay >= 5000 ? "high" : "medium",
      location: "lateral",
      locationDetail: text(d.segment),
      description: `${text(d.segment)}: ${text(d.signal)}. Estimated loss about ${d.estLossLitresPerDay} L/day.`,
      status: "reported",
      createdAt: now,
      updatedAt: now,
      zone: d.zone,
      origin: "sensor",
      timeline: [
        {
          status: "reported",
          at: now,
          note: L("Created from a leak detection (demo rules).", "Imeundwa kutokana na utambuzi wa uvujaji (kanuni za mfano)."),
          by: ME.name,
        },
      ],
    };
    getStore().issues.unshift(issue);
    d.status = "converted";
    d.incidentId = issue.id;
    return clone({ detection: d, issue });
  },

  async getIncidents() {
    await delay();
    return clone([...getStore().issues].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },

  async applyIncidentAction(id, action) {
    await delay(250);
    const issue = getStore().issues.find((i) => i.id === id);
    if (!issue) throw new Error("Incident not found");

    const now = new Date().toISOString();
    const log = (status: IssueStatus, note?: Text, internal?: boolean) => {
      const ev: IssueEvent = { status, at: now, by: ME.name };
      if (note) ev.note = note;
      if (internal) ev.internal = true;
      issue.timeline.push(ev);
      issue.updatedAt = now;
    };

    switch (action.type) {
      case "acknowledge": {
        if (issue.status !== "reported") break;
        issue.status = "acknowledged";
        log("acknowledged", L("A technician has acknowledged your report.", "Fundi amepokea ripoti yako."));
        notifyFarmer(
          issue,
          L(`Report ${issue.id} acknowledged`, `Ripoti ${issue.id} imepokelewa`),
          L("A technician has seen your report and will follow up.", "Fundi ameona ripoti yako na atafuatilia."),
        );
        break;
      }
      case "assign": {
        if (issue.status === "resolved") break;
        issue.assignedTo = action.to;
        if (issue.status === "reported" || issue.status === "acknowledged") {
          issue.status = "technician_assigned";
        }
        log(issue.status, L(`Assigned to ${action.to}.`, `Amepangiwa ${action.to}.`));
        notifyFarmer(
          issue,
          L(`Technician assigned to ${issue.id}`, `Fundi amepangiwa ${issue.id}`),
          L(`${action.to} is now responsible for your report.`, `${action.to} ndiye anayeshughulikia ripoti yako.`),
        );
        break;
      }
      case "start": {
        if (issue.status === "resolved") break;
        if (!issue.assignedTo) issue.assignedTo = ME.name;
        issue.status = "in_progress";
        log("in_progress", L("Work has started.", "Kazi imeanza."));
        notifyFarmer(
          issue,
          L(`Work started on ${issue.id}`, `Kazi imeanza kwenye ${issue.id}`),
          L(`${issue.assignedTo} has started working on the problem.`, `${issue.assignedTo} ameanza kushughulikia tatizo.`),
        );
        break;
      }
      case "resolve": {
        if (issue.status === "resolved") break;
        if (!issue.assignedTo) issue.assignedTo = ME.name;
        issue.status = "resolved";
        log("resolved", action.note);
        notifyFarmer(
          issue,
          L(`Report ${issue.id} resolved`, `Ripoti ${issue.id} imetatuliwa`),
          action.note,
        );
        break;
      }
      case "reopen": {
        if (issue.status !== "resolved") break;
        issue.status = "acknowledged";
        log("acknowledged", L("Reopened by a technician.", "Imefunguliwa tena na fundi."));
        notifyFarmer(
          issue,
          L(`Report ${issue.id} reopened`, `Ripoti ${issue.id} imefunguliwa tena`),
          L("A technician reopened this report for further checks.", "Fundi amefungua tena ripoti hii kwa ukaguzi zaidi."),
        );
        break;
      }
      case "note": {
        log(issue.status, action.note, !action.shareWithFarmer);
        if (action.shareWithFarmer) {
          notifyFarmer(issue, L(`Update on ${issue.id}`, `Taarifa kuhusu ${issue.id}`), action.note);
        }
        break;
      }
    }
    return clone(issue);
  },
};
