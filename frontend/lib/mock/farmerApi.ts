/**
 * In-memory implementation of FarmerApi used while the backend does not exist.
 * State lives in module scope, so actions (skip session, report issue, ...)
 * persist while navigating, and reset on a full page refresh.
 */
import { L } from "@/lib/i18n/config";
import type { FarmerApi } from "@/lib/api/farmer";
import type { Issue, NewIssueInput, UsageRange } from "@/lib/types";
import {
  FARMER,
  buildDailyUsage,
  buildFieldBlocks,
  buildNotifications,
  buildOverview,
  buildRecommendations,
  buildSchedules,
  buildSupplyTrend,
  lpmForBlock,
} from "./seed";
import { drainFarmerInbox, getStore, nextIssueId } from "./store";

const delay = (ms = 200 + Math.random() * 250) => new Promise((r) => setTimeout(r, ms));
const clone = <T,>(v: T): T => structuredClone(v);

// ---- lazily created state (so SSR never builds it) ----
let state: ReturnType<typeof init> | null = null;

function init() {
  const schedules = buildSchedules();
  const usage = buildDailyUsage();
  const trend = buildSupplyTrend();
  const overview = buildOverview(usage, trend, schedules);
  return {
    schedules,
    usage,
    trend,
    overview,
    blocks: buildFieldBlocks(),
    recommendations: buildRecommendations(schedules, overview),
    notifications: buildNotifications(schedules, overview),
  };
}

const s = () => (state ??= init());

export const mockFarmerApi: FarmerApi = {
  async getProfile() {
    await delay(120);
    return clone(FARMER);
  },

  async getOverview() {
    await delay();
    const st = s();
    return clone({ ...st.overview, lastUpdated: new Date().toISOString() });
  },

  async getUsage(range: UsageRange) {
    await delay();
    const n = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return clone(s().usage.slice(-n));
  },

  async getSupplyTrend() {
    await delay();
    return clone(s().trend);
  },

  async getFieldBlocks() {
    await delay();
    return clone(s().blocks);
  },

  async getSchedules() {
    await delay();
    return clone(s().schedules);
  },

  async updateScheduleStatus(id, status) {
    await delay(150);
    const item = s().schedules.find((x) => x.id === id);
    if (!item) throw new Error("Schedule not found");
    item.status = status;
    return clone(item);
  },

  async getRecommendations() {
    await delay();
    return clone(s().recommendations);
  },

  async applyRecommendation(id) {
    await delay(250);
    const st = s();
    const rec = st.recommendations.find((r) => r.id === id);
    if (!rec) throw new Error("Recommendation not found");
    rec.status = "applied";

    let schedule;
    if (rec.scheduleId && rec.patch) {
      schedule = st.schedules.find((x) => x.id === rec.scheduleId);
      if (schedule) {
        Object.assign(schedule, rec.patch);
        schedule.litres = schedule.durationMin * lpmForBlock(schedule.blockId);
        schedule.aiAdjusted = true;
        schedule.note = L(
          "Adjusted by an AI recommendation (sample rule).",
          "Imerekebishwa kwa pendekezo la AI (kanuni ya mfano).",
        );
      }
    }
    return clone({ recommendation: rec, schedule });
  },

  async dismissRecommendation(id) {
    await delay(150);
    const rec = s().recommendations.find((r) => r.id === id);
    if (!rec) throw new Error("Recommendation not found");
    rec.status = "dismissed";
    return clone(rec);
  },

  async getNotifications() {
    await delay();
    // Pick up updates technicians produced while the farmer app was idle.
    s().notifications.unshift(...drainFarmerInbox());
    return clone(
      [...s().notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async markNotificationsRead(ids) {
    await delay(100);
    for (const n of s().notifications) {
      if (!ids || ids.includes(n.id)) n.read = true;
    }
  },

  async getIssues() {
    await delay();
    // The farmer only sees their own reports, without technician-internal notes.
    return clone(
      getStore()
        .issues.filter((i) => i.reporter?.id === FARMER.id)
        .map((i) => ({ ...i, timeline: i.timeline.filter((e) => !e.internal) }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async createIssue(input: NewIssueInput) {
    await delay(450);
    const st = s();
    const now = new Date().toISOString();
    const id = nextIssueId();
    const issue: Issue = {
      id,
      ...input,
      status: "reported",
      createdAt: now,
      updatedAt: now,
      zone: "B",
      origin: "farmer",
      reporter: { id: FARMER.id, name: FARMER.name, plot: FARMER.plotName },
      timeline: [
        {
          status: "reported",
          at: now,
          note: L("Submitted by farmer", "Imetumwa na mkulima"),
          by: FARMER.name,
        },
      ],
    };
    getStore().issues.unshift(issue);
    st.notifications.unshift({
      id: `n-${Date.now()}`,
      type: "issue",
      severity: "info",
      title: L(`Report ${id} received`, `Ripoti ${id} imepokelewa`),
      body: L(
        "Your report was sent to the technician team.",
        "Ripoti yako imetumwa kwa timu ya mafundi.",
      ),
      createdAt: now,
      read: false,
      issueId: id,
    });
    return clone(issue);
  },

  async reopenIssue(id) {
    await delay(300);
    const issue = getStore().issues.find((i) => i.id === id && i.reporter?.id === FARMER.id);
    if (!issue) throw new Error("Issue not found");
    const now = new Date().toISOString();
    issue.status = "reported";
    issue.updatedAt = now;
    issue.timeline.push({
      status: "reported",
      at: now,
      note: L(
        "Reopened by farmer: the problem is still there.",
        "Imefunguliwa tena na mkulima: tatizo bado lipo.",
      ),
      by: FARMER.name,
    });
    return clone({ ...issue, timeline: issue.timeline.filter((e) => !e.internal) });
  },
};
