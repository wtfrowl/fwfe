import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "./springs";

/**
 * Press feedback that fires on pointer-DOWN, not on click.
 *
 * The moment lag appears, the feeling of directness falls off a cliff. A
 * button that only reacts on `click` has already made the user wait for
 * touch-up, and it reads as dead. `whileTap` in Motion is pointer-down driven,
 * and the spring means an interrupted press settles from wherever it actually
 * is rather than snapping.
 *
 * Under reduced motion the scale is dropped but the press is NOT silent —
 * opacity still confirms the touch. Reduced motion means a gentler
 * equivalent, not an absence of feedback.
 */

type PressableProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  /** How far it gives under the finger. Large surfaces need less. */
  scale?: number;
};

export const Pressable = forwardRef<HTMLButtonElement, PressableProps>(
  ({ children, scale = 0.97, type = "button", ...props }, ref) => {
    const reduced = useReducedMotion();

    return (
      <motion.button
        ref={ref}
        type={type}
        whileTap={reduced ? { opacity: 0.7 } : { scale }}
        transition={spring.snappy}
        {...(props as object)}
      >
        {children}
      </motion.button>
    );
  }
);

Pressable.displayName = "Pressable";

/** The same feedback for things that are not buttons — rows, cards, tiles. */
export function PressableBox({
  children,
  className,
  onClick,
  scale = 0.99,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  scale?: number;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.div
      className={className}
      onClick={onClick}
      whileTap={reduced ? { opacity: 0.8 } : { scale }}
      transition={spring.snappy}
    >
      {children}
    </motion.div>
  );
}
