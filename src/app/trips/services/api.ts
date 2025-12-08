import axios from "axios"

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`


export const getAuthConfig = () => {
  const token = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken");
  const parsedToken = token ? JSON.parse(token) : null;

  return {
    headers: {
      "Content-Type": "application/json",
      authorization: parsedToken?.accessToken || "",
    },
  };
};

export const api = {
  drivers: {
    list: async () => {
      const response = await axios.get(`${BASE_URL}/driver/list`, getAuthConfig())
      return response.data
    },
  },
  trucks: {
    list: async () => {
      const response = await axios.get(`${BASE_URL}/trucks`, getAuthConfig())
      return response.data.trucks
    },
     assignDriver: async (truckId: string, driverId: string) => {
    const response = await axios.patch(
      `${BASE_URL}/trucks/assign-driver`,
      { truckId, driverId },
      getAuthConfig()
    );
    return response.data;
  },
  },
  documents: {
    list: async () => {
      const response = await axios.get(`${BASE_URL}/documents`, getAuthConfig())
      return response.data
    },
  },
  trips: {
  list: async () => {
    const response = await axios.get(`${BASE_URL}/trips/tripList`, getAuthConfig());
    return response.data;
  },
  create: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/trips`, data, getAuthConfig());
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await axios.patch(`${BASE_URL}/trips/trip/${id}`, data, getAuthConfig());
    return response.data;
  },
  delete: async (id: string) => {
    const response = await axios.delete(`${BASE_URL}/trips/${id}`, getAuthConfig());
    return response.data;
  },
  getById: async (id: string) => {
    const response = await axios.get(`${BASE_URL}/trips/byTripId/${id}`, getAuthConfig());
    return response.data;
  },
  updateStatus: async (id: string, payload: any) => {
    const response = await axios.patch(`${BASE_URL}/trips/updateStatus/${id}`, payload, getAuthConfig());
    return response.data;
  },
   //   await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/tripexpense`, newExpense, config)
  createExpense: async (data: any) => {
    const response = await axios.post(`${BASE_URL}/tripexpense`, data, getAuthConfig());
    return response.data;
  },
},

}

