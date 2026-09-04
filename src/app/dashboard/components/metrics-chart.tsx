import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useId } from "react";
import { ChartCard, ChartEmpty } from "../../../components/charts/ChartCard";
import { axisProps, gridProps, tooltipProps, compact, rupees } from "../../../components/charts/theme";

interface MetricsData {
  name: string;
  value: number;
}

interface MetricsChartProps {
  title: string;
  data: MetricsData[];
  color: string;
}

/**
 * Single-series trend. No legend: the card title already names the series, and
 * a legend box for one thing is furniture.
 */
export function MetricsChart({ title, data, color }: MetricsChartProps) {
  const gradientId = useId();
  const hasData = data && data.length > 0;

  return (
    <ChartCard title={title}>
      <div className="h-[200px]">
        {!hasData ? (
          <ChartEmpty message="No data for this period" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              {/* The axis read `dataKey="month"`, a key this data has never
                  had, so every one of these charts rendered a blank x-axis. */}
              <XAxis dataKey="name" {...axisProps} dy={8} />
              <YAxis {...axisProps} tickFormatter={compact} width={44} />
              <Tooltip {...tooltipProps} formatter={(v: number) => rupees(v)} />
              <Area
                type="monotone"
                dataKey="value"
                name={title}
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
