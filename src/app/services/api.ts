import axios from "axios"
import Cookies from "js-cookie"

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`


export const getAuthConfig = () => {
  const token = Cookies.get("ownerToken") || Cookies.get("driverToken");
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
}