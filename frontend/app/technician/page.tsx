"use client";

import { Wrench } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";

// Placeholder: the technician dashboard is the next build step.
// Routes will live under app/technician/* with their own layout, mirroring app/farmer/*.
export default function TechnicianPlaceholder() {
  const { t } = useI18n();
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-aqua-100 text-aqua-700">
        <Wrench className="h-7 w-7" />
      </span>
      <h1 className="text-2xl font-bold text-aqua-900">{t("tech.title")}</h1>
      <p className="mt-2 text-slate-600">{t("tech.soon")}</p>
      <Link href="/" className="btn-primary mt-6">
        {t("tech.back")}
      </Link>
    </main>
  );
}
