import { FiUser, FiLock, FiBell, FiShield } from "react-icons/fi"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs = [
    { id: "profile", icon: FiUser, label: "Profile Settings" },
    { id: "password", icon: FiLock, label: "Password" },
    { id: "notifications", icon: FiBell, label: "Notifications" },
    { id: "verification", icon: FiShield, label: "Verification" },
  ]

  return (
    <div className="w-full md:w-64 bg-white shadow-sm p-4 md:p-6">
      <h2 className="text-xl font-semibold mb-4 md:mb-6">Account settings</h2>
      <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto md:overflow-x-visible">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center md:justify-start space-x-2 w-full p-2 md:p-3 rounded-lg text-sm md:text-base whitespace-nowrap ${
              activeTab === tab.id ? "bg-blue-50 text-blue-600" : "text-gray-600"
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

