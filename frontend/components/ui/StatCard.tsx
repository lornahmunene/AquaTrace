"use client";

import type { ComponentType, ReactNode } from "react";
import { ProgressBar, type Tone } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export function StatCard({
  icon: Icon,
  tint,
  label,
  value,
  unit,
  sub,
  progress,
  progressTone,
}: {
  icon: ComponentType<{ className?: string }>;
  tint: "blue" | "green" | "amber" | "red";
  label: string;
  value: ReactNode;
  unit?: string;
  sub: string;
  progress?: number;
  progressTone?: Tone;
}) {
  const tints = {
    blue: "bg-aqua-100 text-aqua-700",
    green: "bg-leaf-100 text-leaf-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", tints[tint])}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
      <p className="text-2xl font-bold tracking-tight text-slate-900">
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-slate-500">{unit}</span>}
      </p>
      {progress !== undefined && (
        <div className="mt-2.5">
          <ProgressBar value={progress} tone={progressTone} label={label} />
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">{sub}</p>
    </div>
  );
}
