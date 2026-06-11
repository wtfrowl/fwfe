import { ReactNode } from "react";
import { cn } from "../../utils/cn";

const toneClasses = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  danger: "bg-rose-50 text-rose-700 ring-rose-200",
  info: "bg-sky-50 text-sky-700 ring-sky-200",
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

type Tone = keyof typeof toneClasses;

export function StatusBadge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
