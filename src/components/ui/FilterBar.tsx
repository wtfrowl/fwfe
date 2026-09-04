import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * Controls sit next to what they affect — proximity is what tells the user
 * this bar filters the table below it, without a label saying so.
 */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-card border border-hairline bg-canvas-sunken/70 p-3.5",
        "md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}
