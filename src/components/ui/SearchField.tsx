import { InputHTMLAttributes } from "react";
import { FaSearch } from "react-icons/fa";
import { cn } from "../../utils/cn";

export function SearchField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <FaSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-200/60"
        {...props}
      />
    </div>
  );
}
