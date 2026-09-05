import { DataTable } from "../../../reuse/DataTable/DataTable";
import { MoneyCell } from "../../../reuse/DataTable/Cells";
import type { LaneAssignment } from "../../../types/analytics";

/**
 * Who to put on a lane, and who to take off it.
 *
 * Both halves of this question return the same row shape from the server, so
 * one table renders them and the framing carries the difference — the "best"
 * list is a recommendation, the "worst" list is a list of pairings that are
 * losing money and want a decision.
 *
 * Profit per kilometre leads, not total profit: a driver who ran the lane
 * twice as often will always show more total profit without being better at
 * it, and picking on the total is how you end up rewarding availability.
 */
export default function LaneAssignmentTable({
  data,
  variant,
}: {
  data: LaneAssignment[];
  variant: "best" | "worst";
}) {
  const best = variant === "best";

  return (
    <DataTable<LaneAssignment>
      title={best ? "Best driver per lane" : "Pairings losing money"}
      subtitle={
        best
          ? "The most profitable driver on each route you run regularly."
          : "Driver and route combinations running at a loss per kilometre."
      }
      data={data}
      emptyMessage={
        best
          ? "No lane has enough completed trips yet to name a best driver."
          : "No driver-route pairing is currently running at a loss."
      }
      columns={[
        {
          key: "route",
          header: "Route",
          render: (row) => <div className="font-medium text-ink">{row.route}</div>,
        },
        {
          key: "driver",
          header: "Driver",
          render: (row) => (
            <div className="font-medium text-ink">
              {row.driver.firstName} {row.driver.lastName}
            </div>
          ),
        },
        { key: "totalTrips", header: "Trips", align: "center" },
        {
          key: "distance",
          header: "Distance",
          align: "right",
          render: (row) => `${Math.round(row.distance || 0).toLocaleString("en-IN")} km`,
        },
        {
          key: "profit",
          header: "Profit",
          align: "right",
          render: (row) => <MoneyCell value={row.profit} />,
        },
        {
          key: "profitPerKm",
          header: "Profit / km",
          align: "right",
          render: (row) => (
            <span
              className={`font-medium ${
                row.profitPerKm < 0 ? "text-critical-ink" : "text-positive-ink"
              }`}
            >
              ₹{row.profitPerKm.toFixed(2)}
            </span>
          ),
        },
      ]}
    />
  );
}
