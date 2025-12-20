"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface ExpenseCategory {
  name: string
  value: number
}

interface ExpensesChartProps {
  // We accept 'data' (time series) to match the prop passed by Dashboard, 
  // even if we only use 'categories' for the Pie Chart.
  data?: any[] 
  categories: ExpenseCategory[]
}

const COLORS = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#6B7280", // Gray
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#6366F1"  // Indigo
]

export function ExpensesChart({ categories }: ExpensesChartProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-6">Expense Breakdown</h2>
      <div className="h-[300px]">
        {(!categories || categories.length === 0) ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No expense data recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {categories.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[index % COLORS.length]} 
                    strokeWidth={0}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [`₹${value.toLocaleString()}`, "Cost"]}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}