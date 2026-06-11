import { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function FilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      {children}
    </div>
  );
}
