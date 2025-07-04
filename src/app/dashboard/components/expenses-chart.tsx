"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

interface ExpenseData {
  name: string
  value: number
}

const data: ExpenseData[] = [
  { name: "Toll charges", value: 25 },
  { name: "Servicing", value: 20 },
  { name: "Labour Cost", value: 15 },
  { name: "Maintenance", value: 15 },
  { name: "Other", value: 15 },
  { name: "Fuel", value: 10 },
]

const COLORS = ["#3B82F6", "#EF4444", "#F59E0B", "#10B981", "#6B7280", "#8B5CF6"]

export function ExpensesChart() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-6">Expenses</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((index:any) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

