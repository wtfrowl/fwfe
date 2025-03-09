import axios from "axios"
import Cookies from "js-cookie"

const BASE_URL = "https://fleetwiseapi.azurewebsites.net/api"

export const getAuthConfig = () => {
  const token = Cookies.get("ownerToken")
  let parsedToken:any = ""

  if (token) {
    parsedToken = JSON.parse(token)
  }

  return {
    headers: {
      "Content-Type": "application/json",
      authorization: parsedToken ? parsedToken.accessToken : "",
    },
  }
}

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
      return response.data
    },
  },
  trips: {
    list: async () => {
      const response = await axios.get(`${BASE_URL}/trips/owner`, getAuthConfig())
      return response.data
    },
    create: async (data: any) => {
      const response = await axios.post(`${BASE_URL}/trips`, data, getAuthConfig())
      return response.data
    },
    update: async (id: string, data: any) => {
      const response = await axios.patch(`${BASE_URL}/trips/trip/${id}`, data, getAuthConfig())
      return response.data
    },
    delete: async (id: string) => {
      const response = await axios.delete(`${BASE_URL}/trips/${id}`, getAuthConfig())
      return response.data
    },
  },
}

