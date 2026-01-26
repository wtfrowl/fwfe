
import { TruckAnalytics } from "../../../types/analytics";
import { DataTable } from "../../../reuse/DataTable/DataTable";
import { MoneyCell, ProfitBadge } from "../../../reuse/DataTable/Cells";

export default function TruckAnalyticsTable({
  data,
}: {
  data: TruckAnalytics[];
}) {
  return (
    <DataTable
      title="🚚 Truck Performance"
      subtitle="Profitability & efficiency per truck"
      data={data}
      columns={[
        {
          key: "_id",
          header: "Truck",
          render: (t) => (
            <div>
              <div className="font-medium">{t._id}</div>
              <div className="text-xs text-gray-500">
                {t.truck.model} • {t.truck.capacity}T
              </div>
            </div>
          ),
        },
        { key: "totalTrips", header: "Trips", align: "center" },
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
      ]}
    />
  );
}
