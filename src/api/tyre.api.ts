import api from './axios';
import type {
  ICreateTyrePayload,
  IDismountTyrePayload,
  IInspectTyrePayload,
  IMountTyrePayload,
  IMoveTyrePayload,
  ITyre,
} from '../types/tyre';

export const getTyres = (): Promise<ITyre[]> => {
  return api.get('/api/tyre/list');
};

export const getTyreById = (id: string): Promise<ITyre> => {
  return api.get(`/api/tyre/${id}`);
};

export const addTyre = (data: ICreateTyrePayload): Promise<ITyre> => {
  return api.post('/api/tyre', data);
};

/**
 * Tyres are bought in sets, so they are entered in sets. One request keeps the
 * whole set atomic: either the six go into inventory or none of them do, and
 * the caller never has to reconcile a half-added batch.
 */
export const addTyresBatch = (
  tyres: ICreateTyrePayload[]
): Promise<{ created: ITyre[]; skipped: Array<{ tyreNumber: string; reason: string }> }> => {
  return api.post('/api/tyre/batch', { tyres });
};

export const mountTyre = (data: IMountTyrePayload): Promise<{ message: string; tyre: ITyre }> => {
  return api.post('/api/tyre/mount', data);
};

export const dismountTyre = (
  data: IDismountTyrePayload
): Promise<{ message: string; tyre: ITyre }> => {
  return api.post('/api/tyre/dismount', data);
};

/**
 * Rotate or transfer a fitted tyre in one step. Doing this as
 * dismount-then-mount left the tyre in stock between two requests, and a
 * failure on the second call stranded it there.
 */
export const moveTyre = (data: IMoveTyrePayload): Promise<{ message: string; tyre: ITyre }> => {
  return api.post('/api/tyre/move', data);
};

export const updateTyreDetails = (id: string, data: Partial<ICreateTyrePayload>): Promise<ITyre> => {
  return api.patch(`/api/tyre/${id}`, data);
};

export const inspectTyre = (id: string, data: IInspectTyrePayload): Promise<ITyre> => {
  return api.patch(`/api/tyre/${id}/inspect`, data);
};
