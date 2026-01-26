import api from './axios';
import { ITruck, ITrucksResponse } from '../types/trucks';

export const getTrucks = (): Promise<ITrucksResponse> => {
  return api.get('/api/trucks');
};

export const getTruckByRegNo = (regNo: string): Promise<ITruck> => {
  return api.get(`/api/trucks/${regNo}`);
};

export const updateTruck = (id: string, data: Partial<ITruck>): Promise<ITruck> => {
  return api.patch(`/api/trucks/${id}`, data);
};

export const assignDriver = (truckId: string, driverId: string): Promise<void> => {
  return api.patch('/api/trucks/assign-driver', { truckId, driverId });
};

export const removeDriver = (truckId: string, driverId: string): Promise<void> => {
  return api.patch('/api/trucks/remove-driver', { truckId, driverId });
};

export const addTruck = (data: any): Promise<void> => {
    return api.post('/api/trucks', data);
}