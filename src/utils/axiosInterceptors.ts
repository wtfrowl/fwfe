import axios from "axios";
import { clearStoredSession, emitAuthLogout, getLoginPath, getStoredSession } from "./auth";
import { cleanupSocketOnLogout } from "../utils/socket";

const isPublicAuthRequest = (url?: string) => {
  if (!url) return false;
  return /\/api\/(owner|driver)(\/login|\/signup)?$/i.test(url) || /\/api\/(owner|driver)\/login$/i.test(url);
};

export function setupAxiosInterceptors() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status as number | undefined;
      const requestUrl = error.config?.url as string | undefined;
      const { role } = getStoredSession();

      if (status === 401 && !isPublicAuthRequest(requestUrl) && role) {
        clearStoredSession();
        cleanupSocketOnLogout();
        emitAuthLogout(role);

        window.location.href = getLoginPath(role);
      }

      return Promise.reject(error);
    }
  );
}
