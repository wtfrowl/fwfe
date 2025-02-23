interface MetricCardProps {
    label: string
    value: string | number
    valueColor?: string
  }
  
  export function MetricCard({ label, value, valueColor = "text-gray-900" }: MetricCardProps) {
    return (
      <div className="flex flex-col">
        <span className="text-sm text-gray-500">{label}</span>
        <span className={`text-lg font-medium ${valueColor}`}>{value}</span>
      </div>
    )
  }
  
  