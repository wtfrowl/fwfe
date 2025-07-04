import type { AlertType } from "../types/vehicle"
import { AiOutlineExclamationCircle, AiOutlineCheckCircle, AiOutlineCloseCircle } from "react-icons/ai"

interface AlertBadgeProps {
  type: AlertType
}

export function AlertBadge({ type }: AlertBadgeProps) {
  const getAlertConfig = (type: AlertType) => {
    switch (type) {
      case "Attention":
        return {
          icon: AiOutlineExclamationCircle,
          className: "text-orange-600",
        }
      case "All Good":
        return {
          icon: AiOutlineCheckCircle,
          className: "text-green-600",
        }
      case "Critical":
        return {
          icon: AiOutlineCloseCircle,
          className: "text-red-600",
        }
    }
  }

  const config = getAlertConfig(type)
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-1.5 ${config.className}`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm font-medium">{type}</span>
    </div>
  )
}

