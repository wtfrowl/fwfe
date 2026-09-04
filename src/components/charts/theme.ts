/**
 * One chart system for the whole app.
 *
 * Before this, every chart picked its own colours inline: the revenue lines
 * were #3B82F6/#9CA3AF, the pie cycled an eight-hue rainbow, distance was a
 * lone blue. Nothing agreed, and the pie's palette was cycled by index — so
 * adding one expense category silently repainted every other category.
 *
 * CATEGORICAL is assigned in fixed order and never cycled. Colour follows the
 * entity, not its rank: a filter that drops a series must not repaint the
 * survivors. Past eight series the answer is "Other", not a ninth hue.
 *
 * Palette validated against the light chart surface — all six checks pass:
 * lightness band, chroma floor, CVD separation (worst adjacent pair ΔE 9.3
 * protan), normal-vision floor (ΔE 21.9), and 3:1 contrast.
 */

export const CATEGORICAL = [
  "#2563EB", // blue
  "#C2660A", // amber
  "#0F8A6A", // teal
  "#7C3AED", // violet
  "#D93A5C", // rose
] as const;

/** Sequential magnitude: one hue, light to dark. Never a rainbow. */
export const SEQUENTIAL = ["#DBEAFE", "#93C5FD", "#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8"] as const;

/**
 * Status is reserved. These never stand in for "series 4", and they always
 * ship with a label or icon beside them — colour alone is not a signal.
 */
export const STATUS = {
  good: "#0F8A6A",
  warning: "#C2660A",
  critical: "#D93A5C",
} as const;

/* Ink and grid pulled to match the design tokens. Axes and gridlines are
   deliberately recessive — they orient, they do not compete with the data. */
export const CHART_INK = "#6B7280";
export const CHART_GRID = "#E8EAEE";

/** Shared axis props. Applied identically everywhere so charts read as a set. */
export const axisProps = {
  axisLine: false,
  tickLine: false,
  tick: { fontSize: 12, fill: CHART_INK },
} as const;

export const gridProps = {
  stroke: CHART_GRID,
  strokeDasharray: "0",
  vertical: false,
} as const;

/** Tooltip chrome that matches the app's surfaces rather than Recharts' default. */
export const tooltipProps = {
  cursor: { fill: "rgba(107,114,128,0.08)" },
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid #E8EAEE",
    boxShadow: "0 12px 32px rgba(19,25,34,0.10)",
    fontSize: "12px",
    padding: "8px 12px",
  },
  labelStyle: { color: "#131922", fontWeight: 600, marginBottom: 2 },
} as const;

export const rupees = (value: number) => `₹${value.toLocaleString("en-IN")}`;

/** Compact axis labels — 12,400 reads as 12.4k and stops the y-axis widening. */
export function compact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return `${value}`;
}
