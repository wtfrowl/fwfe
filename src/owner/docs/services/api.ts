import axios from "axios"
import Cookies from "js-cookie"
import { Truck } from "../types/docs"

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`
interface PaginatedDocumentResponse {
  documents: Document[]
  page: number
  totalPages: number
  totalDocs: number
}
export const getAuthConfig = () => {
  const token = Cookies.get("ownerToken")
  let parsedToken: any = ""

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
  documents: {
    list: async (page = 1, limit = 15): Promise<PaginatedDocumentResponse> => {
      const res = await axios.get(`${BASE_URL}/api/docs/allDocs`, {
        ...getAuthConfig(),
        params: { page, limit },
      })
      return res.data
    },

    addDoc: async (data: {
      name: string
      truckId: string
      viewUrl: string  
      downloadUrl: string
      type: string
    }): Promise<void> => {
      await axios.post(`${BASE_URL}/api/docs/addDoc`, data, getAuthConfig())
    }
  }
  ,

  trucks: {
    getMyTrucks: async (): Promise<Truck[]> => {
      const res = await axios.get(`${BASE_URL}/api/owner/myTrucks`, getAuthConfig())
      return res.data
    },
  },
}