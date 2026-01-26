import api from './axios';
import { Trip } from './../types/trips';

export const getTrips = (): Promise<Trip[]> => {
  return api.get('/api/trips/tripList');
};

export const createTrip = (data: any): Promise<Trip> => {
  return api.post('/api/trips', data);
};

export const updateTrip = (id: string, data: any): Promise<Trip> => {
  return api.patch(`/api/trips/trip/${id}`, data);
};

export const deleteTrip = (id: string): Promise<void> => {
  return api.delete(`/api/trips/${id}`);
};

export const getTripById = (id: string): Promise<Trip> => {
  return api.get(`/api/trips/byTripId/${id}`);
};

export const updateTripStatus = (id: string, payload: any): Promise<Trip> => {
  return api.patch(`/api/trips/updateStatus/${id}`, payload);
};

export const createExpense = (data: any): Promise<any> => {
  return api.post('/api/tripexpense', data);
};

export const updateTripDates = (id: string, payload: any): Promise<Trip> => {
  return api.patch(`/api/trips/updateDates/${id}`, payload);
};

export const approveExpense = (expenseId: string): Promise<any> => {
    return api.patch(`/api/tripexpense/${expenseId}/approve`, {});
}