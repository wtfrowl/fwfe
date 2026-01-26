import { DataTable } from "../../../reuse/DataTable/DataTable";
import {  ProfitBadge } from "../../../reuse/DataTable/Cells";
import { DriverRouteAnalytics } from "../../../types/analytics";

export default function DriverRouteAnalyticsTable({
  data,
}: {
  data: DriverRouteAnalytics[];
}) {
  return (
    <DataTable<DriverRouteAnalytics>
      title="🔀 Driver × Route Analysis"
      subtitle="Performance of each driver on specific routes"
      data={data}
      columns={[
        {
          key: "route",
          header: "Route",
          render: (dr) => (
            <div className="font-medium">{dr.route}</div>
          ),
        },
        {
          key: "driver",
          header: "Driver",
          render: (dr) => (
            <div className="font-medium">
              {dr.driver.firstName} {dr.driver.lastName}
            </div>
          ),
        },
        {
          key: "totalTrips",
          header: "Trips",
          align: "center",
        },
        {
          key: "profit",
          header: "Profit",
          align: "right",
          render: (dr) => <ProfitBadge value={dr.profit} />,
        },
        {
          key: "profitPerKm",
          header: "Profit / KM",
          align: "right",
          render: (dr) => (
            <span
              className={`font-medium ${
                dr.profitPerKm < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              ₹{dr.profitPerKm.toFixed(2)}
            </span>
          ),
        },
        {
          key: "avgTripDurationHours",
          header: "Avg Trip (hrs)",
          align: "right",
          render: (dr) => dr.avgTripDurationHours.toFixed(2),
        },
      ]}
    />
  );
}
