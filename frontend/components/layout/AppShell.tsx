"use client";

import { Bell, Droplets, FlaskConical } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { DictKey } from "@/lib/i18n/dictionaries";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { USE_MOCK } from "@/lib/api/client";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface NavItem {
  href: string;
  labelKey: DictKey;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  /** Match only the exact path (for the root item). */
  exact?: boolean;
}

interface Props {
  nav: NavItem[];
  roleKey: DictKey;
  userName?: string;
  userSub?: string;
  unreadAlerts?: number;
  alertsHref?: string;
  switchRole?: { href: string; labelKey: DictKey };
  children: ReactNode;
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

export function AppShell({
  nav,
  roleKey,
  userName,
  userSub,
  unreadAlerts = 0,
  alertsHref,
  switchRole,
  children,
}: Props) {
  const pathname = usePathname();
  const { t } = useI18n();
  const initials = (userName ?? "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* ---------- Desktop sidebar ---------- */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/70 bg-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-aqua-500 to-leaf-500 text-white shadow-sm">
            <Droplets className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-lg font-bold leading-none text-aqua-900">AquaTrace</span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-leaf-600">
              {t(roleKey)}
            </span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main">
          {nav.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  active
                    ? "bg-aqua-50 text-aqua-800"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-aqua-600" : "text-slate-400")} />
                <span className="flex-1">{t(item.labelKey)}</span>
                {!!item.badge && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-aqua-600 px-1.5 text-[11px] font-semibold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {switchRole && (
          <div className="border-t border-slate-100 p-3">
            <Link href={switchRole.href} className="btn-outline w-full">
              {t(switchRole.labelKey)}
            </Link>
          </div>
        )}
      </aside>

      {/* ---------- Top bar ---------- */}
      <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 lg:hidden">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-aqua-500 to-leaf-500 text-white">
              <Droplets className="h-4 w-4" />
            </span>
            <span className="font-bold text-aqua-900">AquaTrace</span>
          </Link>

          <div className="flex-1" />

          {USE_MOCK && (
            <span
              title={t("shell.simulatedHint")}
              className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 sm:inline-flex"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              {t("shell.simulated")}
            </span>
          )}

          <LanguageSwitcher />

          {alertsHref && (
            <Link
              href={alertsHref}
              className="relative grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-aqua-300 hover:bg-aqua-50"
              aria-label={t("nav.notifications")}
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadAlerts}
                </span>
              )}
            </Link>
          )}

          {userName && (
            <div className="hidden items-center gap-2.5 border-l border-slate-200 pl-3 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-leaf-100 text-sm font-semibold text-leaf-800">
                {initials}
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold text-slate-800">{userName}</span>
                {userSub && <span className="block text-xs text-slate-500">{userSub}</span>}
              </span>
            </div>
          )}
        </div>

        {USE_MOCK && (
          <div className="flex items-center gap-1.5 border-t border-amber-100 bg-amber-50 px-4 py-1.5 text-[11px] font-medium text-amber-800 sm:hidden">
            <FlaskConical className="h-3.5 w-3.5 shrink-0" />
            {t("shell.simulatedHint")}
          </div>
        )}
      </header>

      {/* ---------- Content ---------- */}
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:pb-10 lg:pt-7">{children}</main>

      {/* ---------- Mobile bottom tabs ---------- */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const active = isActive(pathname, item);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                    active ? "text-aqua-700" : "text-slate-500",
                  )}
                >
                  <span
                    className={cn(
                      "relative grid h-7 w-12 place-items-center rounded-full transition",
                      active && "bg-aqua-100",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {!!item.badge && (
                      <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
