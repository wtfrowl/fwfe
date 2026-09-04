import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { motion, useReducedMotion } from "motion/react";
import { spring } from "../../motion/springs";
import { cn } from "../../utils/cn";

/**
 * The shared shell for every detail page — truck, trip, tyre, driver.
 *
 * Before this, each of the four invented its own header: the truck had a
 * right-aligned secondary "Back" button, the trip a right-aligned *primary
 * blue* "Go Back" (styling a retreat as the page's main action), the tyre an
 * icon-only button wedged between Edit and Save, and the driver an icon
 * button to the left of the title. Two called `window.history.back()`, two
 * called `navigate(-1)`.
 *
 * Consistency is what lets someone stop looking for the back button: things
 * that behave the same should look the same and live in the same place.
 * Back is always the same control, always top-left, always before the title.
 */

export function DetailPage({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-7xl space-y-5">{children}</div>;
}

export function BackButton({ label = "Go back" }: { label?: string }) {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  return (
    <motion.button
      type="button"
      onClick={() => navigate(-1)}
      aria-label={label}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-ink/6 hover:text-ink"
      whileTap={reduced ? { opacity: 0.6 } : { scale: 0.9 }}
      transition={spring.snappy}
    >
      <FaArrowLeft className="h-3.5 w-3.5" />
    </motion.button>
  );
}

interface DetailHeaderProps {
  /** The thing's own name — a registration number, a tyre number, a person. */
  title: ReactNode;
  /** What it is, or a short descriptor. Never a duplicate of the title. */
  subtitle?: ReactNode;
  /** Status pill, shown beside the title where the eye already is. */
  badge?: ReactNode;
  /** Page-level actions (Edit, Save…). Never the back button. */
  actions?: ReactNode;
}

export function DetailHeader({ title, subtitle, badge, actions }: DetailHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5">
          <BackButton />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {typeof title === "string" ? (
              <h1 className="text-2xl font-semibold break-all text-ink">{title}</h1>
            ) : (
              title
            )}
            {badge}
          </div>
          {subtitle ? (
            <div className="mt-0.5 text-sm text-ink-secondary">{subtitle}</div>
          ) : null}
        </div>
      </div>

      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2.5">{actions}</div> : null}
    </header>
  );
}

/**
 * A titled block of content. Every detail page is a stack of these, so the
 * pages read as variations of one layout rather than four separate designs.
 */
export function DetailSection({
  title,
  icon,
  action,
  children,
  padded = true,
  className,
}: {
  title?: string;
  icon?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  /** Turn off for tables and maps that manage their own edges. */
  padded?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)]",
        className
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
            {icon ? <span className="text-ink-tertiary">{icon}</span> : null}
            {title}
          </h2>
          {action}
        </div>
      ) : null}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}

/** A label/value pair. The unit of content on every detail page. */
export function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-caption text-sm text-ink-secondary">{label}</dt>
      <dd className="mt-0.5 font-medium break-words text-ink">{value ?? "—"}</dd>
    </div>
  );
}

/** The standard grid detail fields sit in. */
export function DetailGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3", className)}>{children}</dl>
  );
}
