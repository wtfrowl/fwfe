import { ReactNode } from "react"

export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
  }
  
  export interface Driver {
    firstName: string
    lastName: string
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
  
  export interface Document {
    id: string
    name: string
    truckId: string
    uploadedAt: string // ISO date string
    viewUrl: string     // For opening the document in a new tab
    downloadUrl: string // For downloading the document
    type?: string       // Optional: e.g. 'Insurance', 'Permit', 'RC'
    uploadedBy?: string // Optional: user/admin who uploaded
    fileSize?: number   // Optional: in bytes
  }
  