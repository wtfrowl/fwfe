import api from "./axios"; // your interceptor-based axios

export const AnalyticsAPI = {
  getTruckAnalytics: () => api.get("/api/analytics/trucks").then(res => res),
  getRouteAnalytics: () => api.get("/api/analytics/route").then(res => res),
  getDriverAnalytics: () => api.get("/api/analytics/driver").then(res => res),
  getDriverRouteAnalytics: () => api.get("/api/analytics/driveronroute").then(res => res),
};
