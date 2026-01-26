import axios from "axios"

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`


export const getAuthConfig = () => {
  const token = localStorage.getItem("ownerToken") || localStorage.getItem("driverToken");
 

  return {
    headers: {
      "Content-Type": "application/json",
      authorization: token || "",
    },
  };
};


export const api = {
  dashboard: {
    info: async () => {
      const response:any= await axios.get(`${BASE_URL}/info/dashboard`, getAuthConfig())
      return response.data
    },
  },
  loads:{
    allLoadForOwner: async () => {
      const response:any= await axios.get(`${BASE_URL}/load/owner/matches?page=1&limit=5`, getAuthConfig())
      return response.data
    },
  }
}