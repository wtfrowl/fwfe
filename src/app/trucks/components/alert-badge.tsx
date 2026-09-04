import type { AlertType } from "../types/vehicle";
import { AiOutlineExclamationCircle, AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai";
import { StatusBadge } from "../../../components/ui/StatusBadge";

interface AlertBadgeProps {
  type: AlertType;
}

/* Status colours are reserved and always ship with an icon and a label —
   never colour alone. */
const config = {
  Attention: { icon: AiOutlineExclamationCircle, tone: "warning" },
  "All Good": { icon: AiOutlineCheckCircle, tone: "success" },
  Critical: { icon: AiOutlineCloseCircle, tone: "danger" },
} as const;

export function AlertBadge({ type }: AlertBadgeProps) {
  /* The old switch had no default branch, so an unexpected alert string from
     the API crashed the row on `config.icon`. */
  const entry = config[type] ?? { icon: AiOutlineExclamationCircle, tone: "neutral" as const };
  const Icon = entry.icon;

  return (
    <StatusBadge tone={entry.tone}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {type || "Unknown"}
    </StatusBadge>
  );
}
