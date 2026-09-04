import { StatusBadge as Badge } from "../../../../components/ui/StatusBadge";

interface StatusBadgeProps {
  status: "Stopped" | "Moving" | "Completed" | "Running";
  duration?: string;
}

const toneFor = (status: StatusBadgeProps["status"]) => {
  switch (status) {
    case "Stopped":
      return "warning" as const;
    case "Moving":
    case "Running":
      return "success" as const;
    case "Completed":
      return "info" as const;
    default:
      return "neutral" as const;
  }
};

export function StatusBadge({ status, duration }: StatusBadgeProps) {
  return (
    <Badge tone={toneFor(status)}>
      {status}
      {duration ? ` since ${duration}` : ""}
    </Badge>
  );
}
