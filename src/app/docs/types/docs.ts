export interface Document {
    body: any
    createElement(arg0: string): unknown
    notes: any
    expiryDate: string | number | Date
    version: number
    _id: string
    name: string
    truckId: string
    viewUrl: string
    downloadUrl: string
    uploadedAt: string
    type?: string
    uploadedBy?: string
    ownerId?: string
    createdAt?: string
    updatedAt?: string
    fileSize?: number
    fileType?: string
    description?: string
  }
export interface Truck {
    id: string
    registrationNumber: string
    model: string
    ownerId: string
    createdAt: string
    updatedAt: string
  }