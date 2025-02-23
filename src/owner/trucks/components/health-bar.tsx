interface HealthBarProps {
    value: number
  }
  
  export function HealthBar({ value }: HealthBarProps) {
    const getColorClass = (value: number) => {
      if (value >= 70) return "bg-green-500"
      if (value >= 40) return "bg-orange-500"
      return "bg-red-500"
    }
  
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 w-8">{value}%</span>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${getColorClass(value)}`} style={{ width: `${value}%` }} />
        </div>
      </div>
    )
  }
  
  