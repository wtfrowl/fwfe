export type TripStatus = "Running" | "Completed" | "Cancelled"

export interface Trip {
  id: string
  departure: string
  arrival: string
  status: TripStatus
  fare: number
  startDate: string
  endDate: string
  weight: number
  driverId: string
  truckId: string
}

export interface Driver {
  id: string
  name: string
}

export interface Truck {
  id: string
  number: string
}

