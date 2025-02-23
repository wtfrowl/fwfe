export interface TruckTrip {
    id: string
    truckId: string
    departure: string
    arrival: string
    status: "Completed" | "In Progress" | "Cancelled"
    weight: number
    fare: number
    expenses?: number
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
  
  