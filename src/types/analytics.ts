export interface TruckAnalytics {
  _id: string; // registrationNumber
  totalTrips: number;
  totalRevenue: number;
  totalDistance: number;
  totalExpense: number;
  dieselExpense: number;
  profit: number;
  costPerKm: number;
  profitPerKm: number;
  truck: {
    model: string;
    capacity: number;
    status: string;
    registrationNumber: string;
  };
}

export interface RouteAnalytics {
  route: string;
  totalTrips: number;
  totalRevenue: number;
  totalDistance: number;
  totalExpense: number;
  profit: number;
  costPerKm: number;
  profitPerKm: number;
}

export interface DriverAnalytics {
  totalTrips: number;
  totalRevenue: number;
  totalDistance: number;
  totalExpense: number;
  profit: number;
  costPerKm: number;
  avgTripDurationHours: number;
  routes: string[];
  driver: {
    firstName: string;
    lastName: string;
    contactNumber: string;
  };
}

export interface DriverRouteAnalytics {
  route: string;
  totalTrips: number;
  profit: number;
  profitPerKm: number;
  avgTripDurationHours: number;
  driver: {
    firstName: string;
    lastName: string;
  };
}

/**
 * One driver's record on one lane.
 *
 * The best- and worst-per-route endpoints return the same row shape, so the
 * two tables that render them share a type and a column set — only the sort
 * direction and the framing differ.
 */
export interface LaneAssignment {
  route: string;
  totalTrips: number;
  revenue: number;
  expense: number;
  distance: number;
  profit: number;
  profitPerKm: number;
  driver: {
    _id: string;
    firstName: string;
    lastName: string;
    contactNumber?: string;
  };
}

/** The worst-per-route endpoint wraps its rows with a count. */
export interface LaneAlerts {
  alertCount: number;
  alerts: LaneAssignment[];
}
