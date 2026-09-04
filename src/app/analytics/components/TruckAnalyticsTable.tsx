import { DataTable } from "../../../reuse/DataTable/DataTable";
import { MoneyCell, ProfitBadge } from "../../../reuse/DataTable/Cells";
import { TruckAnalytics } from "../../../types/analytics";

export default function TruckAnalyticsTable({ data }: { data: TruckAnalytics[] }) {
  return (
    <DataTable
      title="Truck Performance"
      subtitle="Profitability and efficiency per truck"
      data={data}
      columns={[
        {
          key: "_id",
          header: "Truck",
          render: (t) => (
            <div>
              <div className="font-medium text-ink">{t._id}</div>
              <div className="text-xs text-ink-tertiary">
                {t.truck.model} • {t.truck.capacity}T
              </div>
            </div>
          ),
        },
        { key: "totalTrips", header: "Trips", align: "center" },
        {
          key: "totalDistance",
          header: "Distance",
          align: "right",
          render: (t) => `${t.totalDistance.toLocaleString()} km`,
        },
        {
          key: "totalRevenue",
          header: "Revenue",
          align: "right",
          render: (t) => <MoneyCell value={t.totalRevenue} />,
        },
        {
          key: "totalExpense",
          header: "Expense",
          align: "right",
          render: (t) => <MoneyCell value={t.totalExpense} />,
        },
        {
          key: "dieselExpense",
          header: "Diesel",
          align: "right",
          render: (t) => <MoneyCell value={t.dieselExpense} />,
        },
        {
          key: "profit",
          header: "Profit",
          align: "right",
          render: (t) => <ProfitBadge value={t.profit} />,
        },
        {
          key: "costPerKm",
          header: "Cost / KM",
          align: "right",
          render: (t) => `₹${t.costPerKm.toFixed(2)}`,
        },
        {
          key: "profitPerKm",
          header: "Profit / KM",
          align: "right",
          render: (t) => (
            <span className={`font-medium ${t.profitPerKm < 0 ? "text-critical-ink" : "text-positive-ink"}`}>
              ₹{t.profitPerKm.toFixed(2)}
            </span>
          ),
        },
      ]}
    />
  );
}
