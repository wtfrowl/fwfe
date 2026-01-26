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
