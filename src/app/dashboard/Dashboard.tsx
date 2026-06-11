import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { MetricCard } from "./components/metric-card";
import { RevenueChart } from "./components/revenue-chart";
import { ExpensesChart } from "./components/expenses-chart";
import { DistanceChart } from "./components/distance-chart";
import { MetricsChart } from "./components/metrics-chart";
import { LoadingSpinner } from "../trips/components/loading-spinner";
import { getDashboardData } from "../../api/dashboard.api";

interface DateKey {
  year: number;
  month?: number;
  day?: number;
}

interface ChartPoint {
  dateKey: DateKey;
  value: number;
}

interface DashboardResponse {
  summary: {
    revenue: number;
    totalExpenses: number;
    profit: number;
    labourHours: number;
    distance: number;
    fuelCost: number;
    idleCost: number;
  };
  charts: {
    revenue: ChartPoint[];
    distance: ChartPoint[];
    expenses: ChartPoint[];
    fuel: ChartPoint[];
    idle: ChartPoint[];
    expenseCategories: { name: string; value: number }[];
  };
}

type Period = "DAY" | "MONTH" | "YEAR";

export default function Dashboard() {
  const { role } = useContext(AuthContext);
  const [activePeriod, setActivePeriod] = useState<Period>("MONTH");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const formatChartData = (rawData: ChartPoint[] = []) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return rawData.map((item) => {
      let label = "";
      const { year, month, day } = item.dateKey;

      if (activePeriod === "YEAR") {
        label = `${year}`;
      } else if (activePeriod === "MONTH") {
        label = month && monthNames[month - 1] ? monthNames[month - 1] : "N/A";
      } else {
        label = `${day}/${month}`;
      }

      return {
        name: label,
        value: item.value || 0,
      };
    });
  };

  useEffect(() => {
    if (!role || role === "driver") return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const response = (await getDashboardData({ period: activePeriod })) as DashboardResponse;
        setData(response);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role, activePeriod]);

  const renderOwnerDashboard = () => {
    if (loading || !data) {
      return <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>;
    }

    const distanceData = formatChartData(data.charts.distance);
    const expenseData = formatChartData(data.charts.expenses);
    const fuelData = formatChartData(data.charts.fuel);
    const idleData = formatChartData(data.charts.idle);
    const formatData = (items: ChartPoint[]) =>
      items.map((item) => {
        const { year, month, day } = item.dateKey;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const label = activePeriod === "YEAR" ? `${year}` : activePeriod === "MONTH" ? (month ? monthNames[month - 1] || "N/A" : "N/A") : `${day}/${month}`;
        return { ...item, name: label };
      });

    const revenueList = formatData(data.charts.revenue);
    const expenseList = formatData(data.charts.expenses);
    const mergedRevenueData = revenueList.map((revItem) => {
      const expenseItem = expenseList.find((e) => e.name === revItem.name) || { value: 0 };
      const expenseVal = expenseItem.value || 0;
      return {
        name: revItem.name,
        revenue: revItem.value,
        income: revItem.value - expenseVal,
      };
    });

    const formattedDistance = distanceData.map((d) => ({ ...d, distance: d.value }));

    return (
      <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Expenses" value={`Rs ${data.summary.totalExpenses.toLocaleString()}`} icon="expenses" loading={false} />
          <MetricCard title="Profit" value={`Rs ${data.summary.profit.toLocaleString()}`} icon="profit" loading={false} />
          <MetricCard title="Revenue" value={`Rs ${data.summary.revenue.toLocaleString()}`} icon="revenue" loading={false} />
          <MetricCard title="Idle Cost" value={`Rs ${data.summary.idleCost.toLocaleString()}`} icon="labour" loading={false} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChart data={mergedRevenueData} activePeriod={activePeriod} setActivePeriod={setActivePeriod} />
          <ExpensesChart data={expenseData} categories={data.charts.expenseCategories} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DistanceChart activePeriod={activePeriod} setActivePeriod={setActivePeriod} data={formattedDistance} />
          <MetricsChart title="Idle Cost" data={idleData} color="#F59E0B" />
          <MetricsChart title="Fuel Cost" data={fuelData} color="#3B82F6" />
        </div>
      </>
    );
  };

  const renderDriverDashboard = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Total Trips" value="58" icon="trip" loading={false} />
        <MetricCard title="Distance Covered" value="14,300 km" icon="distance" loading={false} />
        <MetricCard title="Fuel Used" value="2,400 L" icon="fuel" loading={false} />
      </div>
      <div className="p-6 bg-white rounded shadow text-center text-gray-500">
        Driver analytics coming soon...
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto space-y-6 max-w-7xl">
        {role === "owner" ? renderOwnerDashboard() : renderDriverDashboard()}
      </div>
    </div>
  );
}
