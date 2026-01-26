import api from './axios';
import { ITyre } from '../types/tyre';

export const getTyres = (): Promise<ITyre[]> => {
  return api.get('/api/tyre/list');
};

export const mountTyre = (data: any): Promise<void> => {
  return api.post('/api/tyre/mount', data);
};

export const dismountTyre = (data: any): Promise<void> => {
  return api.post('/api/tyre/dismount', data);
};

export const addTyre = (data: any): Promise<void> => {
    return api.post('/api/tyre', data);
}

export const getTyreById = (id: string): Promise<ITyre> => {
    return api.get(`/api/tyre/${id}`);
}

export const updateTyreStatus = (id: string, status: string): Promise<void> => {
    return api.patch(`/api/tyre/update/status/${id}`, { status });
}

export const updateTyreDetails = (id: string, data: any): Promise<void> => {
    return api.patch(`/api/tyre/${id}`, data);
}


//inspect }/api/tyre/${id}/inspect
export const inspectTyre = (id: string, data: any): Promise<ITyre> => {
    return api.patch(`/api/tyre/${id}/inspect`, data);
}