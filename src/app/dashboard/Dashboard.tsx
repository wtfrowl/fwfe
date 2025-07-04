import  { useState } from "react"
import { MetricCard } from "./components/metric-card"
import { RevenueChart } from "./components/revenue-chart"
import { ExpensesChart } from "./components/expenses-chart"
import { DistanceChart } from "./components/distance-chart"
import { MetricsChart } from "./components/metrics-chart"

interface MetricsData {
  month: string
  value: number
}

const idleCostData: MetricsData[] = Array.from({ length: 7 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][i],
  value: Math.floor(Math.random() * 40000) + 50000,
}))

const fuelCostData: MetricsData[] = Array.from({ length: 7 }, (_, i) => ({
  month: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][i],
  value: Math.floor(Math.random() * 40000) + 40000,
}))

type Period = "DAY" | "MONTH" | "YEAR"

export default function Dashboard() {
  const [activePeriod, setActivePeriod] = useState<Period>("MONTH")

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className=" mx-auto space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Expenses" value="$124,000" icon="expenses" />
          <MetricCard title="Profit" value="$124,000" icon="profit" />
          <MetricCard title="Revenue" value="$100,000" icon="revenue" />
          <MetricCard title="Labour Hours" value="300,000K" icon="labour" />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart />
          <ExpensesChart />
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DistanceChart activePeriod={activePeriod} setActivePeriod={setActivePeriod} />
          <MetricsChart title="Idle Cost" data={idleCostData} color="#F59E0B" />
          <MetricsChart title="Fuel Cost" data={fuelCostData} color="#3B82F6" />
        </div>
      </div>
    </div>
  )
}

