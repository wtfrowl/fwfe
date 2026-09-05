import api from "./axios"; // your interceptor-based axios

export const AnalyticsAPI = {
  getTruckAnalytics: () => api.get("/api/analytics/trucks").then(res => res),
  getRouteAnalytics: () => api.get("/api/analytics/route").then(res => res),
  getDriverAnalytics: () => api.get("/api/analytics/driver").then(res => res),
  getDriverRouteAnalytics: () => api.get("/api/analytics/driveronroute").then(res => res),

  /* Lane assignment.
     Both of these existed on the server with full aggregation pipelines and
     no route, so the question they answer — "who should run this lane, and
     which pairing is losing me money on it" — had no way to be asked.

     `minTrips` is the sample size a pairing needs before it is ranked; one
     good run is not a track record. */
  getBestDriverPerRoute: (minTrips = 3) =>
    api.get("/api/analytics/driver/best-per-route", { params: { minTrips } }).then(res => res),

  /* `lossPerKm` is the ceiling a pairing has to fall below to count as an
     alert. Zero means "only flag lanes that actually lose money". */
  getWorstDriverPerRoute: (minTrips = 3, lossPerKm = 0) =>
    api
      .get("/api/analytics/driver/worst-per-route", { params: { minTrips, lossPerKm } })
      .then(res => res),
};

/**
 * Cost series, split by kind.
 *
 * The owner dashboard gets all of these pre-bundled from `/api/stats/all`;
 * these are the individually addressable versions, for a screen that wants one
 * series without paying for the whole summary.
 */
export const StatsAPI = {
  getFuel: (period: string) => api.get("/api/stats/fuel", { params: { period } }).then(res => res),
  getIdle: (period: string) => api.get("/api/stats/idle", { params: { period } }).then(res => res),
  getDistance: (period: string) =>
    api.get("/api/stats/distance", { params: { period } }).then(res => res),
  getExpenses: (period: string) =>
    api.get("/api/stats/expenses", { params: { period } }).then(res => res),
  getRevenue: (period: string) =>
    api.get("/api/stats/revenue", { params: { period } }).then(res => res),
};
