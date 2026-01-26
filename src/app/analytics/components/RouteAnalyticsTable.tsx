import { DataTable } from "../../../reuse/DataTable/DataTable";
import { MoneyCell, ProfitBadge } from "../../../reuse/DataTable/Cells";
import { RouteAnalytics } from "../../../types/analytics";

export default function RouteAnalyticsTable({
  data,
}: {
  data: RouteAnalytics[];
}) {
  return (
    <DataTable<RouteAnalytics>
      title="🛣️ Route Analytics"
      subtitle="Profitability & cost efficiency per route"
      data={data}
      columns={[
        {
          key: "route",
          header: "Route",
          render: (r) => (
            <div className="font-medium">{r.route}</div>
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
          render: (r) => <MoneyCell value={r.totalRevenue} />,
        },
        {
          key: "totalExpense",
          header: "Expense",
          align: "right",
          render: (r) => <MoneyCell value={r.totalExpense} />,
        },
        {
          key: "profit",
          header: "Profit",
          align: "right",
          render: (r) => <ProfitBadge value={r.profit} />,
        },
        {
          key: "costPerKm",
          header: "Cost / KM",
          align: "right",
          render: (r) => `₹${r.costPerKm.toFixed(2)}`,
        },
        {
          key: "profitPerKm",
          header: "Profit / KM",
          align: "right",
          render: (r) => (
            <span
              className={`font-medium ${
                r.profitPerKm < 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              ₹{r.profitPerKm.toFixed(2)}
            </span>
          ),
        },
      ]}
    />
  );
}
