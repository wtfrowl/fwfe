import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../motion/springs";
import { cn } from "../../utils/cn";

/**
 * Every chart in the app sits in one of these, so the whole dashboard reads as
 * a single system rather than a collection of panels that each invented their
 * own padding and heading size.
 */
export function ChartCard({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]",
        className
      )}
    >
      <header className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Shown in place of a plot when there is genuinely nothing to draw. */
export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-ink-tertiary">
      {message}
    </div>
  );
}

export type Period = "DAY" | "MONTH" | "YEAR";

/**
 * The selected segment is a shared element that slides between options, so a
 * period change reads as one control moving rather than two backgrounds
 * cross-fading. Same `layoutId` technique as the sidebar, same reason.
 *
 * This control was previously copy-pasted into the revenue and distance
 * charts with slightly different classes in each.
 */
export function PeriodToggle({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const reduced = useReducedMotion();
  const id = `period-${useId()}`;

  return (
    <div className="flex items-center gap-0.5 rounded-control bg-ink/10 p-0.5" role="group">
      {(["DAY", "MONTH", "YEAR"] as Period[]).map((period) => {
        const active = value === period;
        return (
          <motion.button
            key={period}
            type="button"
            onClick={() => onChange(period)}
            aria-pressed={active}
            className={cn(
              "relative rounded-[0.625rem] px-2.5 py-1 text-xs font-semibold transition-colors duration-150",
              active ? "text-ink" : "text-ink-tertiary hover:text-ink-secondary"
            )}
            whileTap={reduced ? { opacity: 0.7 } : { scale: 0.95 }}
            transition={spring.snappy}
          >
            {active && (
              <motion.span
                layoutId={id}
                className="absolute inset-0 -z-10 rounded-[0.625rem] bg-surface shadow-[var(--shadow-key)] ring-1 ring-hairline-strong"
                transition={spring.move}
              />
            )}
            {period}
          </motion.button>
        );
      })}
    </div>
  );
}
