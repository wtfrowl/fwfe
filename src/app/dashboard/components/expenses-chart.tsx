import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartCard, ChartEmpty } from "../../../components/charts/ChartCard";
import { CATEGORICAL, tooltipProps, rupees } from "../../../components/charts/theme";

interface ExpenseCategory {
  name: string;
  value: number;
}

interface ExpensesChartProps {
  categories: ExpenseCategory[];
}

const MAX_SLICES = CATEGORICAL.length;

const titleCase = (raw: string) =>
  raw
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export function ExpensesChart({ categories }: ExpensesChartProps) {
  /**
   * Sort descending and fold the tail into "Other".
   *
   * The old chart cycled an eight-hue palette by array index, which meant the
   * colour of a category depended on its position in the response rather than
   * on the category itself — add one expense type and every slice changed
   * colour. Sorting first, then assigning fixed palette slots, makes colour
   * follow the entity. Past five slices a donut stops being readable anyway,
   * so the remainder becomes one honest grey slice.
   */
  const sorted = [...(categories ?? [])]
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((c) => ({ ...c, name: titleCase(c.name) }));

  const head = sorted.slice(0, MAX_SLICES);
  const tail = sorted.slice(MAX_SLICES);
  const data = tail.length
    ? [...head, { name: "Other", value: tail.reduce((sum, c) => sum + c.value, 0) }]
    : head;

  const total = data.reduce((sum, c) => sum + c.value, 0);

  return (
    <ChartCard title="Expense breakdown">
      <div className="relative h-[350px] w-full">
        {data.length === 0 ? (
          <ChartEmpty message="No expense data recorded" />
        ) : (
          <>
            {/* The hole in a donut is wasted unless it carries the total the
                slices are parts of. */}
            <div className="pointer-events-none absolute inset-x-0 top-[38%] -translate-y-1/2 text-center">
              <p className="text-caption text-xs text-ink-tertiary">Total</p>
              <p className="text-xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
                {rupees(total)}
              </p>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius="60%"
                  outerRadius="80%"
                  paddingAngle={2}
                  dataKey="value"
                  cx="50%"
                  cy="45%"
                  /* A 2px surface-coloured gap separates neighbouring fills
                     instead of letting two hues touch. */
                  stroke="#fff"
                  strokeWidth={2}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={entry.name === "Other" ? "#9CA3AF" : CATEGORICAL[index]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  {...tooltipProps}
                  formatter={(value: number) => [rupees(value), "Cost"]}
                />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="align-middle text-xs text-ink-secondary">{value}</span>
                  )}
                  wrapperStyle={{
                    paddingTop: 16,
                    display: "flex",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </>
        )}
      </div>
    </ChartCard>
  );
}
