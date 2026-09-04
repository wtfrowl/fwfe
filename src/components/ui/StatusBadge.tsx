import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

const toneClasses = {
  success: "bg-positive-soft text-positive-ink ring-positive/25",
  warning: "bg-caution-soft text-caution-ink ring-caution/30",
  danger: "bg-critical-soft text-critical-ink ring-critical/25",
  info: "bg-accent-soft text-accent-ink ring-accent/20",
  neutral: "bg-ink/6 text-ink-secondary ring-ink/10",
} as const;

type Tone = keyof typeof toneClasses;

/**
 * Status must survive being read at a glance in a dense table, so it carries
 * tone AND a ring — colour alone is not a signal for everyone looking at it.
 */
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        "text-caption whitespace-nowrap",
        toneClasses[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
