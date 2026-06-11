import { ReactNode } from "react";
import { FaTimes } from "react-icons/fa";
import { cn } from "../../utils/cn";

interface ModalShellProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}

const sizeClasses = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function ModalShell({
  open,
  title,
  description,
  onClose,
  footer,
  children,
  size = "lg",
}: ModalShellProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className={cn("flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl", sizeClasses[size])}>
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            {description ? <p className="text-sm text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close dialog"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}
