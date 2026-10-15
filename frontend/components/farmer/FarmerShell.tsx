"use client";

import { Bell, CalendarClock, FileText, LayoutDashboard } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { useFarmerData } from "@/lib/state/FarmerDataContext";
import { ReportIssueDialog } from "./ReportIssueDialog";

export function FarmerShell({ children }: { children: ReactNode }) {
  const { profile, unreadCount, issues } = useFarmerData();
  const openIssues = issues.filter((i) => i.status !== "resolved").length;

  const nav: NavItem[] = [
    { href: "/farmer", labelKey: "nav.overview", icon: LayoutDashboard, exact: true },
    { href: "/farmer/irrigation", labelKey: "nav.irrigation", icon: CalendarClock },
    { href: "/farmer/notifications", labelKey: "nav.notifications", icon: Bell, badge: unreadCount },
    { href: "/farmer/issues", labelKey: "nav.issues", icon: FileText, badge: openIssues },
  ];

  return (
    <AppShell
      nav={nav}
      roleKey="shell.role.farmer"
      userName={profile?.name}
      userSub={profile ? `${profile.plotName} · ${profile.zone}` : undefined}
      unreadAlerts={unreadCount}
      alertsHref="/farmer/notifications"
      switchRole={{ href: "/technician", labelKey: "shell.switchToTechnician" }}
    >
      {children}
      <ReportIssueDialog />
    </AppShell>
  );
}
