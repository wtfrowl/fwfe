import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ease } from "../../motion/springs";

/**
 * Empty is a state, not an error. It gets the same solid surface as a full
 * table so the page does not appear to have lost a section — a dashed outline
 * reads as "something is missing here", which is the wrong message when the
 * honest answer is "you have not added one yet".
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      data-motion="transform"
      className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-card border border-hairline bg-surface px-6 py-14 text-center"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={ease.enter}
    >
      {icon ? (
        <div className="grid h-14 w-14 place-items-center rounded-chip bg-ink/5 text-xl text-ink-tertiary">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-secondary">{description}</p>
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </motion.div>
  );
}
