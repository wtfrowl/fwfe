import axios from "axios";
import { cleanupSocketOnLogout } from "../utils/socket";

export function setupAxiosInterceptors() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // JWT expired or unauthorized
   localStorage.removeItem("ownerToken");
localStorage.removeItem("driverToken");
        cleanupSocketOnLogout();

        const path = window.location.pathname;
        const isOwner = path.startsWith("/owner");
        window.location.href = isOwner ? "/owner-login" : "/driver-login";
      }

      return Promise.reject(error);
    }
  );
}
