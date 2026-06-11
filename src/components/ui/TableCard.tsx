import { ReactNode } from "react";
import { cn } from "../../utils/cn";

export function TableCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}
