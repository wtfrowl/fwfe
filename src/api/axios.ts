import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const ownerToken = localStorage.getItem('ownerToken');
    const driverToken = localStorage.getItem('driverToken');
    const token = ownerToken || driverToken;

    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    if (response) {
      const { status } = response;
      if (status === 401) {
        // Handle unauthorized access, e.g., redirect to login
        localStorage.removeItem('ownerToken');
        localStorage.removeItem('driverToken');
        localStorage.removeItem('user');
        const currentPath = window.location.pathname;
        if (currentPath.includes('owner')) {
          window.location.href = '/owner-login';
        } else if (currentPath.includes('driver')) {
          window.location.href = '/driver-login';
        } else {
          window.location.href = '/';
        }
      }
      if (status === 403) {
        // Handle forbidden access
      }
      if (status >= 500) {
        // Handle server errors
      }
      return Promise.reject({
        message: response.data.message || 'An error occurred',
        statusCode: status,
        details: response.data.details,
      });
    } else {
        // Handle network errors
        return Promise.reject({
            message: 'Network error, please try again later.',
            statusCode: 500,
        });
    }
  }
);

export default api;
