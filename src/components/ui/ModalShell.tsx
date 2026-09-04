import type { ReactNode } from "react";
import { Sheet } from "../../motion/Sheet";

interface ModalShellProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
}

/**
 * Kept as a thin alias over `Sheet` so existing callers keep their API while
 * gaining interruptible motion, drag-to-dismiss and the glass material.
 *
 * The old implementation returned `null` when closed, which is why modals in
 * this app appeared and vanished on a hard cut: there was nothing mounted for
 * an exit transition to animate. `Sheet` owns its own presence.
 */
export function ModalShell({
  open,
  title,
  description,
  onClose,
  footer,
  children,
  size = "lg",
}: ModalShellProps) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
      size={size}
    >
      {children}
    </Sheet>
  );
}
