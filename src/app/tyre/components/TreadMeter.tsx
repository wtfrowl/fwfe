import { motion, useReducedMotion } from "motion/react";
import { ease } from "../../../motion/springs";
import { cn } from "../../../utils/cn";
import { TREAD, treadHealth } from "../lib/tyre-standards";

/**
 * How much tyre is left.
 *
 * A bare "4 mm" means nothing without knowing what it started at and where the
 * line is. This shows the depth, the share of usable tread remaining, and —
 * the part that was missing everywhere — a fixed marker at the 3 mm pull
 * point, so a tyre approaching the end reads as approaching the end rather
 * than merely being a smaller number than last week.
 */
export function TreadMeter({
  current,
  initial,
  size = "md",
  showLabel = true,
  className,
}: {
  current: number;
  initial: number;
  size?: "sm" | "md";
  showLabel?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const health = treadHealth(current, initial);

  /* The pull point expressed on the same 0–1 usable-tread scale as the bar,
     so the marker lands where the bar will actually be when the tyre gets
     there. */
  const usable = Math.max(initial - TREAD.legalMin, 0.1);
  const pullMark = Math.min(Math.max((TREAD.pullPoint - TREAD.legalMin) / usable, 0), 1);

  return (
    <div className={cn("min-w-0", className)}>
      {showLabel && (
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className={cn("text-sm font-semibold tabular-nums", health.textClass)}>
            {current} mm
          </span>
          <span className="text-xs text-ink-tertiary tabular-nums">
            {Math.round(health.remaining * 100)}% left
          </span>
        </div>
      )}

      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-ink/10",
          size === "sm" ? "h-1.5" : "h-2"
        )}
        role="meter"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={initial}
        aria-label={`Tread depth ${current} of ${initial} millimetres — ${health.label}`}
      >
        <motion.div
          className={cn("h-full rounded-full", health.barClass)}
          data-motion="transform"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: health.remaining }}
          style={{ originX: 0, width: "100%" }}
          transition={ease.enter}
        />

        {/* The line the tyre comes off at. Drawn over the fill so it stays
            visible whichever side of it the tyre is on. */}
        <span
          className="absolute inset-y-0 w-px bg-ink/35"
          style={{ left: `${pullMark * 100}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
