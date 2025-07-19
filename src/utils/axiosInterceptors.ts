import axios from "axios";
import Cookies from "js-cookie";
import { cleanupSocketOnLogout } from "../utils/socket";

export function setupAxiosInterceptors() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // JWT expired or unauthorized
        Cookies.remove("ownerToken");
        Cookies.remove("driverToken");
        cleanupSocketOnLogout();

        const path = window.location.pathname;
        const isOwner = path.startsWith("/owner");
        window.location.href = isOwner ? "/owner-login" : "/driver-login";
      }

      return Promise.reject(error);
    }
  );
}
