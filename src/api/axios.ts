import axios from "axios";
import { clearStoredSession, emitAuthLogout, getStoredSession, getLoginPath } from "../utils/auth";
import { cleanupSocketOnLogout } from "../utils/socket";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const { token } = getStoredSession();

    if (token) {
      config.headers.Authorization = `${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const isPublicAuthRequest = (url?: string) => {
  if (!url) return false;
  return /\/api\/(owner|driver)(\/login|\/signup)?$/i.test(url) || /\/api\/(owner|driver)\/login$/i.test(url);
};

api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const { response } = error;
    if (response) {
      const { status } = response;
      const requestUrl = error.config?.url as string | undefined;
      const { role } = getStoredSession();
      const shouldRedirectForAuth = status === 401 && !isPublicAuthRequest(requestUrl) && Boolean(role);

      if (shouldRedirectForAuth) {
        clearStoredSession();
        cleanupSocketOnLogout();
        emitAuthLogout(role);
        window.location.href = getLoginPath(role);
      }
      if (status === 403) {
        // Handle forbidden access
      }
      if (status >= 500) {
        // Handle server errors
      }
      /* express-validator answers with `{ errors: [{ msg, path }] }` and no
         `message`, so every failed validation used to surface as the useless
         "An error occurred". Read the first one: it names the field the
         person actually has to fix. */
      const validation = Array.isArray(response.data?.errors)
        ? response.data.errors[0]?.msg
        : undefined;

      return Promise.reject({
        message: response.data?.message || validation || 'An error occurred',
        statusCode: status,
        details: response.data?.details ?? response.data?.errors,
      });
    } else {
        // Handle network errors
        return Promise.reject({
            message: "Network error, please try again later.",
            statusCode: 500,
        });
    }
  }
);

export default api;
