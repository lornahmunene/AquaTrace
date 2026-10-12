"use client";

import { ClipboardList, Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { IssueCard } from "@/components/farmer/IssueCard";
import { PageHeader } from "@/components/farmer/PageHeader";
import { ISSUE_TYPES } from "@/components/farmer/shared";
import { Badge, EmptyState, ErrorState, Segmented, Skeleton } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFarmerData } from "@/lib/state/FarmerDataContext";
import type { IssueType } from "@/lib/types";

type Scope = "all" | "open" | "resolved";

function IssuesContent() {
  const { t } = useI18n();
  const toast = useToast();
  const { issues, issuesLoading, issuesError, reloadIssues, openReport, reopenIssue } = useFarmerData();
  const params = useSearchParams();
  const focus = params.get("focus");

  const [scope, setScope] = useState<Scope>("all");
  const [type, setType] = useState<IssueType | "all">("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);

  // Deep link from alerts / overview: expand and scroll to the issue.
  useEffect(() => {
    if (!focus || issues.length === 0) return;
    setExpanded((prev) => new Set(prev).add(focus));
    setScope("all");
    setType("all");
    setQuery("");
    const id = setTimeout(() => {
      document.getElementById(focus)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
    return () => clearTimeout(id);
  }, [focus, issues.length]);

  const openCount = issues.filter((i) => i.status !== "resolved").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return issues.filter((i) => {
      if (scope === "open" && i.status === "resolved") return false;
      if (scope === "resolved" && i.status !== "resolved") return false;
      if (type !== "all" && i.type !== type) return false;
      if (q) {
        const hay = `${i.id} ${i.description} ${i.locationDetail ?? ""} ${t(`issues.type.${i.type}`)} ${t(`loc.${i.location}`)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [issues, scope, type, query, t]);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onReopen(id: string) {
    setBusyId(id);
    try {
      await reopenIssue(id);
      toast.push(t("issues.reopened"), "success");
    } catch {
      toast.push(t("common.error"), "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title={t("issues.title")}
        subtitle={t("issues.subtitle")}
        action={
          <button className="btn-primary" onClick={() => openReport()}>
            <Plus className="h-4 w-4" />
            {t("issues.report")}
          </button>
        }
      />

      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented<Scope>
            value={scope}
            onChange={setScope}
            label={t("issues.filter.status")}
            options={[
              { value: "all", label: t("common.all") },
              { value: "open", label: t("issues.filter.open") },
              { value: "resolved", label: t("issues.filter.resolved") },
            ]}
          />
          {openCount > 0 && <Badge tone="amber">{t("issues.openCount", { n: openCount })}</Badge>}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-[1fr_12rem]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder={t("issues.search")}
              aria-label={t("common.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="input"
            aria-label={t("issues.filter.type")}
            value={type}
            onChange={(e) => setType(e.target.value as IssueType | "all")}
          >
            <option value="all">{t("issues.filter.type")}: {t("common.all")}</option>
            {ISSUE_TYPES.map((it) => (
              <option key={it} value={it}>
                {t(`issues.type.${it}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {issuesError ? (
        <ErrorState onRetry={reloadIssues} />
      ) : issuesLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-8 w-8" />}
          title={issues.length === 0 ? t("issues.emptyAll") : t("issues.empty")}
          action={
            issues.length === 0 ? (
              <button className="btn-primary btn-sm" onClick={() => openReport()}>
                {t("issues.report")}
              </button>
            ) : (
              <button
                className="btn-ghost btn-sm"
                onClick={() => {
                  setScope("all");
                  setType("all");
                  setQuery("");
                }}
              >
                {t("common.clearFilters")}
              </button>
            )
          }
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              expanded={expanded.has(issue.id)}
              busy={busyId === issue.id}
              onToggle={() => toggle(issue.id)}
              onReopen={onReopen}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function IssuesPage() {
  return (
    <Suspense fallback={<Skeleton className="h-64" />}>
      <IssuesContent />
    </Suspense>
  );
}
