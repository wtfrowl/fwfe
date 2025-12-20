"use client"

import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

type Period = "DAY" | "MONTH" | "YEAR"

interface ChartData {
  name?: string      // Unified label (e.g., "Jan", "2024", "Day 1")
  revenue: number
  income: number
  [key: string]: any // Allow dynamic keys if needed
}

interface RevenueChartProps {
  data: ChartData[]
  activePeriod: Period
  setActivePeriod: (period: Period) => void
}

export function RevenueChart({ data, activePeriod, setActivePeriod }: RevenueChartProps) {

  // We use a fixed key "name" for XAxis because the parent formats the label 
  // based on the period (e.g., converting "1" to "Jan")
  const getXAxisKey = (): string => {
    return "name" 
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Revenue</h2>
        <div className="flex gap-2">
          {(["DAY", "MONTH", "YEAR"] as Period[]).map((period) => (
            <button
              key={period}
              className={`px-3 py-1 rounded-md text-sm ${
                activePeriod === period ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-100"
              }`}
              onClick={() => setActivePeriod(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[300px]">
        {/* Helper to handle loading/empty states while preserving layout */}
        {(!data || data.length === 0) ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
             No data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={getXAxisKey()} />
              <YAxis />
              <Tooltip />
              <Legend />
              {/* Preserved your exact colors and line types */}
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" />
              <Line type="monotone" dataKey="income" stroke="#9CA3AF" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}