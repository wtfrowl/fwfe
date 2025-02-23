export type VehicleType = "Truck" | "Van" | "Car"
export type VehicleStatus = "Available" | "En Route" | "Out of Service"
export type AlertType = "Attention" | "All Good" | "Critical"

export interface Vehicle {
  _id: Key | null | undefined
  capacity: string
  model: string
  id: string
  registrationNumber: string
  type: VehicleType
  status: VehicleStatus
  healthRate: number
  alertType: AlertType
  available: boolean
}

