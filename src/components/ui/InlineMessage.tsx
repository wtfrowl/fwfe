import { ReactNode } from "react";
import { cn } from "../../utils/cn";

const toneClasses = {
  error: "border-rose-200 bg-rose-50 text-rose-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

export function InlineMessage({
  children,
  tone = "info",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof toneClasses;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border px-4 py-3 text-sm", toneClasses[tone], className)}>
      {children}
    </div>
  );
}
