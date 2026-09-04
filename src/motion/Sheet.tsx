import { useEffect, useRef, type ReactNode } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "motion/react";
import { spring, ease, shouldCommit } from "./springs";
import { cn } from "../utils/cn";

/**
 * A modal surface that behaves like a real one.
 *
 * The three things this gets right that a plain conditional render cannot:
 *
 * 1. INTERRUPTIBILITY. Springs animate from the presentation (live) value, so
 *    a user who grabs a sheet mid-dismiss drags it back from exactly where it
 *    is on screen. No jump, no waiting for the close to finish first.
 *
 * 2. VELOCITY. Release velocity decides commit-vs-return, not just position.
 *    A hard flick from 20% down closes; a slow drag to 45% returns.
 *
 * 3. SYMMETRY. It leaves along the path it arrived by — up from the bottom on
 *    touch, out to the bottom on dismiss. In-from-here / out-to-there is the
 *    single most disorienting thing a dialog can do.
 *
 * On pointers (desktop) it is a centred dialog scaling from 96%; on touch it
 * is a bottom sheet you can throw away. Same component, because the semantics
 * are identical and only the physical metaphor changes.
 */

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
  /** Destructive or otherwise uninterruptible? Then no drag-to-dismiss. */
  dismissible?: boolean;
}

const sizeClasses = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "lg",
  dismissible = true,
}: SheetProps) {
  const reduced = useReducedMotion();
  const y = useMotionValue(0);
  const panelRef = useRef<HTMLDivElement>(null);

  /* The scrim tracks the drag 1:1. Content and touch move together — as the
     sheet falls away the room behind it comes back, continuously, rather than
     the dimming waiting for the gesture to finish. */
  const scrimOpacity = useTransform(y, [0, 400], [1, 0], { clamp: true });

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    /* Lock the page behind the sheet, but compensate for the scrollbar's
       width so the layout underneath does not jolt sideways on open. */
    const gap = window.innerWidth - document.documentElement.clientWidth;
    const { overflow, paddingRight } = document.body.style;
    document.body.style.overflow = "hidden";
    if (gap > 0) document.body.style.paddingRight = `${gap}px`;

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      y.set(0);
      panelRef.current?.focus();
    }
  }, [open, y]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const height = panelRef.current?.offsetHeight ?? 400;
    if (shouldCommit(info.offset.y, info.velocity.y, height)) {
      onClose();
    } else {
      /* Not committed: spring home carrying the release velocity, so there is
         no seam between the finger letting go and the sheet returning. */
      y.set(info.offset.y);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <motion.div
            className="material-scrim absolute inset-0"
            style={{ opacity: reduced ? undefined : scrimOpacity }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={ease.exit}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            data-motion="transform"
            className={cn(
              "material-thick relative flex max-h-[92vh] w-full flex-col overflow-hidden outline-none",
              "rounded-t-[1.75rem] sm:rounded-[1.75rem]",
              "shadow-[var(--shadow-sheet)]",
              "ring-1 ring-white/50",
              sizeClasses[size]
            )}
            style={{ y }}
            /* A glass surface should materialise, not just fade: scale and
               blur arrive together so it reads as a pane of real material. */
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: "100%", scale: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: "100%" }}
            transition={spring.sheet}
            drag={dismissible && !reduced ? "y" : false}
            /* Downward only. Dragging up must resist, not stretch the sheet
               off its anchor — hence 0 elasticity at the top bound. */
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            dragMomentum={false}
            onDragEnd={handleDragEnd}
          >
            {dismissible && (
              <div className="flex shrink-0 justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1.5 w-9 rounded-full bg-ink-quaternary/60" />
              </div>
            )}

            <div className="flex shrink-0 items-start justify-between gap-4 px-6 pt-5 pb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-ink-vibrant">{title}</h2>
                {description ? (
                  <p className="text-sm text-ink-vibrant-secondary">{description}</p>
                ) : null}
              </div>
              <SheetCloseButton onClose={onClose} />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">{children}</div>

            {footer ? (
              <div className="material-edge shrink-0 bg-white/40 px-6 py-4">{footer}</div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SheetCloseButton({ onClose }: { onClose: () => void }) {
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={onClose}
      aria-label="Close dialog"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink-secondary hover:bg-ink/10 hover:text-ink"
      whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
      transition={spring.snappy}
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
        <path
          d="M3 3l10 10M13 3L3 13"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </motion.button>
  );
}
