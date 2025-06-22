export interface Document {
    _id: string
    name: string
    truckId: string
    viewUrl: string
    downloadUrl: string
    uploadedAt: string
    type?: string
  }
export interface Truck {
    id: string
    registrationNumber: string
    model: string
    ownerId: string
    createdAt: string
    updatedAt: string
  }