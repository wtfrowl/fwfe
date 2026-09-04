import { forwardRef, type ButtonHTMLAttributes } from "react";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../motion/springs";
import { cn } from "../../utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
}

/* `secondary` and `ghost` are the two that can land on glass, so they carry
   their own opaque-ish backing rather than trusting whatever is behind them —
   a light translucent control on a light translucent bar is the one material
   combination that always fails to read. */
const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-ink text-white hover:bg-ink/90 shadow-[var(--shadow-hairline)]",
  secondary:
    "bg-white/80 text-ink ring-1 ring-inset ring-hairline hover:bg-white hover:ring-hairline-strong",
  ghost: "bg-transparent text-ink-secondary hover:bg-ink/6 hover:text-ink",
  danger: "bg-critical text-white hover:bg-critical/90 shadow-[var(--shadow-hairline)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      type = "button",
      children,
      ...props
    },
    ref
  ) => {
    const reduced = useReducedMotion();
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        /* Feedback fires on pointer-down. Waiting for the click event to
           acknowledge a press is the single cheapest way to make an
           interface feel dead. */
        whileTap={isDisabled ? undefined : reduced ? { opacity: 0.7 } : { scale: 0.97 }}
        transition={spring.snappy}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 rounded-control font-semibold",
          "transition-colors duration-150 ease-[var(--ease-out-quart)]",
          "disabled:cursor-not-allowed disabled:opacity-55",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? <Spinner /> : null}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = "Button";

/* Rotation is the one thing here that legitimately loops. It is driven by a
   linear tween, not a spring — a spinner that eases is a spinner that looks
   like it is struggling. */
function Spinner() {
  return (
    <motion.span
      className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current/30 border-t-current"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.7, ease: "linear", repeat: Infinity }}
      aria-hidden
    />
  );
}
