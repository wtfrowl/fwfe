import { useEffect, useMemo, useState } from "react";
import { FaArrowTrendUp, FaRoute, FaTriangleExclamation, FaTruck, FaUserTie } from "react-icons/fa6";
import { useLocation, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import { AnalyticsAPI } from "../../api/analytics.api";
import type {
  DriverAnalytics,
  DriverRouteAnalytics,
  LaneAlerts,
  LaneAssignment,
  RouteAnalytics,
  TruckAnalytics,
} from "../../types/analytics";
import DriverAnalyticsTable from "./components/DriverAnalyticsTable";
import DriverRouteAnalyticsTable from "./components/DriverRouteAnalyticsTable";
import RouteAnalyticsTable from "./components/RouteAnalyticsTable";
import TruckAnalyticsTable from "./components/TruckAnalyticsTable";
import LaneAssignmentTable from "./components/LaneAssignmentTable";
import { PageHeader } from "../../components/ui/PageHeader";
import { InlineMessage } from "../../components/ui/InlineMessage";
import { SegmentedControl, type Segment } from "../../components/ui/SegmentedControl";
import { RevealGroup, RevealItem } from "../../motion/Reveal";
import { cn } from "../../utils/cn";

type AnalyticsResponseTuple = [
  TruckAnalytics[],
  RouteAnalytics[],
  DriverAnalytics[],
  DriverRouteAnalytics[],
  LaneAssignment[],
  LaneAlerts,
];

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;
const formatDistance = (value: number) => `${value.toLocaleString("en-IN")} km`;
const formatHours = (value: number) => `${value.toFixed(1)} hrs`;

const profitTone = (value: number) => (value >= 0 ? "text-positive-ink" : "text-critical-ink");

type SectionId =
  | "analytics-overview"
  | "fleet-analytics"
  | "route-analytics"
  | "driver-analytics"
  | "driver-route-analytics"
  | "lane-assignment";

function SectionCard({
  id,
  title,
  subtitle,
  meta,
  children,
}: {
  id: SectionId;
  title: string;
  subtitle: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    /* `scroll-mt` replaces the old hand-computed 120px header offset in a
       `window.scrollTo` — the browser now handles the anchor itself, and it
       stays correct when the header height changes. */
    <section id={id} className="scroll-mt-28 space-y-3">
      <div className="flex flex-col gap-1 md:flex-row md:items-baseline md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-sm text-ink-secondary">{subtitle}</p>
        </div>
        {meta ? (
          <span className="text-caption text-xs font-semibold uppercase text-ink-tertiary">
            {meta}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function HighlightCard({
  label,
  icon: Icon,
  headline,
  value,
  tone,
  note,
}: {
  label: string;
  icon: IconType;
  headline: string;
  value: string;
  tone?: string;
  note: string;
}) {
  return (
    <div className="h-full rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
      <div className="flex items-center justify-between gap-2">
        <p className="text-caption text-sm text-ink-secondary">{label}</p>
        <Icon className="h-4 w-4 shrink-0 text-ink-quaternary" />
      </div>
      <p className="mt-3 truncate text-base font-semibold text-ink">{headline}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums", tone ?? "text-ink")}>{value}</p>
      <p className="mt-1 text-xs text-ink-tertiary">{note}</p>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [trucks, setTrucks] = useState<TruckAnalytics[]>([]);
  const [routes, setRoutes] = useState<RouteAnalytics[]>([]);
  const [drivers, setDrivers] = useState<DriverAnalytics[]>([]);
  const [driverRoutes, setDriverRoutes] = useState<DriverRouteAnalytics[]>([]);
  const [bestPerLane, setBestPerLane] = useState<LaneAssignment[]>([]);
  const [lossMakers, setLossMakers] = useState<LaneAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const [trucksRes, routesRes, driversRes, driverRoutesRes, bestRes, worstRes] =
          (await Promise.all([
            AnalyticsAPI.getTruckAnalytics(),
            AnalyticsAPI.getRouteAnalytics(),
            AnalyticsAPI.getDriverAnalytics(),
            AnalyticsAPI.getDriverRouteAnalytics(),
            AnalyticsAPI.getBestDriverPerRoute(),
            AnalyticsAPI.getWorstDriverPerRoute(),
          ])) as unknown as AnalyticsResponseTuple;

        setTrucks(trucksRes ?? []);
        setRoutes(routesRes ?? []);
        setDrivers(driversRes ?? []);
        setDriverRoutes(driverRoutesRes ?? []);
        setBestPerLane(bestRes ?? []);
        setLossMakers(worstRes?.alerts ?? []);
      } catch (loadError) {
        console.error("Failed to load analytics:", loadError);
        setError("Analytics could not be loaded right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  useEffect(() => {
    if (!location.hash || loading) return;
    const element = document.getElementById(location.hash.replace("#", ""));
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, loading]);

  const overview = useMemo(() => {
    const sum = (key: keyof RouteAnalytics) =>
      routes.reduce((total, route) => total + (Number(route[key]) || 0), 0);

    return {
      totalTrips: sum("totalTrips"),
      totalRevenue: sum("totalRevenue"),
      totalExpense: sum("totalExpense"),
      totalProfit: sum("profit"),
      totalDistance: sum("totalDistance"),
      topTruck: [...trucks].sort((a, b) => b.profit - a.profit)[0],
      topRoute: [...routes].sort((a, b) => b.profitPerKm - a.profitPerKm)[0],
      topDriver: [...drivers].sort((a, b) => b.profit - a.profit)[0],
      topDriverRoute: [...driverRoutes].sort((a, b) => b.profit - a.profit)[0],
    };
  }, [driverRoutes, drivers, routes, trucks]);

  const sections: Segment<SectionId>[] = [
    { label: "Overview", value: "analytics-overview" },
    { label: "Fleet", value: "fleet-analytics" },
    { label: "Routes", value: "route-analytics" },
    { label: "Drivers", value: "driver-analytics" },
    { label: "Driver × route", value: "driver-route-analytics" },
    { label: "Lane assignment", value: "lane-assignment" },
  ];

  const activeSection = (location.hash.replace("#", "") || "analytics-overview") as SectionId;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="h-9 w-56 animate-pulse rounded-chip bg-ink/8" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-card bg-ink/6" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-card bg-ink/6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl space-y-5">
        <PageHeader title="Analytics" />
        <InlineMessage tone="error">{error}</InlineMessage>
      </div>
    );
  }

  const margin =
    overview.totalRevenue > 0
      ? `${Math.max(0, (overview.totalProfit / overview.totalRevenue) * 100).toFixed(1)}%`
      : "0%";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* The old header was a dark cyan gradient hero with four glass tiles on
          it — a second, competing design language bolted onto one page. The
          numbers are the same; they now live in the same kind of tile as
          every other number in the app. */}
      <PageHeader
        title="Analytics"
        description="Where your margin actually comes from — by truck, route and driver."
      />

      <div className="sticky top-16 z-10 -mx-1 px-1 py-2">
        <SegmentedControl
          segments={sections}
          value={activeSection}
          onChange={(id) => navigate({ hash: `#${id}` })}
          className="material-thin shadow-[var(--shadow-hairline)] ring-1 ring-hairline"
        />
      </div>

      <section id="analytics-overview" className="scroll-mt-28 space-y-4">
        <RevealGroup className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <RevealItem>
            <div className="h-full rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
              <p className="text-caption text-sm text-ink-secondary">Trips</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
                {overview.totalTrips.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-ink-tertiary">{routes.length} route patterns</p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="h-full rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
              <p className="text-caption text-sm text-ink-secondary">Revenue</p>
              <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
                {formatCurrency(overview.totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-ink-tertiary">Across tracked trips</p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="h-full rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
              <p className="text-caption text-sm text-ink-secondary">Profit</p>
              <p
                className={cn(
                  "mt-1 truncate text-2xl font-semibold tabular-nums tracking-[-0.02em]",
                  profitTone(overview.totalProfit)
                )}
              >
                {formatCurrency(overview.totalProfit)}
              </p>
              <p className="mt-1 text-xs text-ink-tertiary">{margin} of revenue kept</p>
            </div>
          </RevealItem>
          <RevealItem>
            <div className="h-full rounded-card border border-hairline bg-surface p-5 shadow-[var(--shadow-raised)]">
              <p className="text-caption text-sm text-ink-secondary">Distance</p>
              <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink">
                {formatDistance(overview.totalDistance)}
              </p>
              <p className="mt-1 text-xs text-ink-tertiary">Completed mileage</p>
            </div>
          </RevealItem>
        </RevealGroup>

        {lossMakers.length > 0 && (
          <RevealGroup className="grid grid-cols-1 gap-4">
            <RevealItem className="h-full">
              <HighlightCard
                label="Needs attention"
                icon={FaTriangleExclamation}
                headline={`${lossMakers[0].driver.firstName} ${lossMakers[0].driver.lastName} · ${lossMakers[0].route}`}
                value={`₹${lossMakers[0].profitPerKm.toFixed(2)} / km`}
                tone="text-critical-ink"
                note={`Worst of ${lossMakers.length} pairing${
                  lossMakers.length === 1 ? "" : "s"
                } running at a loss — see Lane assignment`}
              />
            </RevealItem>
          </RevealGroup>
        )}

        <RevealGroup className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <RevealItem className="h-full">
            <HighlightCard
              label="Best truck by profit"
              icon={FaTruck}
              headline={overview.topTruck?._id ?? "No truck data"}
              value={overview.topTruck ? formatCurrency(overview.topTruck.profit) : "—"}
              tone={overview.topTruck ? profitTone(overview.topTruck.profit) : undefined}
              note={
                overview.topTruck
                  ? `${overview.topTruck.totalTrips} trips tracked`
                  : "Add trip history to unlock this"
              }
            />
          </RevealItem>
          <RevealItem className="h-full">
            <HighlightCard
              label="Strongest route margin"
              icon={FaRoute}
              headline={overview.topRoute?.route ?? "No route data"}
              value={
                overview.topRoute ? `₹${overview.topRoute.profitPerKm.toFixed(2)} / km` : "—"
              }
              tone={overview.topRoute ? profitTone(overview.topRoute.profitPerKm) : undefined}
              note={
                overview.topRoute
                  ? `${overview.topRoute.totalTrips} trips on this lane`
                  : "Route analytics will appear here"
              }
            />
          </RevealItem>
          <RevealItem className="h-full">
            <HighlightCard
              label="Top driver contribution"
              icon={FaUserTie}
              headline={
                overview.topDriver
                  ? `${overview.topDriver.driver.firstName} ${overview.topDriver.driver.lastName}`
                  : "No driver data"
              }
              value={overview.topDriver ? formatCurrency(overview.topDriver.profit) : "—"}
              tone={overview.topDriver ? profitTone(overview.topDriver.profit) : undefined}
              note={
                overview.topDriver
                  ? `${formatHours(overview.topDriver.avgTripDurationHours)} average trip`
                  : "Driver insights will appear here"
              }
            />
          </RevealItem>
          <RevealItem className="h-full">
            <HighlightCard
              label="Best driver × route pair"
              icon={FaArrowTrendUp}
              headline={
                overview.topDriverRoute
                  ? `${overview.topDriverRoute.driver.firstName} · ${overview.topDriverRoute.route}`
                  : "No pair data"
              }
              value={
                overview.topDriverRoute ? formatCurrency(overview.topDriverRoute.profit) : "—"
              }
              tone={
                overview.topDriverRoute ? profitTone(overview.topDriverRoute.profit) : undefined
              }
              note={
                overview.topDriverRoute
                  ? `${overview.topDriverRoute.totalTrips} trips together`
                  : "Driver-route trends will appear here"
              }
            />
          </RevealItem>
        </RevealGroup>
      </section>

      <SectionCard
        id="fleet-analytics"
        title="Fleet performance"
        subtitle="Truck-level productivity, earnings and cost efficiency."
        meta={`${trucks.length} trucks`}
      >
        <TruckAnalyticsTable data={trucks} />
      </SectionCard>

      <SectionCard
        id="route-analytics"
        title="Route performance"
        subtitle="Which lanes produce healthy margins, and which need review."
        meta={`${routes.length} routes`}
      >
        <RouteAnalyticsTable data={routes} />
      </SectionCard>

      <SectionCard
        id="driver-analytics"
        title="Driver contribution"
        subtitle="Workload, profitability and average trip duration per driver."
        meta={`${drivers.length} drivers`}
      >
        <DriverAnalyticsTable data={drivers} />
      </SectionCard>

      <SectionCard
        id="driver-route-analytics"
        title="Driver and route combinations"
        subtitle="Which pairings create the strongest operational outcomes."
        meta={`${driverRoutes.length} assignments`}
      >
        <DriverRouteAnalyticsTable data={driverRoutes} />
      </SectionCard>

      {/* The decision the rest of this page is evidence for: who runs which
          lane next. The loss-making list comes first deliberately — it is the
          one with money already leaking out of it. */}
      <SectionCard
        id="lane-assignment"
        title="Lane assignment"
        subtitle="Who to put on each route, and which pairings to stop repeating."
        meta={
          lossMakers.length
            ? `${lossMakers.length} losing money`
            : `${bestPerLane.length} lanes ranked`
        }
      >
        <div className="space-y-4">
          {lossMakers.length > 0 && (
            <InlineMessage tone="warning">
              {lossMakers.length === 1
                ? "One driver-route pairing is running at a loss per kilometre."
                : `${lossMakers.length} driver-route pairings are running at a loss per kilometre.`}{" "}
              Ranked worst first.
            </InlineMessage>
          )}
          <LaneAssignmentTable data={lossMakers} variant="worst" />
          <LaneAssignmentTable data={bestPerLane} variant="best" />
        </div>
      </SectionCard>
    </div>
  );
}
