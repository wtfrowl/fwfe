import type { ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ease } from "../../motion/springs";
import { cn } from "../../utils/cn";

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className,
}: FormFieldProps) {
  const reduced = useReducedMotion();

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
        {label}
        {required ? (
          <span className="ml-1 text-critical" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {children}

      {/* Hint and error occupy the same slot, so swapping between them does
          not change the field's height and nudge the rest of the form. */}
      <AnimatePresence mode="wait" initial={false}>
        {error ? (
          <motion.p
            key="error"
            role="alert"
            className="text-xs font-medium text-critical-ink"
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={ease.enter}
          >
            {error}
          </motion.p>
        ) : hint ? (
          <motion.p
            key="hint"
            className="text-xs text-ink-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={ease.tint}
          >
            {hint}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
