"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Modal, Segmented } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFarmerData } from "@/lib/state/FarmerDataContext";
import type { IssueSeverity, IssueType, LocationKey } from "@/lib/types";
import { ISSUE_TYPES, LOCATION_KEYS, issueTypeIcon } from "./shared";

export function ReportIssueDialog() {
  const { t } = useI18n();
  const toast = useToast();
  const { reportOpen, reportPreset, closeReport, createIssue } = useFarmerData();

  const [type, setType] = useState<IssueType>("leak");
  const [severity, setSeverity] = useState<IssueSeverity>("medium");
  const [location, setLocation] = useState<LocationKey | "">("");
  const [detail, setDetail] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // reset the form every time the dialog opens
  useEffect(() => {
    if (reportOpen) {
      setType(reportPreset ?? "leak");
      setSeverity(reportPreset === "leak" ? "high" : "medium");
      setLocation("");
      setDetail("");
      setDescription("");
      setError(false);
      setSubmitting(false);
    }
  }, [reportOpen, reportPreset]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!location || description.trim().length < 5) {
      setError(true);
      return;
    }
    setSubmitting(true);
    try {
      const issue = await createIssue({
        type,
        severity,
        location,
        locationDetail: detail.trim() || undefined,
        description: description.trim(),
      });
      toast.push(t("issues.form.success", { id: issue.id }), "success");
      closeReport();
    } catch {
      toast.push(t("common.error"), "error");
      setSubmitting(false);
    }
  }

  return (
    <Modal open={reportOpen} onClose={closeReport} title={t("issues.form.title")}>
      <form onSubmit={onSubmit} className="space-y-5 pb-2">
        <fieldset>
          <legend className="label">{t("issues.form.type")}</legend>
          <div className="grid gap-2" role="radiogroup">
            {ISSUE_TYPES.map((it) => {
              const Icon = issueTypeIcon[it];
              const selected = type === it;
              return (
                <button
                  key={it}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setType(it)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                    selected
                      ? "border-aqua-500 bg-aqua-50 ring-2 ring-aqua-200"
                      : "border-slate-200 hover:border-aqua-300",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-10 w-10 shrink-0 place-items-center rounded-lg",
                      selected ? "bg-aqua-600 text-white" : "bg-slate-100 text-slate-500",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">
                      {t(`issues.type.${it}`)}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {t(`issues.type.${it}.desc` as const)}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <span className="label">{t("issues.form.severity")}</span>
          <Segmented<IssueSeverity>
            value={severity}
            onChange={setSeverity}
            label={t("issues.form.severity")}
            options={[
              { value: "low", label: t("issues.severity.low") },
              { value: "medium", label: t("issues.severity.medium") },
              { value: "high", label: t("issues.severity.high") },
            ]}
          />
        </div>

        <div>
          <label htmlFor="rep-loc" className="label">
            {t("issues.form.location")}
          </label>
          <select
            id="rep-loc"
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value as LocationKey | "")}
          >
            <option value="">{t("issues.form.locationPlaceholder")}</option>
            {LOCATION_KEYS.map((k) => (
              <option key={k} value={k}>
                {t(`loc.${k}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rep-detail" className="label">
            {t("issues.form.detail")}
          </label>
          <input
            id="rep-detail"
            className="input"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t("issues.form.detailPlaceholder")}
            maxLength={120}
          />
        </div>

        <div>
          <label htmlFor="rep-desc" className="label">
            {t("issues.form.description")}
          </label>
          <textarea
            id="rep-desc"
            className="input min-h-24 resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("issues.form.descriptionPlaceholder")}
            maxLength={500}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {t("issues.form.required")}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn-ghost" onClick={closeReport}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? t("issues.form.submitting") : t("issues.form.submit")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
