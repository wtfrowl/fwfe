import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { MetricCard } from "./components/metric-card";
import { RevenueChart } from "./components/revenue-chart";
import { ExpensesChart } from "./components/expenses-chart";
import { DistanceChart } from "./components/distance-chart";
import { MetricsChart } from "./components/metrics-chart";
import { LoadingState } from "../../components/ui/LoadingState";
import { PageHeader } from "../../components/ui/PageHeader";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { EmptyState } from "../../components/ui/EmptyState";
import { RevealGroup, RevealItem } from "../../motion/Reveal";
import { STATUS } from "../../components/charts/theme";
import { getDashboardData } from "../../api/dashboard.api";
import type { Period } from "../../components/charts/ChartCard";

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function Dashboard() {
  const { role } = useContext(AuthContext);
  const [activePeriod, setActivePeriod] = useState<Period>("MONTH");
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* One label formatter. The old file had two near-identical copies —
     `formatChartData` and an inline `formatData` — that disagreed about
     whether the result kept its original fields. */
  const labelFor = (dateKey: DateKey): string => {
    const { year, month, day } = dateKey;
    if (activePeriod === "YEAR") return `${year}`;
    if (activePeriod === "MONTH") return month ? (MONTHS[month - 1] ?? "N/A") : "N/A";
    return `${day}/${month}`;
  };

  const toSeries = (points: ChartPoint[] = []) =>
    points.map((p) => ({ name: labelFor(p.dateKey), value: p.value || 0 }));

  useEffect(() => {
    if (!role || role === "driver") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = (await getDashboardData({ period: activePeriod })) as DashboardResponse;
        /* The old effect had no cancellation, so switching period twice
           quickly could land the slower response last and show stale data. */
        if (!cancelled) setData(response);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        if (!cancelled) setError("Could not load your dashboard. Check your connection and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardData();
    return () => {
      cancelled = true;
    };
  }, [role, activePeriod]);

  const renderOwnerDashboard = () => {
    if (loading) return <LoadingState label="Loading your fleet summary" />;
    if (error) return <InlineMessage tone="error">{error}</InlineMessage>;
    if (!data) {
      return (
        <EmptyState
          title="No data yet"
          description="Once your trucks start logging trips, your revenue, distance and expense summaries will appear here."
        />
      );
    }

    const revenueSeries = toSeries(data.charts.revenue);
    const expenseSeries = toSeries(data.charts.expenses);

    /* Net income is revenue minus expenses for the same bucket. Matching by
       label works because both series were formatted by the same function. */
    const expenseByLabel = new Map(expenseSeries.map((e) => [e.name, e.value]));
    const mergedRevenue = revenueSeries.map((r) => ({
      name: r.name,
      revenue: r.value,
      income: r.value - (expenseByLabel.get(r.name) ?? 0),
    }));

    const distance = toSeries(data.charts.distance).map((d) => ({ ...d, distance: d.value }));

    return (
      <div className="space-y-6">
        <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RevealItem>
            <MetricCard title="Revenue" value={rupees(data.summary.revenue)} icon="revenue" />
          </RevealItem>
          <RevealItem>
            <MetricCard title="Total expenses" value={rupees(data.summary.totalExpenses)} icon="expenses" />
          </RevealItem>
          <RevealItem>
            <MetricCard title="Profit" value={rupees(data.summary.profit)} icon="profit" />
          </RevealItem>
          <RevealItem>
            <MetricCard title="Idle cost" value={rupees(data.summary.idleCost)} icon="labour" />
          </RevealItem>
        </RevealGroup>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RevenueChart
            data={mergedRevenue}
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod}
          />
          <ExpensesChart categories={data.charts.expenseCategories} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <DistanceChart
            data={distance}
            activePeriod={activePeriod}
            setActivePeriod={setActivePeriod}
          />
          <MetricsChart title="Idle cost" data={toSeries(data.charts.idle)} color={STATUS.warning} />
          <MetricsChart title="Fuel cost" data={toSeries(data.charts.fuel)} color={STATUS.good} />
        </div>
      </div>
    );
  };

  const renderDriverDashboard = () => (
    <div className="space-y-6">
      <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <RevealItem>
          <MetricCard title="Total trips" value="58" icon="trip" />
        </RevealItem>
        <RevealItem>
          <MetricCard title="Distance covered" value="14,300 km" icon="distance" />
        </RevealItem>
        <RevealItem>
          <MetricCard title="Fuel used" value="2,400 L" icon="fuel" />
        </RevealItem>
      </RevealGroup>

      <EmptyState
        title="Driver analytics are on the way"
        description="Your trip history and earnings breakdown will show up here once driver reporting ships."
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          role === "owner"
            ? "Revenue, cost and distance across your fleet."
            : "Your trips and activity at a glance."
        }
      />
      {role === "owner" ? renderOwnerDashboard() : renderDriverDashboard()}
    </div>
  );
}
