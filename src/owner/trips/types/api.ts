export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
  }
  
  export interface Driver {
    contactNumber: string | number | readonly string[] | undefined
    availability: boolean
    _id: string
    name: string
    phone: string
    licenseNumber: string
    status: "active" | "inactive"
  }
  
  export interface Truck {
    available: boolean
    _id: string
    registrationNumber: string
    model: string
    status: "En Route" | "Available" |"Out of Service"
  }
  
  export interface Trip {
    arrivalLocation: ReactNode
    departureLocation: ReactNode
    registrationNumber: ReactNode
    _id: string
    departure: string
    arrival: string
    status: "Running" | "Completed" | "Cancelled"
    fare: number
    startDate: string
    endDate: string
    weight: number
    driver: Driver
    truck: Truck
  }
  
  