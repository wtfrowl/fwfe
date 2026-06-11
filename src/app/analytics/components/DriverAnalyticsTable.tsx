import { DataTable } from "../../../reuse/DataTable/DataTable";
import { MoneyCell, ProfitBadge } from "../../../reuse/DataTable/Cells";
import { DriverAnalytics } from "../../../types/analytics";

export default function DriverAnalyticsTable({ data }: { data: DriverAnalytics[] }) {
  return (
    <DataTable<DriverAnalytics>
      title="Driver Performance"
      subtitle="Efficiency, profitability, and workload per driver"
      data={data}
      columns={[
        {
          key: "driver",
          header: "Driver",
          render: (d) => (
            <div>
              <div className="font-medium">
                {d.driver.firstName} {d.driver.lastName}
              </div>
              <div className="text-xs text-gray-500">{d.driver.contactNumber}</div>
            </div>
          ),
        },
        {
          key: "totalTrips",
          header: "Trips",
          align: "center",
        },
        {
          key: "totalRevenue",
          header: "Revenue",
          align: "right",
          render: (d) => <MoneyCell value={d.totalRevenue} />,
        },
        {
          key: "totalDistance",
          header: "Distance",
          align: "right",
          render: (d) => `${d.totalDistance.toLocaleString()} km`,
        },
        {
          key: "profit",
          header: "Profit",
          align: "right",
          render: (d) => <ProfitBadge value={d.profit} />,
        },
        {
          key: "routes",
          header: "Routes",
          align: "center",
          render: (d) => d.routes.length,
        },
        {
          key: "avgTripDurationHours",
          header: "Avg Trip (hrs)",
          align: "right",
          render: (d) => d.avgTripDurationHours.toFixed(2),
        },
        {
          key: "costPerKm",
          header: "Cost / KM",
          align: "right",
          render: (d) => `Rs ${d.costPerKm.toFixed(2)}`,
        },
      ]}
    />
  );
}
