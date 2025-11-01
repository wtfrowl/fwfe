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
  dashboard: {
    info: async () => {
      const response = await axios.get(`${BASE_URL}/info/dashboard`, getAuthConfig())
      return response.data
    },
  },
  loads:{
    allLoadForOwner: async () => {
      const response = await axios.get(`${BASE_URL}/load/owner/matches?page=1&limit=5`, getAuthConfig())
      return response.data
    },
  }
}