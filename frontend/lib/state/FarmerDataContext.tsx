"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { farmerApi } from "@/lib/api/farmer";
import { useAsync } from "@/lib/hooks/useAsync";
import type { Farmer, Issue, IssueType, NewIssueInput, Notification } from "@/lib/types";

/**
 * Data that several farmer screens share (alert badge in the top bar,
 * open-issue counts, the "report an issue" dialog). Page-specific data
 * (charts, schedules, ...) is fetched inside each page instead.
 */
interface FarmerData {
  profile: Farmer | null;

  notifications: Notification[];
  notificationsLoading: boolean;
  unreadCount: number;
  markNotificationsRead: (ids?: string[]) => Promise<void>;

  issues: Issue[];
  issuesLoading: boolean;
  issuesError: boolean;
  reloadIssues: () => void;
  createIssue: (input: NewIssueInput) => Promise<Issue>;
  reopenIssue: (id: string) => Promise<Issue>;

  reportOpen: boolean;
  reportPreset?: IssueType;
  openReport: (preset?: IssueType) => void;
  closeReport: () => void;
}

const Ctx = createContext<FarmerData | null>(null);

export function FarmerDataProvider({ children }: { children: ReactNode }) {
  const profile = useAsync(() => farmerApi.getProfile(), []);
  const notifs = useAsync(() => farmerApi.getNotifications(), []);
  const issuesQ = useAsync(() => farmerApi.getIssues(), []);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportPreset, setReportPreset] = useState<IssueType | undefined>();

  const notifications = notifs.data ?? [];
  const issues = issuesQ.data ?? [];
  const setNotifs = notifs.setData;
  const setIssues = issuesQ.setData;
  const reloadNotifs = notifs.reload;

  const markNotificationsRead = useCallback(
    async (ids?: string[]) => {
      // optimistic update
      setNotifs((prev) =>
        prev ? prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, read: true } : n)) : prev,
      );
      try {
        await farmerApi.markNotificationsRead(ids);
      } catch {
        reloadNotifs();
      }
    },
    [setNotifs, reloadNotifs],
  );

  const createIssue = useCallback(
    async (input: NewIssueInput) => {
      const issue = await farmerApi.createIssue(input);
      setIssues((prev) => [issue, ...(prev ?? [])]);
      reloadNotifs();
      return issue;
    },
    [setIssues, reloadNotifs],
  );

  const reopenIssue = useCallback(
    async (id: string) => {
      const updated = await farmerApi.reopenIssue(id);
      setIssues((prev) => (prev ? prev.map((i) => (i.id === id ? updated : i)) : prev));
      return updated;
    },
    [setIssues],
  );

  const openReport = useCallback((preset?: IssueType) => {
    setReportPreset(preset);
    setReportOpen(true);
  }, []);
  const closeReport = useCallback(() => setReportOpen(false), []);

  const value = useMemo<FarmerData>(
    () => ({
      profile: profile.data,
      notifications,
      notificationsLoading: notifs.loading && !notifs.data,
      unreadCount: notifications.filter((n) => !n.read).length,
      markNotificationsRead,
      issues,
      issuesLoading: issuesQ.loading && !issuesQ.data,
      issuesError: !!issuesQ.error,
      reloadIssues: issuesQ.reload,
      createIssue,
      reopenIssue,
      reportOpen,
      reportPreset,
      openReport,
      closeReport,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      profile.data,
      notifs.data,
      notifs.loading,
      issuesQ.data,
      issuesQ.loading,
      issuesQ.error,
      reportOpen,
      reportPreset,
      markNotificationsRead,
      createIssue,
      reopenIssue,
      openReport,
      closeReport,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFarmerData(): FarmerData {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFarmerData must be used inside <FarmerDataProvider>");
  return ctx;
}
