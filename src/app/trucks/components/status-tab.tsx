  interface StatusTabProps {
    label: string
    active: boolean
    onClick: () => void
    count?: number
  }
  
  export function StatusTab({count, label, active, onClick }: StatusTabProps) {
    return (
      <button
        onClick={onClick}
        className={`px-6 py-2 text-sm font-medium transition-colors cursor-pointer
          ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
      >
        {label}
        {count !== undefined && <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded-full">{count}</span>}
      </button>
    )
  }
  
  