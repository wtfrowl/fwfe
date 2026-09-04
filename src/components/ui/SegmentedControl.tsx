import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../motion/springs";
import { cn } from "../../utils/cn";

export interface Segment<T extends string> {
  label: string;
  value: T;
  count?: number;
}

/**
 * The status filter shared by Trucks, Trips, Tyres and Drivers.
 *
 * Each page previously rolled its own tab strip — two copies of a `StatusTab`
 * component plus a separate mobile dropdown per page — which is why the
 * filters looked slightly different on every screen.
 *
 * The selection indicator is a shared element travelling between segments, so
 * changing filter reads as one control moving. Because `layoutId` animates
 * from the live position, clicking a third segment mid-flight re-targets from
 * wherever the indicator actually is instead of jumping.
 *
 * Horizontally scrollable on small screens rather than collapsing into a
 * dropdown: the counts are the point, and a dropdown hides them behind a tap.
 */
export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const layoutId = `segmented-${useId()}`;

  return (
    <div
      role="tablist"
      className={cn("scrollbar-hide flex gap-1 overflow-x-auto rounded-control bg-ink/10 p-1", className)}
    >
      {segments.map((segment) => {
        const active = segment.value === value;

        return (
          <motion.button
            key={segment.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(segment.value)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-[0.625rem] px-3 py-1.5",
              "text-sm font-semibold whitespace-nowrap transition-colors duration-150",
              active ? "text-ink" : "text-ink-tertiary hover:text-ink-secondary"
            )}
            whileTap={reduced ? { opacity: 0.7 } : { scale: 0.97 }}
            transition={spring.snappy}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-[0.625rem] bg-surface shadow-[var(--shadow-key)] ring-1 ring-hairline-strong"
                transition={spring.move}
              />
            )}
            {segment.label}
            {segment.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.6875rem] tabular-nums transition-colors duration-150",
                  active ? "bg-ink/12 text-ink" : "bg-ink/6 text-ink-tertiary"
                )}
              >
                {segment.count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
