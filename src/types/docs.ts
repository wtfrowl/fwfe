export interface Document {
  _id: string;
  name: string;
  truckId: string;
  viewUrl: string;
  downloadUrl: string;
  type: string;
  uploadedAt: string;
  expiryDate?: string;
}

export interface Truck {
  id: string;
  registrationNumber: string;
}

export interface PaginatedDocumentResponse {
  length: number;
  documents: Document[];
  page: number;
  totalPages: number;
  totalDocs: number;
}
