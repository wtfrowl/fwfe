import { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      {icon ? <div className="rounded-2xl bg-slate-100 p-4 text-slate-500">{icon}</div> : null}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="max-w-md text-sm text-slate-600">{description}</p>
      </div>
      {action}
    </div>
  );
}
