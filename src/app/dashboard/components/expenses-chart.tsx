"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface ExpenseCategory {
  name: string
  value: number
}

interface ExpensesChartProps {
  data?: any[] 
  categories: ExpenseCategory[]
}

const COLORS = ["#3B82F6", "#EF4444", "#F59E0B", "#10B981", "#6B7280", "#8B5CF6", "#EC4899", "#6366F1"]

export function ExpensesChart({ categories }: ExpensesChartProps) {
  // Format the names: diesel -> Diesel, driver_allowance -> Driver Allowance
  const formattedData = categories?.map(cat => ({
    ...cat,
    name: cat.name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }));

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm w-full border border-gray-100 overflow-hidden">
      <h2 className="text-lg font-semibold mb-4">Expense Breakdown</h2>
      <div className="h-[350px] w-full">
        {(!formattedData || formattedData.length === 0) ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            No expense data recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                innerRadius="60%"
                outerRadius="80%"
                paddingAngle={5}
                dataKey="value"
                cx="50%"
                cy="45%" // Lifted slightly to make room for bottom legend
              >
                {formattedData.map((_entry, index) => (
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
                align="center"
                iconType="circle"
                iconSize={10}
                // This function ensures names stay within their bounds
                formatter={(value) => (
                  <span className="text-xs text-gray-600 truncate inline-block max-w-[120px] align-middle">
                    {value}
                  </span>
                )}
                wrapperStyle={{ 
                  paddingTop: '20px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  gap: '4px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}