import { Button } from "./Button";
import { Sheet } from "../../motion/Sheet";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation is for genuinely destructive, irreversible actions only.
 * Overusing it trains people to click through, which costs you the one moment
 * you actually needed their attention.
 *
 * Not dismissible by drag: a sheet you can throw away is the wrong affordance
 * for a decision, and a destructive prompt dismissed by accident is exactly
 * the slip the prompt exists to prevent.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      title={title}
      size="md"
      dismissible={false}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {/* The caller's description is the whole point of the dialog. The
          previous version passed it to the header and then rendered a generic
          sentence in the body, so every confirmation read identically no
          matter what was about to happen. */}
      <p className="text-sm leading-relaxed text-ink-vibrant-secondary">{description}</p>
    </Sheet>
  );
}
