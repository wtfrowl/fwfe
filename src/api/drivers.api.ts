import api from './axios';
import { Driver } from './../types/trips';

export const getDrivers = (): Promise<Driver[]> => {
  return api.get('/api/driver/list');
};

export const getDriverById = (id: string): Promise<any> => {
    return api.get(`/api/driver/${id}`);
}

//add driver /api/auth/register-driver
export const createDriver = (data: any): Promise<any> => {
    return api.post('/api/auth/register-driver', data);
}