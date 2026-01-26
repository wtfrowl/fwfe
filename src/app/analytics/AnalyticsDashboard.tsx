import { useEffect, useState } from "react";
import { AnalyticsAPI } from "../../api/analytics.api";
import {
  TruckAnalytics,
  RouteAnalytics,
  DriverAnalytics,
  DriverRouteAnalytics
} from "../../types/analytics";

import TruckAnalyticsTable from "./components/TruckAnalyticsTable";
import RouteAnalyticsTable from "./components/RouteAnalyticsTable";
import DriverAnalyticsTable from "./components/DriverAnalyticsTable";
import DriverRouteAnalyticsTable from "./components/DriverRouteAnalyticsTable";

export default function AnalyticsDashboard() {
  const [trucks, setTrucks] = useState<TruckAnalytics[]>([]);
  const [routes, setRoutes] = useState<RouteAnalytics[]>([]);
  const [drivers, setDrivers] = useState<DriverAnalytics[]>([]);
  const [driverRoutes, setDriverRoutes] = useState<DriverRouteAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const [
          trucksRes,
          routesRes,
          driversRes,
          driverRoutesRes
        ]:any= await Promise.all([
          AnalyticsAPI.getTruckAnalytics(),
          AnalyticsAPI.getRouteAnalytics(),
          AnalyticsAPI.getDriverAnalytics(),
          AnalyticsAPI.getDriverRouteAnalytics(),
        ]);


        console.log("Analytics data loaded:", {
          trucksRes,
          routesRes,
          driversRes,
          driverRoutesRes
        });

        setTrucks(trucksRes);
        setRoutes(routesRes);
        setDrivers(driversRes);
        setDriverRoutes(driverRoutesRes);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading analytics…</div>;
  }

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-semibold">📊 Analytics</h1>

      <TruckAnalyticsTable data={trucks} />
      <RouteAnalyticsTable data={routes} />
      <DriverAnalyticsTable data={drivers} />
      <DriverRouteAnalyticsTable data={driverRoutes} />
    </div>
  );
}
