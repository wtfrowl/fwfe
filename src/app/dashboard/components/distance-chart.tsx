"use client"

import type React from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface DistanceData {
  date?: string
  month?: string
  year?: number
  distance: number
}

const dailyData: DistanceData[] = Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  distance: Math.floor(Math.random() * 5000) + 1000,
}))

const monthlyData: DistanceData[] = [
  { month: "Jan", distance: 30000 },
  { month: "Feb", distance: 95000 },
  { month: "Mar", distance: 50000 },
  { month: "Apr", distance: 70000 },
  { month: "May", distance: 75000 },
  { month: "Jun", distance: 72000 },
  { month: "Jul", distance: 50000 },
  { month: "Aug", distance: 95000 },
  { month: "Sep", distance: 100000 },
  { month: "Oct", distance: 42000 },
  { month: "Nov", distance: 50000 },
  { month: "Dec", distance: 65000 },
]

const yearlyData: DistanceData[] = Array.from({ length: 5 }, (_, i) => ({
  year: 2019 + i,
  distance: Math.floor(Math.random() * 1000000) + 500000,
}))

type Period = "DAY" | "MONTH" | "YEAR"

interface DistanceChartProps {
  activePeriod: Period
  setActivePeriod: React.Dispatch<React.SetStateAction<Period>>
}

export function DistanceChart({ activePeriod, setActivePeriod }: DistanceChartProps) {
  const getChartData = (): DistanceData[] => {
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
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={getChartData()}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={getXAxisKey()} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="distance" fill="#3B82F6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

