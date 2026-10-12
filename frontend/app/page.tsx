"use client";

import { ArrowRight, Droplets, Sprout, Wrench } from "lucide-react";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/I18nProvider";

// TODO(auth): replace this role picker with real login + role-based redirect.
export default function Landing() {
  const { t } = useI18n();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col px-5 py-6">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>

      <div className="flex flex-1 flex-col justify-center py-10">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-aqua-500 to-leaf-500 text-white shadow-lg">
            <Droplets className="h-9 w-9" />
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-aqua-900">{t("landing.title")}</h1>
          <p className="mx-auto mt-3 max-w-md text-balance text-slate-600">
            {t("landing.subtitle")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/farmer"
            className="card group p-5 transition hover:-translate-y-0.5 hover:border-leaf-300"
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-leaf-100 text-leaf-700">
              <Sprout className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{t("landing.farmer")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("landing.farmerDesc")}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-leaf-700">
              {t("shell.role.farmer")}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>

          <Link
            href="/technician"
            className="card group p-5 transition hover:-translate-y-0.5 hover:border-aqua-300"
          >
            <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-aqua-100 text-aqua-700">
              <Wrench className="h-6 w-6" />
            </span>
            <h2 className="text-lg font-semibold text-slate-900">{t("landing.technician")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("landing.technicianDesc")}</p>
            <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-aqua-700">
              {t("shell.role.technician")}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {t("landing.soon")}
              </span>
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
