import type { InputHTMLAttributes } from "react";
import { FaSearch } from "react-icons/fa";
import { inputClasses } from "./inputStyles";
import { cn } from "../../utils/cn";

export function SearchField({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <FaSearch
        className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-quaternary"
        aria-hidden
      />
      {/* Shares the one input style rather than restating it, so a change to
          the field's border or focus behaviour lands here too. */}
      <input type="search" className={cn(inputClasses, "pl-10")} {...props} />
    </div>
  );
}
