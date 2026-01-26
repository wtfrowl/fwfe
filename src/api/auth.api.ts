import api from './axios';
import { LoginData, LoginResponse } from '../types/auth';

export const login = (data: LoginData, isOwner: boolean): Promise<LoginResponse> => {
  const url = `/api/${isOwner ? 'owner' : 'driver'}/login`;
  return api.post(url, data);
};
