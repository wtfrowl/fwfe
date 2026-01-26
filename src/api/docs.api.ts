import api from './axios';
import { Document, PaginatedDocumentResponse } from './../types/docs';

export const getDocuments = (page = 1, limit = 15): Promise<PaginatedDocumentResponse> => {
  return api.get('/api/docs/allDocs', {
    params: { page, limit },
  });
};

export const getDocumentHistory = (id: string, page: number, limit: number): Promise<PaginatedDocumentResponse> => {
  return api.get(`/api/docs/getDoc/history/${id}`, {
    params: { page, limit },
  });
};

export const getDocumentById = (id: string): Promise<Document> => {
  return api.get(`/api/docs/getDoc/${id}`);
};

export const addDocument = (data: {
  name: string;
  truckId: string;
  viewUrl: string;
  downloadUrl: string;
  type: string;
}): Promise<void> => {
  return api.post('/api/docs/addDoc', data);
};
