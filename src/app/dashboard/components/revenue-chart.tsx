import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ChartCard, ChartEmpty, PeriodToggle, type Period } from "../../../components/charts/ChartCard";
import { CATEGORICAL, axisProps, gridProps, tooltipProps, compact, rupees } from "../../../components/charts/theme";

interface ChartData {
  name?: string;
  revenue: number;
  income: number;
}

interface RevenueChartProps {
  data: ChartData[];
  activePeriod: Period;
  setActivePeriod: (period: Period) => void;
}

export function RevenueChart({ data, activePeriod, setActivePeriod }: RevenueChartProps) {
  const hasData = data && data.length > 0;

  return (
    <ChartCard
      title="Revenue"
      action={<PeriodToggle value={activePeriod} onChange={setActivePeriod} />}
    >
      <div className="h-[300px]">
        {!hasData ? (
          <ChartEmpty message="No data available for this period" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              {/* Horizontal rules only. A full grid boxes the data in without
                  helping anyone read a value off it. */}
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} dy={8} />
              <YAxis {...axisProps} tickFormatter={compact} width={48} />
              <Tooltip {...tooltipProps} formatter={(v: number) => rupees(v)} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              {/* Two series, so a legend is mandatory — identity must never
                  rest on colour alone. Fixed palette slots, not cycled. */}
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={CATEGORICAL[0]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Net income"
                stroke={CATEGORICAL[2]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
