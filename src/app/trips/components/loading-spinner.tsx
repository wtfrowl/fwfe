import { motion } from "motion/react";

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-4">
      <motion.span
        className="h-7 w-7 rounded-full border-[3px] border-ink/10 border-t-accent"
        animate={{ rotate: 360 }}
        transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
