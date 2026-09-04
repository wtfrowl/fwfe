import api from './axios';
import type {
  DocumentPatch,
  DocumentPayload,
  DocumentQuery,
  DocumentSummary,
  DocumentTruck,
  FleetDocument,
  PaginatedDocuments,
} from '../types/docs';

/**
 * The axios instance unwraps `response.data`, so every function here resolves
 * to the body the server sent — not an AxiosResponse. The old signatures said
 * so too, which is why callers could get away with the casts they were doing.
 */

/** Drops empty filters so the request URL says only what was actually asked. */
const clean = (params: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

export const getDocuments = (query: DocumentQuery = {}): Promise<PaginatedDocuments> =>
  api.get('/api/docs', { params: clean({ page: 1, limit: 15, ...query }) });

export const getDocumentSummary = (): Promise<DocumentSummary> => api.get('/api/docs/summary');

export const getDocumentById = (id: string): Promise<FleetDocument> => api.get(`/api/docs/${id}`);

export const getDocumentHistory = (
  id: string,
  page = 1,
  limit = 15
): Promise<PaginatedDocuments> => api.get(`/api/docs/${id}/history`, { params: { page, limit } });

export const addDocument = (
  data: DocumentPayload
): Promise<{ message: string; isNewVersion: boolean; document: FleetDocument }> =>
  api.post('/api/docs', data);

export const updateDocument = (
  id: string,
  data: DocumentPatch
): Promise<{ message: string; document: FleetDocument }> => api.patch(`/api/docs/${id}`, data);

export const deleteDocument = (
  id: string
): Promise<{ message: string; promotedTo: { _id: string; version: number } | null }> =>
  api.delete(`/api/docs/${id}`);

/**
 * Trucks, as the picker needs them.
 *
 * Documents are keyed by registration number, so this normalises the truck
 * list to exactly that. The Documents page previously read `truck.id`, which
 * the trucks API has never returned — so every truck filter option had an
 * `undefined` value and the truck column on every row read "—".
 */
export const getDocumentTrucks = async (): Promise<DocumentTruck[]> => {
  const res = (await api.get('/api/trucks')) as unknown as { trucks?: DocumentTruck[] };
  return (res?.trucks ?? []).filter((t) => Boolean(t?.registrationNumber));
};
