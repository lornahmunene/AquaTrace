"use client";

import { Card, CardHeader } from "@/components/ui/primitives";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useFarmerData } from "@/lib/state/FarmerDataContext";
import { ISSUE_TYPES, issueTypeIcon } from "./shared";

export function QuickReport() {
  const { t } = useI18n();
  const { openReport } = useFarmerData();

  return (
    <Card>
      <CardHeader title={t("quick.title")} subtitle={t("quick.subtitle")} />
      <div className="grid grid-cols-3 gap-2.5">
        {ISSUE_TYPES.map((it) => {
          const Icon = issueTypeIcon[it];
          return (
            <button
              key={it}
              onClick={() => openReport(it)}
              className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-3.5 text-center transition hover:border-aqua-400 hover:bg-aqua-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-aqua-500"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-aqua-100 text-aqua-700">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold leading-tight text-slate-800">
                {t(`issues.type.${it}`)}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
