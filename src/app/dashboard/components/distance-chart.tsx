import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartCard, ChartEmpty, PeriodToggle, type Period } from "../../../components/charts/ChartCard";
import { CATEGORICAL, axisProps, gridProps, tooltipProps, compact } from "../../../components/charts/theme";

interface DistanceData {
  name?: string;
  distance: number;
}

interface DistanceChartProps {
  data: DistanceData[];
  activePeriod: Period;
  setActivePeriod: (period: Period) => void;
}

export function DistanceChart({ data, activePeriod, setActivePeriod }: DistanceChartProps) {
  const hasData = data && data.length > 0;

  return (
    <ChartCard
      title="Driving distance"
      action={<PeriodToggle value={activePeriod} onChange={setActivePeriod} />}
    >
      <div className="h-[200px]">
        {!hasData ? (
          <ChartEmpty message="No distance data available" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="name" {...axisProps} dy={8} />
              {/* The old formatter divided by 1000 unconditionally, so a
                  400 km day rendered as "0.4k" and a 12 km day as "0k". */}
              <YAxis {...axisProps} tickFormatter={compact} width={44} />
              <Tooltip
                {...tooltipProps}
                formatter={(value: number) => [`${value.toLocaleString("en-IN")} km`, "Distance"]}
              />
              {/* Rounded data-ends only, anchored flat to the baseline — a bar
                  rounded-chip at the axis would float off it. */}
              <Bar dataKey="distance" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}
