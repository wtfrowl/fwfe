// src/pages/Dashboard.tsx
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

// Shared components
import { MetricCard } from "./components/metric-card";
import { RevenueChart } from "./components/revenue-chart";
import { ExpensesChart } from "./components/expenses-chart";
import { DistanceChart } from "./components/distance-chart";
import { MetricsChart } from "./components/metrics-chart";
import { api } from "../services/api";

interface MetricsData {
  month: string;
  value: number;
}

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

// Dummy data helpers (replace with real API calls later)
const makeData = (base: number, spread: number): MetricsData[] =>
  Array.from({ length: 7 }, (_, i) => ({
    month: months[i],
    value: Math.floor(Math.random() * spread) + base,
  }));

const idleCostData   = makeData(50_000, 40_000);   // owner & driver
const fuelCostData   = makeData(40_000, 40_000);   // owner
const driverFuelData = makeData( 8_000,  8_000);   // driver

type Period = "DAY" | "MONTH" | "YEAR";

export default function Dashboard() {
  const { role } = useContext(AuthContext);       // "owner" | "driver"
  const [activePeriod, setActivePeriod] = useState<Period>("MONTH");
  const [dashboardData, setDashboardData] = useState<any>(null); // Replace 'any' with your actual data type



  //get dashboard data
  useEffect(() => {
  if (role==='driver') return; // Ensure role is defined before fetching data
    // Fetch dashboard data based on role and activePeriod
   const dashboardData = api.dashboard.info;
    dashboardData()
      .then(data => {
        setDashboardData(data);
      })
      .catch(error => {
        console.error("Error fetching dashboard data:", error);
      });
  }, [role]);

  /* ---------- OWNER DASHBOARD ---------- */
  const renderOwnerDashboard = () => (
    <>
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Expenses" value={`₹${dashboardData?.totalExpenses}`} icon="expenses"   loading={!dashboardData} />
        <MetricCard title="Profit"         value={`₹${dashboardData?.profit}`} icon="profit"    loading={!dashboardData} />
        <MetricCard title="Revenue"        value={`₹${dashboardData?.revenue}`} icon="revenue"   loading={!dashboardData} />
        <MetricCard title="Labour Hours"   value={`${dashboardData?.labourHours} hrs`} icon="labour"    loading={!dashboardData} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart />
        <ExpensesChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DistanceChart
          activePeriod={activePeriod}
          setActivePeriod={setActivePeriod}
        />
        <MetricsChart title="Idle Cost" data={idleCostData} color="#F59E0B" />
        <MetricsChart title="Fuel Cost" data={fuelCostData} color="#3B82F6" />
      </div>
    </>
  );

  /* ---------- DRIVER DASHBOARD ---------- */
  const renderDriverDashboard = () => (
    <>
      {/* Driver‑specific metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Total Trips"       value="58"        icon="trip"  loading={false}   />
        <MetricCard title="Distance Covered"  value="14,300 km" icon="distance" loading={false} />
        <MetricCard title="Fuel Used"         value="2,400 L"   icon="fuel"     loading={false} />
      </div>

      {/* Driver charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DistanceChart
          activePeriod={activePeriod}
          setActivePeriod={setActivePeriod}
        />
        <MetricsChart title="Fuel Cost" data={driverFuelData} color="#3B82F6" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricsChart title="Idle Cost" data={idleCostData} color="#F59E0B" />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto space-y-6">
        {role === "owner" ? renderOwnerDashboard() : renderDriverDashboard()}
      </div>
    </div>
  );
}
