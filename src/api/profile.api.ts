import api from './axios';

export const getDriverProfile = (): Promise<any[]> => {
  return api.get('/api/driver/my-profile');
};

export const getOwnerProfile= (): Promise<any[]> => {
  return api.get('/api/owner/my-profile');
};

export const updateProfile = (role:string,data: any): Promise<any[]> => {

  if (role === "driver") {return api.patch('/api/driver/my-profile', data);}else{return api.patch('/api/owner/my-profile', data);}
};

export const changePassword = (role:any,data: { currentPassword: string; newPassword: string; }): Promise<any[]> => {

  if (role === "driver") {return api.patch('/api/driver/password', data);}else{return api.patch('/api/owner/password', data);}
}