import { useId, useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../../motion/springs";
import { cn } from "../../../utils/cn";
import type { ITyre } from "../../../types/tyre";
import {
  type AxleLayout,
  type WheelPosition,
  positionsForAxle,
  SPARE_POSITIONS,
  positionCode,
  treadHealth,
} from "../lib/tyre-standards";

/**
 * The truck, from above.
 *
 * Fitting a tyre used to mean choosing "Rear left outer" from a dropdown that
 * offered seven options for every vehicle in the fleet, whether it had four
 * wheels or twenty-two. Nothing on screen told you which hubs were already
 * taken, so the only way to find out was to try.
 *
 * A diagram answers all of that at a glance: which positions exist on this
 * vehicle, which are filled, what is on them, and how worn it is. Picking a
 * spot is then one tap on the spot itself — the interface a fitter walking
 * round the truck already has in their head.
 */

export interface AxleDiagramProps {
  layout: AxleLayout;
  /** Everything currently fitted to this truck. */
  tyres: ITyre[];
  /** Position code, if a slot is chosen. */
  selected?: string | null;
  onSelect?: (position: WheelPosition, tyre: ITyre | null) => void;
  /** Codes that cannot be chosen right now — e.g. the tyre's own position. */
  disabled?: string[];
  /** The tyre being moved, drawn as lifted off its hub. */
  movingTyreId?: string | null;
  includeSpares?: boolean;
  /** Read-only display — no press feedback, no focus ring, no cursor. */
  interactive?: boolean;
  className?: string;
}

export function AxleDiagram({
  layout,
  tyres,
  selected,
  onSelect,
  disabled = [],
  movingTyreId,
  includeSpares = true,
  interactive = true,
  className,
}: AxleDiagramProps) {
  const ringId = `axle-pick-${useId()}`;

  const byPosition = useMemo(() => {
    const map = new Map<string, ITyre>();
    for (const tyre of tyres) {
      const code = positionCode(tyre.position);
      if (code) map.set(code, tyre);
    }
    return map;
  }, [tyres]);

  const disabledSet = useMemo(() => new Set(disabled), [disabled]);

  const slotProps = (position: WheelPosition) => ({
    key: position.code,
    position,
    tyre: byPosition.get(position.code) ?? null,
    selected: selected === position.code,
    disabled: disabledSet.has(position.code),
    lifted: Boolean(movingTyreId) && byPosition.get(position.code)?._id === movingTyreId,
    interactive,
    ringId,
    onSelect,
  });

  return (
    <div className={cn("mx-auto w-fit max-w-full", className)}>
      {/* Which end is the front. Without it, a symmetrical diagram is a
          coin-flip and half the fleet gets logged back to front. */}
      <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold tracking-wide text-ink-quaternary uppercase">
        <span className="h-px w-8 bg-hairline" aria-hidden />
        Front
        <span className="h-px w-8 bg-hairline" aria-hidden />
      </div>

      <div className="relative space-y-3">
        {/* The chassis rail, drawn behind the axles so the wheels sit on it. */}
        <span
          className="pointer-events-none absolute inset-y-4 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-ink/8"
          aria-hidden
        />

        {layout.axles.map((axle) => {
          const positions = positionsForAxle(axle);
          const left = positions.filter((p) => p.side === "L");
          const right = positions.filter((p) => p.side === "R");

          return (
            <div key={axle.index} className="relative flex items-center justify-center gap-2">
              <div className="flex items-center justify-end gap-2">
                {left.map((p) => (
                  <WheelSlot {...slotProps(p)} />
                ))}
              </div>

              {/* The axle beam. Its width is the visual difference between a
                  steer axle and a dual, so it is not decoration. */}
              <div className="flex w-12 shrink-0 flex-col items-center justify-center gap-1">
                <span className="h-1.5 w-full rounded-full bg-ink/12" aria-hidden />
                <span className="text-[0.625rem] font-semibold text-ink-quaternary tabular-nums">
                  {axle.index}
                </span>
              </div>

              <div className="flex items-center justify-start gap-2">
                {right.map((p) => (
                  <WheelSlot {...slotProps(p)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {includeSpares && (
        <div className="mt-4 border-t border-hairline pt-4">
          <p className="mb-2 text-center text-xs font-semibold tracking-wide text-ink-quaternary uppercase">
            Stepney
          </p>
          <div className="flex justify-center gap-2">
            {SPARE_POSITIONS.map((p) => (
              <WheelSlot {...slotProps(p)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface WheelSlotProps {
  position: WheelPosition;
  tyre: ITyre | null;
  selected: boolean;
  disabled: boolean;
  lifted: boolean;
  interactive: boolean;
  ringId: string;
  onSelect?: (position: WheelPosition, tyre: ITyre | null) => void;
}

function WheelSlot({
  position,
  tyre,
  selected,
  disabled,
  lifted,
  interactive,
  ringId,
  onSelect,
}: WheelSlotProps) {
  const reduced = useReducedMotion();
  const health = tyre ? treadHealth(tyre.currentTreadDepth, tyre.initialTreadDepth) : null;

  const label = tyre
    ? `${position.label}: ${tyre.tyreNumber}, ${tyre.currentTreadDepth} millimetres, ${health?.label}`
    : `${position.label}: empty`;

  const className = cn(
    "relative flex h-16 w-12 shrink-0 flex-col items-center justify-center gap-1 rounded-chip px-1",
    "transition-colors duration-150 ease-[var(--ease-out-quart)]",
    tyre
      ? "bg-surface ring-1 ring-inset ring-hairline-strong shadow-[var(--shadow-hairline)]"
      : "border border-dashed border-hairline-strong bg-canvas-sunken/60 text-ink-quaternary",
    interactive && !disabled && "cursor-pointer hover:ring-accent/40",
    interactive && !disabled && !tyre && "hover:border-accent/50 hover:text-accent",
    disabled && "cursor-not-allowed opacity-40",
    /* The tyre being moved reads as off the vehicle already, so the diagram
       shows the state you are about to leave, not the one you are in. */
    lifted && "opacity-45"
  );

  const body = (
    <>
      {selected && (
        <motion.span
          layoutId={ringId}
          className="pointer-events-none absolute -inset-0.5 rounded-[0.625rem] ring-2 ring-accent"
          transition={spring.move}
          aria-hidden
        />
      )}

      <span
        className={cn(
          "text-[0.625rem] leading-none font-bold tracking-tight tabular-nums",
          tyre ? "text-ink-secondary" : "text-current"
        )}
      >
        {position.code}
      </span>

      {tyre ? (
        <>
          <span className="w-full truncate text-center text-[0.625rem] leading-none font-medium text-ink">
            {tyre.tyreNumber.slice(-5)}
          </span>
          <span
            className={cn("text-[0.625rem] leading-none font-semibold tabular-nums", health?.textClass)}
          >
            {tyre.currentTreadDepth}
          </span>
          <span className="mt-0.5 h-1 w-7 overflow-hidden rounded-full bg-ink/10" aria-hidden>
            <span
              className={cn("block h-full rounded-full", health?.barClass)}
              style={{ width: `${Math.max((health?.remaining ?? 0) * 100, 4)}%` }}
            />
          </span>
        </>
      ) : (
        <span className="text-base leading-none font-light" aria-hidden>
          +
        </span>
      )}
    </>
  );

  if (!interactive) {
    return (
      <div className={className} aria-label={label} title={label}>
        {body}
      </div>
    );
  }

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={() => onSelect?.(position, tyre)}
      whileTap={disabled ? undefined : reduced ? { opacity: 0.7 } : { scale: 0.94 }}
      transition={spring.snappy}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={className}
    >
      {body}
    </motion.button>
  );
}
