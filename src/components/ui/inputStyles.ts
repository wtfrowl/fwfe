import { cn } from "../../utils/cn";

/**
 * The shared shape for text inputs, selects and textareas.
 *
 * Lives in its own module rather than beside `FormField`: a file that exports
 * both a component and a constant opts out of React Fast Refresh, so every
 * edit to the form field would full-reload the page instead of hot-swapping.
 */
export const inputClasses = cn(
  "h-11 w-full rounded-control border border-hairline bg-surface px-3.5 text-sm text-ink",
  "outline-none transition-colors duration-150 placeholder:text-ink-quaternary",
  "hover:border-hairline-strong focus:border-accent focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:bg-canvas-sunken disabled:text-ink-tertiary"
);

/** Compact variant for inline edits inside detail rows. */
export const inputClassesCompact = cn(
  "h-9 w-full rounded-chip border border-hairline bg-surface px-2.5 text-sm text-ink",
  "outline-none transition-colors duration-150 placeholder:text-ink-quaternary",
  "hover:border-hairline-strong focus:border-accent",
  "disabled:cursor-not-allowed disabled:bg-canvas-sunken disabled:text-ink-tertiary"
);
