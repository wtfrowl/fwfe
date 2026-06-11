import { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/90 px-5 py-5 shadow-sm md:flex-row md:items-start md:justify-between md:px-6",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}
