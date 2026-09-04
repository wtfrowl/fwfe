import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * The standard content container. Opaque on purpose: this is the layer
 * chrome floats *over*, so it must stay solid. Glass on glass destroys
 * legibility, and a table is the last place to spend readability on effect.
 */
export function TableCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-card border border-hairline bg-surface shadow-[var(--shadow-raised)]",
        className
      )}
    >
      {children}
    </div>
  );
}
