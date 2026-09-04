/**
 * The one description of a document in the client.
 *
 * There used to be two — this file and `app/docs/types/docs.ts` — and they
 * disagreed, so every screen cast through `unknown` to get between them. The
 * second one had even grown `body` and `createElement` fields, absorbed from
 * a `document` variable that shadowed the DOM's.
 */

export const DOCUMENT_TYPES = [
  "RC",
  "Insurance",
  "Permit",
  "Fitness",
  "Pollution",
  "Other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Derived from the expiry date by the server, so every screen agrees. */
export type DocumentStatus = "expired" | "expiring" | "valid" | "no-expiry";

export interface FleetDocument {
  _id: string;
  name: string;
  /** Registration number of the truck this belongs to. */
  truckId: string;
  truck?: string;
  viewUrl: string;
  downloadUrl: string;
  type: DocumentType;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string | null;
  notes?: string;
  fileType?: string;
  fileSize?: number;
  version: number;
  isLatest: boolean;
  uploadedAt: string;
  uploadedBy: "owner" | "driver";
  uploaderId: string;
  ownerId: string;

  /* Server-computed, never stored — status depends on today's date. */
  status: DocumentStatus;
  daysToExpiry: number | null;
  /** How many versions this truck+type slot has. Only on list/detail reads. */
  versionCount?: number;
}

export interface PaginatedDocuments {
  documents: FleetDocument[];
  page: number;
  limit: number;
  totalPages: number;
  totalDocs: number;
}

export interface DocumentSummary {
  total: number;
  expired: number;
  expiring: number;
  valid: number;
  noExpiry: number;
  byType: Partial<Record<DocumentType, number>>;
  lastUploadedAt: string | null;
}

export interface DocumentQuery {
  page?: number;
  limit?: number;
  truckId?: string;
  type?: DocumentType | "";
  status?: DocumentStatus | "";
  search?: string;
  allVersions?: boolean;
}

export interface DocumentPayload {
  name: string;
  truckId: string;
  type: DocumentType | "";
  viewUrl: string;
  downloadUrl: string;
  documentNumber?: string;
  issueDate?: string;
  expiryDate?: string;
  notes?: string;
  fileType?: string;
  fileSize?: number;
}

export type DocumentPatch = Partial<
  Pick<DocumentPayload, "name" | "type" | "documentNumber" | "issueDate" | "expiryDate" | "notes">
>;

/** The trucks a document can be attached to, as the trucks API returns them. */
export interface DocumentTruck {
  _id: string;
  registrationNumber: string;
  model?: string;
}

/* The old exported names, kept so nothing outside this feature breaks. */
export type Document = FleetDocument;
export type Truck = DocumentTruck;
export type PaginatedDocumentResponse = PaginatedDocuments;
