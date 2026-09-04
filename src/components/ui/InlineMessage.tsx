import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ease } from "../../motion/springs";
import { cn } from "../../utils/cn";

const toneClasses = {
  error: "border-critical/25 bg-critical-soft text-critical-ink",
  info: "border-accent/20 bg-accent-soft text-accent-ink",
  success: "border-positive/25 bg-positive-soft text-positive-ink",
};

/**
 * Validation and status feedback, animated on presence.
 *
 * The height animation matters more than the fade: an error that pops into
 * existence shoves the form down under the user's cursor mid-interaction.
 * Growing into place keeps the layout predictable.
 *
 * Errors announce themselves assertively; info and success do not interrupt.
 */
export function InlineMessage({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence initial={false}>
      {children ? (
        <motion.div
          role={tone === "error" ? "alert" : "status"}
          initial={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
          transition={ease.enter}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "rounded-control border px-4 py-3 text-sm leading-relaxed",
              toneClasses[tone],
              className
            )}
          >
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
