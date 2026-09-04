import { motion, useReducedMotion } from "motion/react";

/**
 * A loading state's job is to say "this is coming", not to entertain.
 *
 * It fades in after a beat: a fetch that resolves in 80ms should never flash a
 * spinner, because a spinner that appears and vanishes reads as a glitch and
 * makes fast software feel broken.
 */
export function LoadingState({ label = "Loading..." }: { label?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-card border border-hairline bg-surface px-6 py-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, delay: reduced ? 0 : 0.25 }}
    >
      <motion.span
        className="h-8 w-8 rounded-full border-[3px] border-ink/10 border-t-ink"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
        aria-hidden
      />
      <p className="text-sm font-medium text-ink-secondary" role="status">
        {label}
      </p>
    </motion.div>
  );
}
