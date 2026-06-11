import { Button } from "./Button";
import { ModalShell } from "./ModalShell";

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
    <ModalShell
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="md"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? "Please wait..." : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="text-sm text-slate-600">
        This action affects your FleetWise session or fleet data immediately.
      </div>
    </ModalShell>
  );
}
