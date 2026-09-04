import { cn } from "../../../../utils/cn";

interface MetricCardProps {
  label: string;
  value: string | number;
  valueColor?: string;
}

export function MetricCard({ label, value, valueColor = "text-ink" }: MetricCardProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-caption text-sm text-ink-secondary">{label}</span>
      <span className={cn("text-lg font-semibold tabular-nums", valueColor)}>{value}</span>
    </div>
  );
}
