// src/pages/Dashboard.tsx
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";

// Shared components
import { MetricCard } from "./components/metric-card";
import { RevenueChart } from "./components/revenue-chart";
import { ExpensesChart } from "./components/expenses-chart";
import { DistanceChart } from "./components/distance-chart";
import { MetricsChart } from "./components/metrics-chart";
import { LoadingSpinner } from "../trips/components/loading-spinner";

// --- Types for API Response ---
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
  const { role } = useContext(AuthContext); // "owner" | "driver"
  const [activePeriod, setActivePeriod] = useState<Period>("MONTH");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Helper: Format Data for Recharts (Shared Logic) ---
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
        name: label, // X-Axis Label
        value: item.value || 0, // Y-Axis Value
      };
    });
  };

  // --- Fetch Data ---
  useEffect(() => {
    if (!role || role === 'driver') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("ownerToken");
        const parsedToken = token ? JSON.parse(token) : null;

        const config = {
          headers: {
            Authorization: parsedToken?.accessToken,
          },
          params: { period: activePeriod }, // Pass period to backend
        };

        // Hitting the single-source API
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/stats/all`, 
          config
        );

        setData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [role, activePeriod]); // Re-fetch when period changes

  /* ---------- OWNER DASHBOARD ---------- */
  const renderOwnerDashboard = () => {
    if (loading || !data) {
      return <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>;
    }

    // Prepare data slices
    //const revenueData = formatChartData(data.charts.revenue);
    const distanceData = formatChartData(data.charts.distance); // Renames 'value' to 'distance' internally if needed
    const expenseData = formatChartData(data.charts.expenses);
    const fuelData = formatChartData(data.charts.fuel);
    const idleData = formatChartData(data.charts.idle);
    // 1. Format Helper (Assumes API returns standard keys)
    const formatData = (items: any[]) => items.map(item => {
        const { year, month, day } = item.dateKey;
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let label = activePeriod === "YEAR" ? `${year}` 
          : activePeriod === "MONTH" ? (monthNames[month - 1] || "N/A") 
          : `${day}/${month}`;
        return { ...item, name: label };
    });

    const revenueList = formatData(data.charts.revenue);
    const expenseList = formatData(data.charts.expenses);
    // 2. MERGE Revenue + Expenses to calculate Income (Profit) for the Chart
    // This creates the single array with { name, revenue, income } that the chart needs
    const mergedRevenueData = revenueList.map((revItem) => {
      const expenseItem = expenseList.find(e => e.name === revItem.name) || { value: 0 };
      const expenseVal = expenseItem.value || 0;
      return {
        name: revItem.name,
        revenue: revItem.value,
        income: revItem.value - expenseVal // Calculated Income (Profit)
      };
    });

    // Prepare Distance specific structure (if DistanceChart expects 'distance' key)
    const formattedDistance = distanceData.map(d => ({ ...d, distance: d.value }));

    return (
      <>
        {/* 1. Metric Cards (Summary Data) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Expenses" value={`₹${data.summary.totalExpenses.toLocaleString()}`} icon="expenses" loading={false} />
          <MetricCard title="Profit" value={`₹${data.summary.profit.toLocaleString()}`} icon="profit" loading={false} />
          <MetricCard title="Revenue" value={`₹${data.summary.revenue.toLocaleString()}`} icon="revenue" loading={false} />
          <MetricCard title="Idle Cost" value={`₹${data.summary.idleCost.toLocaleString()}`} icon="labour" loading={false} />
        </div>

        {/* 2. Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart now receives data via props */}
         <RevenueChart 
             data={mergedRevenueData} 
             activePeriod={activePeriod} 
             setActivePeriod={setActivePeriod} 
          />
          {/* Expenses Chart receives Time Series + Categories */}
          <ExpensesChart 
             data={expenseData} 
             categories={data.charts.expenseCategories} 
          />
        </div>

        {/* 3. Secondary Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Distance Chart needs period control + data */}
          <DistanceChart
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod} // Controls the main dashboard state
            data={formattedDistance}
          />
          <MetricsChart title="Idle Cost" data={idleData} color="#F59E0B" />
          <MetricsChart title="Fuel Cost" data={fuelData} color="#3B82F6" />
        </div>
      </>
    );
  };

  /* ---------- DRIVER DASHBOARD (Static for now) ---------- */
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