import type { IconType } from "react-icons"
import { BsFuelPumpDiesel, BsHandbag, BsTriangle } from "react-icons/bs"
import { FiDollarSign, FiTruck } from "react-icons/fi"
import { HiOutlineArrowDown } from "react-icons/hi"
import { MdOutlineAccessTime } from "react-icons/md"

interface MetricCardProps {
  title: string
  value: string
  loading?: boolean
  icon: "expenses" | "profit" | "revenue" | "labour" | "distance" | "trip" | "fuel"
}

const iconMap: Record<string, IconType> = {
  expenses: BsHandbag,
  profit: FiDollarSign,
  revenue: HiOutlineArrowDown,
  labour: MdOutlineAccessTime,
  distance: FiTruck, // Assuming distance is also a metric
  trip:BsTriangle, // Assuming idle cost is also a metric
  fuel: BsFuelPumpDiesel, // Assuming fuel cost is also a metric
}

const colorMap: Record<string, string> = {
  expenses: "bg-orange-100 text-orange-500",
  profit: "bg-green-100 text-green-500",
  revenue: "bg-blue-100 text-blue-500",
  labour: "bg-red-100 text-red-500",
}

export function MetricCard({ title, value, icon, loading = false }: MetricCardProps) {
  const Icon = iconMap[icon];
  const colorClass = colorMap[icon] || "bg-gray-100 text-gray-400";

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          {loading ? (
            <div className="mt-1 w-24 h-6 rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
          ) : (
            <p className="text-2xl font-semibold">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}


