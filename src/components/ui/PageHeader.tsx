import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * Page identity. Not a card — the previous version boxed the title in a
 * bordered panel, which gave the page's name the same visual weight as the
 * data below it. A heading earns hierarchy from type, not from a container.
 */
export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-start md:justify-between",
        className
      )}
    >
      <div className="space-y-1">
        {/* Tracking tightens as size grows; the base layer handles h1. */}
        <h1 className="text-2xl font-semibold text-ink md:text-[1.75rem]">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-ink-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5">{actions}</div> : null}
    </div>
  );
}
