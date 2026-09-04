import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { FaCheck, FaExclamation, FaInfo, FaTimes } from "react-icons/fa";
import { useToastStore, type Toast, type ToastTone } from "../../store/notifications/toastStore";
import { spring, ease } from "../../motion/springs";
import { cn } from "../../utils/cn";

/**
 * Transient confirmation for things that happen while you are looking
 * elsewhere — a driver logging an expense, a trip changing status.
 *
 * A notification that only lands in a dropdown behind a bell is a
 * notification nobody sees until they go looking. A toast is the part that
 * says "this happened just now", and the bell is the part that says "here is
 * everything you missed".
 */

const toneStyles: Record<ToastTone, { ring: string; icon: string; Icon: typeof FaInfo }> = {
  info: { ring: "ring-accent/25", icon: "bg-accent-soft text-accent-ink", Icon: FaInfo },
  success: { ring: "ring-positive/25", icon: "bg-positive-soft text-positive-ink", Icon: FaCheck },
  warning: { ring: "ring-caution/30", icon: "bg-caution-soft text-caution-ink", Icon: FaExclamation },
  critical: { ring: "ring-critical/25", icon: "bg-critical-soft text-critical-ink", Icon: FaExclamation },
};

const DEFAULT_DURATION = 6000;

function ToastCard({ toast: t }: { toast: Toast }) {
  const reduced = useReducedMotion();
  const dismiss = useToastStore((s) => s.dismiss);
  const [paused, setPaused] = useState(false);
  const remaining = useRef(t.duration ?? DEFAULT_DURATION);
  const startedAt = useRef(Date.now());

  /* Pause the countdown on hover. A toast that vanishes while you are
     reading it is worse than one that never appeared. */
  useEffect(() => {
    if (paused) {
      remaining.current -= Date.now() - startedAt.current;
      return;
    }
    startedAt.current = Date.now();
    const timer = setTimeout(() => dismiss(t.id), Math.max(0, remaining.current));
    return () => clearTimeout(timer);
  }, [paused, t.id, dismiss]);

  const tone = toneStyles[t.tone];
  const Icon = tone.Icon;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    /* Velocity, not distance: a quick flick is unambiguous intent even if
       the toast has barely moved. */
    if (info.offset.x > 80 || info.velocity.x > 400) dismiss(t.id);
  };

  const interactive = Boolean(t.onClick);

  return (
    <motion.div
      layout
      data-motion="transform"
      initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: ease.exit }}
      transition={spring.sheet}
      drag={reduced ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.7 }}
      onDragEnd={handleDragEnd}
      onHoverStart={() => setPaused(true)}
      onHoverEnd={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      role="status"
      aria-live={t.tone === "critical" ? "assertive" : "polite"}
      className={cn(
        "material-thick pointer-events-auto w-full overflow-hidden rounded-card p-3.5",
        "shadow-[var(--shadow-floating)] ring-1",
        tone.ring
      )}
    >
      <div
        className={cn("flex items-start gap-3", interactive && "cursor-pointer")}
        onClick={interactive ? () => { t.onClick?.(); dismiss(t.id); } : undefined}
      >
        <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", tone.icon)}>
          <Icon className="h-3 w-3" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink-vibrant">{t.title}</p>
          {t.body ? (
            <p className="mt-0.5 text-sm leading-snug text-ink-vibrant-secondary">{t.body}</p>
          ) : null}
        </div>

        <motion.button
          type="button"
          aria-label="Dismiss"
          onClick={(e) => {
            e.stopPropagation();
            dismiss(t.id);
          }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-ink-tertiary hover:bg-ink/8 hover:text-ink"
          whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
          transition={spring.snappy}
        >
          <FaTimes className="h-2.5 w-2.5" />
        </motion.button>
      </div>
    </motion.div>
  );
}

/** Mount once, near the root. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-auto sm:w-[380px] sm:max-w-[calc(100vw-2rem)] sm:items-end"
      aria-label="Notifications"
    >
      <AnimatePresence initial={false} mode="popLayout">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
