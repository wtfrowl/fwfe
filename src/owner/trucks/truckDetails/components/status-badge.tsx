interface StatusBadgeProps {
  status: "Stopped" | "Moving" | "Completed" | "Running"
  duration?: string
}

export function StatusBadge({ status, duration }: StatusBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case "Stopped":
        return "bg-orange-100 text-orange-600"
      case "Moving":
      case "Running":
        return "bg-green-100 text-green-600"
      case "Completed":
        return "bg-blue-100 text-blue-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
      {status} {duration && `since ${duration}`}
    </div>
  )
}

