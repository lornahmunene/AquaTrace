"use client";

import { LayoutDashboard, Network, Radio, Siren } from "lucide-react";
import type { ReactNode } from "react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTechnicianData } from "@/lib/state/TechnicianDataContext";
import { IncidentDetailDialog } from "./IncidentDetailDialog";

export function TechnicianShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const { profile, incidents } = useTechnicianData();
  const open = incidents.filter((i) => i.status !== "resolved").length;

  const nav: NavItem[] = [
    { href: "/technician", labelKey: "nav.overview", icon: LayoutDashboard, exact: true },
    { href: "/technician/incidents", labelKey: "nav.incidents", icon: Siren, badge: open },
    { href: "/technician/network", labelKey: "nav.network", icon: Network },
    { href: "/technician/sensors", labelKey: "nav.sensors", icon: Radio },
  ];

  return (
    <AppShell
      nav={nav}
      roleKey="shell.role.technician"
      userName={profile?.fullName}
      userSub={profile ? t("tshell.sub", { zones: profile.zones.join(", ") }) : undefined}
      switchRole={{ href: "/farmer", labelKey: "shell.switchToFarmer" }}
    >
      {children}
      <IncidentDetailDialog />
    </AppShell>
  );
}
