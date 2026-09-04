import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "./springs";

/**
 * Entrance motion for content that has just arrived — a loaded page, a list
 * that finished fetching, a newly rendered card grid.
 *
 * Deliberately small. An 8px rise reads as "this settled into place"; a 40px
 * slide reads as "the interface is performing for you", and on a dashboard the
 * user visits forty times a day, performance becomes friction.
 *
 * Entrances only. There is no exit here on purpose: content leaving a
 * dashboard is usually being replaced, and animating the old data out delays
 * the new data arriving.
 */

const DISTANCE = 8;

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      data-motion="transform"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: DISTANCE }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...ease.enter, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger a set of siblings — metric tiles, table rows, card grids.
 *
 * The stagger is 40ms and capped: past roughly eight items the eye stops
 * reading it as sequence and starts reading it as lag. Anything longer and a
 * twelve-row table takes half a second to finish arriving.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.04,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="shown"
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: reduced ? 0 : stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** A child of RevealGroup. Inherits the parent's stagger timing. */
export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      data-motion="transform"
      variants={{
        hidden: reduced ? { opacity: 0 } : { opacity: 0, y: DISTANCE },
        shown: { opacity: 1, y: 0, transition: ease.enter },
      }}
    >
      {children}
    </motion.div>
  );
}
