export interface TruckTrip {
    id: string
    truckId: string
    departure: string
    arrival: string
    status: "Completed" | "In Progress" | "Cancelled"
    weight: number
    fare: number
    expenses?: any
  }
  
  export interface TruckDetails {
    id: string
    location: string
    lastUpdated: string
    stoppedDuration?: string
    ignition: "ON" | "OFF"
    currentSpeed: number
    travelledToday: number
    trips: TruckTrip[]
  }
  
  // Add the necessary imports and types above

export interface CurrentTrip {
  id: string;
  driverContactNumber: string;
  status: string;
  departureDateTime: string;
  speed: number;
  departureLocation: string;
  arrivalLocation: string;
}