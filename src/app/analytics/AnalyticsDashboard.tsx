import { useEffect, useMemo, useState } from "react";
import { FaArrowTrendUp, FaRoute, FaTruck, FaUserTie } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import { AnalyticsAPI } from "../../api/analytics.api";
import {
  DriverAnalytics,
  DriverRouteAnalytics,
  RouteAnalytics,
  TruckAnalytics,
} from "../../types/analytics";
import DriverAnalyticsTable from "./components/DriverAnalyticsTable";
import DriverRouteAnalyticsTable from "./components/DriverRouteAnalyticsTable";
import RouteAnalyticsTable from "./components/RouteAnalyticsTable";
import TruckAnalyticsTable from "./components/TruckAnalyticsTable";

type AnalyticsResponseTuple = [
  TruckAnalytics[],
  RouteAnalytics[],
  DriverAnalytics[],
  DriverRouteAnalytics[],
];

function formatCurrency(value: number) {
  return `Rs ${value.toLocaleString()}`;
}

function formatDistance(value: number) {
  return `${value.toLocaleString()} km`;
}

function formatHours(value: number) {
  return `${value.toFixed(1)} hrs`;
}

function getProfitTone(value: number) {
  return value >= 0 ? "text-emerald-600" : "text-red-600";
}

function SectionCard({
  id,
  title,
  subtitle,
  accentClass,
  meta,
  children,
}: {
  id: string;
  title: string;
  subtitle: string;
  accentClass: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className={`h-1.5 ${accentClass}`} />
      <div className="border-b border-gray-100 px-6 py-5">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          {meta ? <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{meta}</span> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function AnalyticsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<TruckAnalytics[]>([]);
  const [routes, setRoutes] = useState<RouteAnalytics[]>([]);
  const [drivers, setDrivers] = useState<DriverAnalytics[]>([]);
  const [driverRoutes, setDriverRoutes] = useState<DriverRouteAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [trucksRes, routesRes, driversRes, driverRoutesRes] = (await Promise.all([
          AnalyticsAPI.getTruckAnalytics(),
          AnalyticsAPI.getRouteAnalytics(),
          AnalyticsAPI.getDriverAnalytics(),
          AnalyticsAPI.getDriverRouteAnalytics(),
        ])) as unknown as AnalyticsResponseTuple;

        setTrucks(trucksRes);
        setRoutes(routesRes);
        setDrivers(driversRes);
        setDriverRoutes(driverRoutesRes);
      } catch (loadError) {
        console.error("Failed to load analytics:", loadError);
        setError("Analytics data could not be loaded right now.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const id = location.hash.replace("#", "");
    const scrollToSection = () => {
      const element = document.getElementById(id);
      if (!element) return;

      const headerOffset = 120;
      const elementTop = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementTop - headerOffset),
        behavior: "smooth",
      });
    };

    const frame = window.requestAnimationFrame(scrollToSection);
    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, loading]);

  const overview = useMemo(() => {
    const totalTrips = routes.reduce((sum, route) => sum + route.totalTrips, 0);
    const totalRevenue = routes.reduce((sum, route) => sum + route.totalRevenue, 0);
    const totalExpense = routes.reduce((sum, route) => sum + route.totalExpense, 0);
    const totalProfit = routes.reduce((sum, route) => sum + route.profit, 0);
    const totalDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0);

    const topTruck = [...trucks].sort((a, b) => b.profit - a.profit)[0];
    const topRoute = [...routes].sort((a, b) => b.profitPerKm - a.profitPerKm)[0];
    const topDriver = [...drivers].sort((a, b) => b.profit - a.profit)[0];
    const topDriverRoute = [...driverRoutes].sort((a, b) => b.profit - a.profit)[0];

    return {
      totalTrips,
      totalRevenue,
      totalExpense,
      totalProfit,
      totalDistance,
      topTruck,
      topRoute,
      topDriver,
      topDriverRoute,
    };
  }, [driverRoutes, drivers, routes, trucks]);

  const navItems = [
    { label: "Overview", href: "#analytics-overview" },
    { label: "Fleet", href: "#fleet-analytics" },
    { label: "Routes", href: "#route-analytics" },
    { label: "Drivers", href: "#driver-analytics" },
    { label: "Driver x Route", href: "#driver-route-analytics" },
  ];

  const handleAnchorClick = (hash: string) => {
    navigate({ hash });
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 h-10 w-72 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-8 w-32 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-3 w-24 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500 shadow-sm">
          Loading analytics...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <h1 className="text-xl font-semibold">Analytics unavailable</h1>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <section id="analytics-overview" className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-6 py-8 text-white md:px-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200">FleetWise Analytics</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Operational insight for trucks, routes, and driver performance
              </h1>
              <p className="mt-3 text-sm text-slate-200 md:text-base">
                Use this page to spot your most profitable fleet assets, compare route efficiency, and see where driver performance is helping or hurting margins.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:min-w-[520px]">
              {[
                {
                  label: "Trips",
                  value: overview.totalTrips.toLocaleString(),
                  note: `${routes.length} active route patterns`,
                },
                {
                  label: "Revenue",
                  value: formatCurrency(overview.totalRevenue),
                  note: "Across tracked analytics",
                },
                {
                  label: "Profit",
                  value: formatCurrency(overview.totalProfit),
                  note: "After recorded expenses",
                },
                {
                  label: "Distance",
                  value: formatDistance(overview.totalDistance),
                  note: "All completed route mileage",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-300">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-slate-300">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 bg-slate-50 px-6 py-4 md:px-8">
          <div className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <button
                key={item.href}
                type="button"
                onClick={() => handleAnchorClick(item.href)}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-cyan-300 hover:text-cyan-700"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Best Truck by Profit</p>
            <FaTruck className="text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900">{overview.topTruck?._id ?? "No truck data"}</p>
          <p className={`mt-2 text-sm font-semibold ${getProfitTone(overview.topTruck?.profit ?? 0)}`}>
            {overview.topTruck ? formatCurrency(overview.topTruck.profit) : "No profit data"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {overview.topTruck ? `${overview.topTruck.totalTrips} trips tracked` : "Add trip history to unlock this insight"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Strongest Route Margin</p>
            <FaRoute className="text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900">{overview.topRoute?.route ?? "No route data"}</p>
          <p className={`mt-2 text-sm font-semibold ${getProfitTone(overview.topRoute?.profitPerKm ?? 0)}`}>
            {overview.topRoute ? `Rs ${overview.topRoute.profitPerKm.toFixed(2)} / km` : "No margin data"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {overview.topRoute ? `${overview.topRoute.totalTrips} trips on this lane` : "Route analytics will appear here"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Top Driver Contribution</p>
            <FaUserTie className="text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            {overview.topDriver ? `${overview.topDriver.driver.firstName} ${overview.topDriver.driver.lastName}` : "No driver data"}
          </p>
          <p className={`mt-2 text-sm font-semibold ${getProfitTone(overview.topDriver?.profit ?? 0)}`}>
            {overview.topDriver ? formatCurrency(overview.topDriver.profit) : "No profit data"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {overview.topDriver ? `${formatHours(overview.topDriver.avgTripDurationHours)} average trip time` : "Driver insights will appear here"}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Highest Driver x Route Pair</p>
            <FaArrowTrendUp className="text-slate-400" />
          </div>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            {overview.topDriverRoute ? `${overview.topDriverRoute.driver.firstName} on ${overview.topDriverRoute.route}` : "No pair data"}
          </p>
          <p className={`mt-2 text-sm font-semibold ${getProfitTone(overview.topDriverRoute?.profit ?? 0)}`}>
            {overview.topDriverRoute ? formatCurrency(overview.topDriverRoute.profit) : "No pair profit data"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {overview.topDriverRoute ? `${overview.topDriverRoute.totalTrips} trips in this combination` : "Driver-route trends will appear here"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">What to focus on next</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Margin health</p>
              <p className={`mt-2 text-lg font-semibold ${getProfitTone(overview.totalProfit)}`}>{formatCurrency(overview.totalProfit)}</p>
              <p className="mt-1 text-sm text-gray-500">Total profit across the analyzed fleet period.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Revenue coverage</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">
                {overview.totalRevenue > 0 ? `${Math.max(0, ((overview.totalProfit / overview.totalRevenue) * 100)).toFixed(1)}%` : "0%"}
              </p>
              <p className="mt-1 text-sm text-gray-500">Share of revenue retained after expenses.</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Network footprint</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{routes.length} routes</p>
              <p className="mt-1 text-sm text-gray-500">Distinct route lanes with analytics history.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Quick reading guide</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-600">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              Positive profit and profit per km indicate healthier lanes and asset usage.
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              Compare cost per km across trucks and drivers to spot inefficient trip execution.
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
              Use the driver x route section to assign the right driver to the right lane.
            </div>
          </div>
        </div>
      </div>

      <SectionCard
        id="fleet-analytics"
        title="Fleet performance"
        subtitle="Compare truck-level productivity, earnings, and cost efficiency."
        accentClass="bg-cyan-500"
        meta={`${trucks.length} trucks tracked`}
      >
        <TruckAnalyticsTable data={trucks} />
      </SectionCard>

      <SectionCard
        id="route-analytics"
        title="Route performance"
        subtitle="See which routes produce healthy margins and which lanes need closer review."
        accentClass="bg-blue-500"
        meta={`${routes.length} route corridors`}
      >
        <RouteAnalyticsTable data={routes} />
      </SectionCard>

      <SectionCard
        id="driver-analytics"
        title="Driver contribution"
        subtitle="Understand workload, profitability, and average trip duration per driver."
        accentClass="bg-emerald-500"
        meta={`${drivers.length} driver profiles`}
      >
        <DriverAnalyticsTable data={drivers} />
      </SectionCard>

      <SectionCard
        id="driver-route-analytics"
        title="Driver and route combinations"
        subtitle="Identify which driver-route pairings create the strongest operational outcomes."
        accentClass="bg-amber-400"
        meta={`${driverRoutes.length} route assignments`}
      >
        <DriverRouteAnalyticsTable data={driverRoutes} />
      </SectionCard>
    </div>
  );
}
