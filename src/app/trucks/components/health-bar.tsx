import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../../motion/springs";
import { cn } from "../../../utils/cn";

interface HealthBarProps {
  value: number;
}

/**
 * Health as a bar plus a number. The number is not decoration: at a glance
 * two bars at 71% and 78% look identical, and colour alone puts the whole
 * signal out of reach of a colourblind reader.
 *
 * The fill springs to its value on mount so a row that updates reads as the
 * same bar moving rather than a new bar appearing.
 */
export function HealthBar({ value }: HealthBarProps) {
  const reduced = useReducedMotion();
  const safe = Math.max(0, Math.min(100, Number(value) || 0));

  const tone =
    safe >= 70 ? "bg-positive" : safe >= 40 ? "bg-caution" : "bg-critical";

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 shrink-0 text-sm tabular-nums text-ink-secondary">{safe}%</span>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10"
        role="meter"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Vehicle health"
      >
        <motion.div
          className={cn("h-full rounded-full", tone)}
          initial={reduced ? false : { width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={spring.move}
        />
      </div>
    </div>
  );
}
