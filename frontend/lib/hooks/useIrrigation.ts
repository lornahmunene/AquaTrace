"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { farmerApi } from "@/lib/api/farmer";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { ScheduleStatus } from "@/lib/types";
import { useAsync } from "./useAsync";

/** Schedules + AI recommendations and the actions that change them. */
export function useIrrigation() {
  const { t } = useI18n();
  const toast = useToast();
  const schedules = useAsync(() => farmerApi.getSchedules(), []);
  const recommendations = useAsync(() => farmerApi.getRecommendations(), []);
  const [busyId, setBusyId] = useState<string | null>(null);

  const setSchedules = schedules.setData;
  const setRecs = recommendations.setData;

  async function changeStatus(id: string, status: ScheduleStatus) {
    setBusyId(id);
    try {
      const updated = await farmerApi.updateScheduleStatus(id, status);
      setSchedules((prev) => (prev ? prev.map((s) => (s.id === id ? updated : s)) : prev));
      toast.push(t(status === "skipped" ? "schedule.skipped" : "schedule.restored"), "info");
    } catch {
      toast.push(t("common.error"), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function applyRecommendation(id: string) {
    setBusyId(id);
    try {
      const res = await farmerApi.applyRecommendation(id);
      setRecs((prev) => (prev ? prev.map((r) => (r.id === id ? res.recommendation : r)) : prev));
      const changed = res.schedule;
      if (changed) {
        setSchedules((prev) => (prev ? prev.map((s) => (s.id === changed.id ? changed : s)) : prev));
      }
      toast.push(t("reco.applied"), "success");
    } catch {
      toast.push(t("common.error"), "error");
    } finally {
      setBusyId(null);
    }
  }

  async function dismissRecommendation(id: string) {
    setBusyId(id);
    try {
      const updated = await farmerApi.dismissRecommendation(id);
      setRecs((prev) => (prev ? prev.map((r) => (r.id === id ? updated : r)) : prev));
      toast.push(t("reco.dismissed"), "info");
    } catch {
      toast.push(t("common.error"), "error");
    } finally {
      setBusyId(null);
    }
  }

  return {
    schedules,
    recommendations,
    busyId,
    changeStatus,
    applyRecommendation,
    dismissRecommendation,
  };
}
