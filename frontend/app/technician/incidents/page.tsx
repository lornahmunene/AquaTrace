"use client";

import { ClipboardList, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { ISSUE_TYPES } from "@/components/common/issue-ui";
import { IncidentRow } from "@/components/technician/IncidentRow";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState, Segmented, Skeleton } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTechnicianData } from "@/lib/state/TechnicianDataContext";
import { ISSUE_STATUS_ORDER, type IssueSeverity, type IssueStatus, type IssueType, type ZoneId } from "@/lib/types";
import { comparePriority } from "@/lib/utils/sla";

type Scope = "open" | "resolved" | "all";
type Sort = "priority" | "newest" | "oldest";
const ZONES: ZoneId[] = ["A", "B", "C", "D"];

function IncidentsContent() {
  const { t } = useI18n();
  const { incidents, incidentsLoading, incidentsError, reloadIncidents, act, openIncident, profile, technicians } =
    useTechnicianData();
  const params = useSearchParams();
  const focus = params.get("focus");

  const [scope, setScope] = useState<Scope>("open");
  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [type, setType] = useState<IssueType | "all">("all");
  const [severity, setSeverity] = useState<IssueSeverity | "all">("all");
  const [zone, setZone] = useState<ZoneId | "all">("all");
  const [assignee, setAssignee] = useState<string>("all"); // all | unassigned | me | <name>
  const [sort, setSort] = useState<Sort>("priority");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Deep link (?focus=ISS-1042) opens that incident.
  useEffect(() => {
    if (focus && incidents.some((i) => i.id === focus)) openIncident(focus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, incidents.length]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const i of incidents) c[i.status] = (c[i.status] ?? 0) + 1;
    return c;
  }, [incidents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = incidents.filter((i) => {
      if (scope === "open" && i.status === "resolved") return false;
      if (scope === "resolved" && i.status !== "resolved") return false;
      if (status !== "all" && i.status !== status) return false;
      if (type !== "all" && i.type !== type) return false;
      if (severity !== "all" && i.severity !== severity) return false;
      if (zone !== "all" && i.zone !== zone) return false;
      if (assignee === "unassigned" && i.assignedTo) return false;
      if (assignee === "me" && i.assignedTo !== profile?.name) return false;
      if (assignee !== "all" && assignee !== "unassigned" && assignee !== "me" && i.assignedTo !== assignee) return false;
      if (q) {
        const hay = `${i.id} ${i.description} ${i.locationDetail ?? ""} ${i.reporter?.name ?? ""} ${i.reporter?.plot ?? ""} ${t(`issues.type.${i.type}`)} ${t(`loc.${i.location}`)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sort === "priority") sorted.sort((a, b) => comparePriority(a, b));
    else if (sort === "newest") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sorted;
  }, [incidents, scope, status, type, severity, zone, assignee, sort, query, profile, t]);

  const filtersActive =
    scope !== "open" || status !== "all" || type !== "all" || severity !== "all" || zone !== "all" || assignee !== "all" || !!query;

  function clearFilters() {
    setScope("open");
    setStatus("all");
    setType("all");
    setSeverity("all");
    setZone("all");
    setAssignee("all");
    setQuery("");
  }

  function pickStatus(s: IssueStatus | "all") {
    setStatus(s);
    setScope("all");
  }

  async function acknowledge(id: string) {
    setBusyId(id);
    await act(id, { type: "acknowledge" });
    setBusyId(null);
  }

  return (
    <div>
      <PageHeader title={t("inc.title")} subtitle={t("inc.subtitle")} />

      {/* Status pipeline: counts double as quick filters */}
      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex min-w-max gap-2 sm:min-w-0 sm:flex-wrap">
          {ISSUE_STATUS_ORDER.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => pickStatus(active ? "all" : s)}
                aria-pressed={active}
                className={cn(
                  "rounded-xl border px-3.5 py-2 text-left transition",
                  active ? "border-aqua-500 bg-aqua-50 ring-2 ring-aqua-200" : "border-slate-200 bg-white hover:border-aqua-300",
                )}
              >
                <span className="block text-xl font-bold leading-none text-slate-900">{statusCounts[s] ?? 0}</span>
                <span className="mt-1 block text-xs font-medium text-slate-500">{t(`issues.status.${s}`)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Scope>
            value={scope}
            onChange={(v) => {
              setScope(v);
              setStatus("all");
            }}
            label={t("inc.filter.status")}
            options={[
              { value: "open", label: t("issues.filter.open") },
              { value: "resolved", label: t("issues.filter.resolved") },
              { value: "all", label: t("common.all") },
            ]}
          />
          <Segmented<Sort>
            value={sort}
            onChange={setSort}
            label={t("inc.sort")}
            options={[
              { value: "priority", label: t("inc.sort.priority") },
              { value: "newest", label: t("inc.sort.newest") },
              { value: "oldest", label: t("inc.sort.oldest") },
            ]}
          />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder={t("inc.search")}
            aria-label={t("common.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <select className="input" aria-label={t("inc.filter.type")} value={type} onChange={(e) => setType(e.target.value as IssueType | "all")}>
            <option value="all">{t("inc.filter.type")}: {t("common.all")}</option>
            {ISSUE_TYPES.map((x) => (
              <option key={x} value={x}>{t(`issues.type.${x}`)}</option>
            ))}
          </select>
          <select className="input" aria-label={t("inc.filter.severity")} value={severity} onChange={(e) => setSeverity(e.target.value as IssueSeverity | "all")}>
            <option value="all">{t("inc.filter.severity")}: {t("common.all")}</option>
            {(["high", "medium", "low"] as const).map((x) => (
              <option key={x} value={x}>{t(`issues.severity.${x}`)}</option>
            ))}
          </select>
          <select className="input" aria-label={t("inc.filter.zone")} value={zone} onChange={(e) => setZone(e.target.value as ZoneId | "all")}>
            <option value="all">{t("inc.filter.zone")}: {t("common.all")}</option>
            {ZONES.map((x) => (
              <option key={x} value={x}>{t("net.zone", { id: x })}</option>
            ))}
          </select>
          <select className="input" aria-label={t("inc.filter.assignee")} value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="all">{t("inc.filter.assignee")}: {t("inc.assignee.all")}</option>
            <option value="me">{t("inc.assignee.me")}</option>
            <option value="unassigned">{t("inc.assignee.unassigned")}</option>
            {technicians
              .filter((x) => x.name !== profile?.name)
              .map((x) => (
                <option key={x.id} value={x.name}>{x.fullName}</option>
              ))}
          </select>
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{t("inc.count", { n: filtered.length })}</span>
          {filtersActive && (
            <button className="font-semibold text-aqua-700 hover:underline" onClick={clearFilters}>
              {t("common.clearFilters")}
            </button>
          )}
        </div>
      </div>

      {incidentsError ? (
        <ErrorState onRetry={reloadIncidents} />
      ) : incidentsLoading ? (
        <div className="space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={t("inc.empty")}
          action={
            filtersActive ? (
              <button className="btn-ghost btn-sm" onClick={clearFilters}>
                {t("common.clearFilters")}
              </button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((i) => (
            <IncidentRow key={i.id} issue={i} onOpen={openIncident} onAcknowledge={acknowledge} busy={busyId === i.id} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <IncidentsContent />
    </Suspense>
  );
}
