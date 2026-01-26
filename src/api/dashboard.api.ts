//api for dashboard related operations
import api from './axios';
//replace this 

        
export const getDashboardData = (params:any): Promise<any> => {
  return api.get('/api/stats/all', { params });
};


