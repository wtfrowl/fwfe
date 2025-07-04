"use client"

import  { useState } from "react"
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ChartData {
  date?: string
  month?: string
  year?: number
  revenue: number
  income: number
}

const dailyData: ChartData[] = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  revenue: Math.floor(Math.random() * 5000) + 1000,
  income: Math.floor(Math.random() * 6000) + 2000,
}))

const monthlyData: ChartData[] = [
  { month: "Jan", revenue: 45000, income: 65000 },
  { month: "Feb", revenue: 52000, income: 85000 },
  { month: "Mar", revenue: 89000, income: 105000 },
  { month: "Apr", revenue: 72000, income: 90000 },
  { month: "May", revenue: 58000, income: 110000 },
  { month: "Jun", revenue: 95000, income: 102000 },
  { month: "Jul", revenue: 108000, income: 120000 },
  { month: "Aug", revenue: 89000, income: 105000 },
  { month: "Sep", revenue: 102000, income: 95000 },
  { month: "Oct", revenue: 71000, income: 90000 },
  { month: "Nov", revenue: 89000, income: 108000 },
  { month: "Dec", revenue: 104000, income: 115000 },
]

const yearlyData: ChartData[] = Array.from({ length: 5 }, (_, i) => ({
  year: 2019 + i,
  revenue: Math.floor(Math.random() * 1000000) + 500000,
  income: Math.floor(Math.random() * 1200000) + 700000,
}))

type Period = "DAY" | "MONTH" | "YEAR"

export function RevenueChart() {
  const [activePeriod, setActivePeriod] = useState<Period>("MONTH")

  const getChartData = (): ChartData[] => {
    switch (activePeriod) {
      case "DAY":
        return dailyData
      case "YEAR":
        return yearlyData
      default:
        return monthlyData
    }
  }

  const getXAxisKey = (): string => {
    switch (activePeriod) {
      case "DAY":
        return "date"
      case "YEAR":
        return "year"
      default:
        return "month"
    }
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
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={getXAxisKey()} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#3B82F6" />
            <Line type="monotone" dataKey="income" stroke="#9CA3AF" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

