interface StatusTabProps {
    label: string
    active: boolean
    onClick: () => void
  }
  
  export function StatusTab({ label, active, onClick }: StatusTabProps) {
    return (
      <button
        onClick={onClick}
        className={`px-6 py-2 text-sm font-medium transition-colors
          ${active ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:text-gray-900"}`}
      >
        {label}
      </button>
    )
  }
  
  