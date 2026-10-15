"use client";

import { CheckCheck, Loader2, MapPin, MessageSquarePlus, Play, RotateCcw, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { IssueSeverityBadge, IssueStatusBadge, issueTypeIcon } from "@/components/common/issue-ui";
import { Badge, Modal } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useTechnicianData } from "@/lib/state/TechnicianDataContext";
import { SlaTag } from "./SlaTag";

export function IncidentDetailDialog() {
  const { t, lt, fmt } = useI18n();
  const { incidents, selectedId, closeIncident, act, technicians, profile } = useTechnicianData();
  const issue = incidents.find((i) => i.id === selectedId) ?? null;

  const [assignTo, setAssignTo] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [resolveError, setResolveError] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteShare, setNoteShare] = useState(true);
  const [busy, setBusy] = useState(false);

  // Fresh form every time a different incident is opened.
  useEffect(() => {
    setAssignTo("");
    setResolving(false);
    setResolveNote("");
    setResolveError(false);
    setNoteText("");
    setNoteShare(true);
  }, [selectedId]);

  if (!issue) return <Modal open={false} onClose={closeIncident} title="" children={null} />;

  const Icon = issueTypeIcon[issue.type];
  const resolved = issue.status === "resolved";
  const fromFarmer = (issue.origin ?? "farmer") === "farmer";
  const canStart = ["reported", "acknowledged", "technician_assigned"].includes(issue.status);
  const where = `${t(`loc.${issue.location}`)}${issue.locationDetail ? ` — ${issue.locationDetail}` : ""}`;

  async function run(fn: () => Promise<boolean>) {
    setBusy(true);
    const ok = await fn();
    setBusy(false);
    return ok;
  }

  async function onResolve() {
    if (resolveNote.trim().length < 5) {
      setResolveError(true);
      return;
    }
    const ok = await run(() => act(issue!.id, { type: "resolve", note: resolveNote.trim() }));
    if (ok) {
      setResolving(false);
      setResolveNote("");
    }
  }

  async function onAddNote() {
    if (!noteText.trim()) return;
    const ok = await run(() =>
      act(issue!.id, { type: "note", note: noteText.trim(), shareWithFarmer: fromFarmer && noteShare }),
    );
    if (ok) setNoteText("");
  }

  return (
    <Modal open onClose={closeIncident} wide title={`${t(`issues.type.${issue.type}`)} · ${issue.id}`}>
      <div className="space-y-5 pb-2">
        {/* Summary */}
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-aqua-100 text-aqua-700">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <IssueStatusBadge status={issue.status} />
              <IssueSeverityBadge severity={issue.severity} />
              <SlaTag issue={issue} />
              {issue.zone && <Badge tone="slate">{t("net.zone", { id: issue.zone })}</Badge>}
              <Badge tone={fromFarmer ? "green" : "blue"}>{t(`inc.origin.${issue.origin ?? "farmer"}`)}</Badge>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t("issues.reportedAt", { time: fmt.relative(issue.createdAt) })} ·{" "}
              {t("issues.updatedAt", { time: fmt.relative(issue.updatedAt) })}
            </p>
          </div>
        </div>

        <dl className="grid gap-3 rounded-xl bg-slate-50 p-3.5 text-sm sm:grid-cols-2">
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("inc.detail.description")}
            </dt>
            <dd className="mt-1 text-slate-800">{issue.description}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("inc.detail.location")}
            </dt>
            <dd className="mt-1 flex items-start gap-1.5 text-slate-800">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              {where}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("inc.detail.reportedBy")}
            </dt>
            <dd className="mt-1 text-slate-800">
              {issue.reporter
                ? t("inc.reporter", { name: issue.reporter.name, plot: issue.reporter.plot })
                : t(`inc.origin.${issue.origin ?? "sensor"}`)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t("inc.filter.assignee")}
            </dt>
            <dd className="mt-1 font-medium text-slate-800">{issue.assignedTo ?? t("inc.unassigned")}</dd>
          </div>
        </dl>

        {/* Actions */}
        <section>
          <h3 className="mb-2 text-sm font-semibold text-slate-900">{t("inc.detail.actions")}</h3>

          {resolved ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-leaf-50 px-3.5 py-3">
              <p className="text-sm text-leaf-800">{t("inc.detail.resolvedInfo")}</p>
              <button
                className="btn-outline btn-sm"
                disabled={busy}
                onClick={() => run(() => act(issue.id, { type: "reopen" }))}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t("inc.action.reopen")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {issue.status === "reported" && (
                  <button
                    className="btn-outline"
                    disabled={busy}
                    onClick={() => run(() => act(issue.id, { type: "acknowledge" }))}
                  >
                    <CheckCheck className="h-4 w-4" />
                    {t("inc.action.acknowledge")}
                  </button>
                )}
                {canStart && (
                  <button
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => run(() => act(issue.id, { type: "start" }))}
                  >
                    <Play className="h-4 w-4" />
                    {t("inc.action.start")}
                  </button>
                )}
                <button className="btn-green" disabled={busy} onClick={() => setResolving((v) => !v)}>
                  <CheckCheck className="h-4 w-4" />
                  {t("inc.action.resolve")}
                </button>
              </div>

              {resolving && (
                <div className="rounded-xl border border-leaf-200 bg-leaf-50/50 p-3">
                  <label htmlFor="resolve-note" className="label">
                    {t("inc.resolve.title")}
                  </label>
                  <textarea
                    id="resolve-note"
                    className="input min-h-20 resize-y"
                    placeholder={t("inc.resolve.placeholder")}
                    value={resolveNote}
                    onChange={(e) => {
                      setResolveNote(e.target.value);
                      setResolveError(false);
                    }}
                    maxLength={500}
                  />
                  {resolveError && (
                    <p role="alert" className="mt-2 text-sm text-red-700">
                      {t("inc.resolve.required")}
                    </p>
                  )}
                  <div className="mt-2.5 flex justify-end gap-2">
                    <button className="btn-ghost btn-sm" onClick={() => setResolving(false)}>
                      {t("common.cancel")}
                    </button>
                    <button className="btn-green btn-sm" disabled={busy} onClick={onResolve}>
                      {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      {t("inc.resolve.confirm")}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="assign-to" className="label">
                  {t("inc.action.assignTo")}
                </label>
                <div className="flex flex-wrap gap-2">
                  <select
                    id="assign-to"
                    className="input basis-full sm:basis-auto sm:max-w-xs sm:flex-1"
                    value={assignTo}
                    onChange={(e) => setAssignTo(e.target.value)}
                  >
                    <option value="">{t("inc.action.choose")}</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.name}>
                        {tech.fullName} · {tech.zones.join(", ")}
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn-outline"
                    disabled={busy || !assignTo || assignTo === issue.assignedTo}
                    onClick={() => run(() => act(issue.id, { type: "assign", to: assignTo }))}
                  >
                    <UserPlus className="h-4 w-4" />
                    {t("inc.action.assign")}
                  </button>
                  {profile && issue.assignedTo !== profile.name && (
                    <button
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() => run(() => act(issue.id, { type: "assign", to: profile.name }))}
                    >
                      {t("inc.action.assignMe")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Note composer */}
        <section>
          <label htmlFor="inc-note" className="mb-2 block text-sm font-semibold text-slate-900">
            {t("inc.note.title")}
          </label>
          <textarea
            id="inc-note"
            className="input min-h-16 resize-y"
            placeholder={t("inc.note.placeholder")}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            maxLength={400}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {fromFarmer ? (
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={noteShare}
                  onChange={(e) => setNoteShare(e.target.checked)}
                  className="h-4 w-4 accent-aqua-600"
                />
                {t("inc.note.share")}
              </label>
            ) : (
              <span />
            )}
            <button className="btn-outline btn-sm" disabled={busy || !noteText.trim()} onClick={onAddNote}>
              <MessageSquarePlus className="h-3.5 w-3.5" />
              {t("inc.note.send")}
            </button>
          </div>
          {fromFarmer && <p className="mt-1.5 text-xs text-slate-400">{t("inc.detail.farmerNotified")}</p>}
        </section>

        {/* Timeline */}
        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">{t("inc.detail.activity")}</h3>
          <ol className="space-y-4 border-l-2 border-aqua-100 pl-4">
            {issue.timeline.map((ev, i) => (
              <li key={i} className="relative">
                <span
                  className={cn(
                    "absolute -left-[23px] top-1 h-3 w-3 rounded-full ring-4 ring-white",
                    ev.status === "resolved" ? "bg-leaf-500" : "bg-aqua-500",
                  )}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <IssueStatusBadge status={ev.status} />
                  {ev.internal && <Badge tone="amber">{t("inc.note.internalTag")}</Badge>}
                  <time className="text-xs text-slate-500" dateTime={ev.at}>
                    {fmt.date(ev.at, { day: "numeric", month: "short" })}, {fmt.time(ev.at)}
                  </time>
                  {ev.by && <span className="text-xs text-slate-400">{t("inc.detail.by", { name: ev.by })}</span>}
                </div>
                {ev.note && <p className="mt-1 text-sm text-slate-600">{lt(ev.note)}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  );
}
