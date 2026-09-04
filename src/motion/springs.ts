/**
 * FleetWise motion vocabulary.
 *
 * Apple deliberately replaced the physics triplet (mass/stiffness/damping)
 * with two designer-facing parameters, and Motion exposes the same pair:
 *
 *   damping ratio -> `bounce`          (1.0 damped = 0 bounce; 0.8 = 0.2 bounce)
 *   response      -> `visualDuration`  (seconds to visually reach target)
 *
 * `visualDuration` is NOT a duration in the CSS sense. A spring has no fixed
 * end; settle time emerges from the parameters. That is the whole point —
 * these are interruptible, so new input just re-targets and motion stays
 * continuous.
 *
 * Rule of thumb: critically damped (bounce 0) everywhere by default. Reserve
 * overshoot for motion the user's own gesture put momentum into. Bounce on a
 * menu that merely faded in feels wrong; bounce on a card you flicked feels
 * right.
 */

import type { Transition } from "motion/react";

export const spring = {
  /** Default for anything the user can touch. Graceful, non-distracting. */
  default: { type: "spring", bounce: 0, visualDuration: 0.35 },

  /** Move / reposition, Apple's PiP values: damping 1.0, response 0.4. */
  move: { type: "spring", bounce: 0, visualDuration: 0.4 },

  /** Snappy — small controls, badges, inline affordances. */
  snappy: { type: "spring", bounce: 0, visualDuration: 0.22 },

  /** Drawers and sheets, Apple's values: damping 0.8, response 0.3. */
  sheet: { type: "spring", bounce: 0.2, visualDuration: 0.3 },

  /** Rotation, Apple's values: damping 0.8, response 0.4. */
  rotate: { type: "spring", bounce: 0.2, visualDuration: 0.4 },

  /** Momentum landings — only after a flick, throw or drag release. */
  momentum: { type: "spring", bounce: 0.2, visualDuration: 0.4 },
} satisfies Record<string, Transition>;

/**
 * Non-gesture transitions. Anything the user cannot grab mid-flight can use a
 * curve; anything they can must use a spring above.
 *
 * Entrances decelerate (ease-out). Exits accelerate and are faster — a leaving
 * element has nothing left to say, so it should not hold the user up.
 */
export const ease = {
  enter: { duration: 0.28, ease: [0.32, 0.72, 0, 1] },
  exit: { duration: 0.18, ease: [0.32, 0.72, 0, 1] },
  /** Colour/opacity only. Never long enough to feel like a wait. */
  tint: { duration: 0.15, ease: [0.25, 1, 0.5, 1] },
} satisfies Record<string, Transition>;

/**
 * Project where a flick is *going*, so we can snap to the target nearest the
 * projected resting point rather than the nearest one to the release point.
 * This is what makes a flick feel thrown instead of dropped.
 *
 * This is Apple's exponential-decay form from the Designing Fluid Interfaces
 * sample code — deliberately not the textbook v^2/(2a).
 *
 * @param initialVelocity px/s at release
 * @param decelerationRate 0.998 for normal scroll feel, 0.99 for snappier
 * @returns distance the gesture would still travel, in px
 */
export function project(initialVelocity: number, decelerationRate = 0.998): number {
  return ((initialVelocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. A hard stop reads as "frozen"; this
 * reads as "responsive, but there is nothing more here."
 *
 * @param overshoot how far past the bound the pointer has travelled, in px
 * @param dimension the size of the dragged surface along that axis, in px
 */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Decide commit vs. return on gesture release.
 *
 * Velocity sign beats position: a user who has dragged a sheet only 20% down
 * but flicked hard has clearly asked for it to close, and forcing them past a
 * 50% line to prove it feels like the interface is arguing with them.
 *
 * @param offset how far the surface has been dragged from rest, in px
 * @param velocity release velocity in px/s, positive in the dismiss direction
 * @param dimension the surface's size along that axis, in px
 */
export function shouldCommit(offset: number, velocity: number, dimension: number): boolean {
  const FLICK = 400; // px/s — above this, intent is unambiguous
  if (Math.abs(velocity) > FLICK) return velocity > 0;
  return offset + project(velocity) > dimension * 0.5;
}
