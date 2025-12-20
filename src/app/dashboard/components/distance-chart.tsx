"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

type Period = "DAY" | "MONTH" | "YEAR"

interface DistanceData {
  name?: string     // Unified label (e.g., "Jan", "2024")
  distance: number  // The value to plot
  [key: string]: any 
}

interface DistanceChartProps {
  data: DistanceData[]
  activePeriod: Period
  setActivePeriod: (period: Period) => void
}

export function DistanceChart({ data, activePeriod, setActivePeriod }: DistanceChartProps) {
  
  // We use "name" because the parent component formats the date label 
  // before passing it down.
  const getXAxisKey = (): string => {
    return "name"
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Driving Distance</h2>
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
      
      <div className="h-[200px]">
        {(!data || data.length === 0) ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No distance data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey={getXAxisKey()} 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <Tooltip 
                cursor={{ fill: "#F3F4F6" }}
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                formatter={(value: number) => [`${value.toLocaleString()} km`, "Distance"]}
              />
              <Bar 
                dataKey="distance" 
                fill="#3B82F6" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}