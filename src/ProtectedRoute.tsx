import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  role: "owner" | "driver";
  children: ReactNode;
}

const ProtectedRoute = ({ role, children }: ProtectedRouteProps) => {
  const location = useLocation();
  // Use localStorage.getItem() to retrieve the token
  const tokenKey = role === "owner" ? "ownerToken" : "driverToken";
  const token = localStorage.getItem(tokenKey);

  // No token -> redirect to login
  if (!token) {
    return (
      <Navigate
        to={role === "owner" ? "/owner-login" : "/driver-login"}
        state={{ from: location }}
        replace
      />
    );
  }

  try {
    // Note: Assuming the token stored in localStorage is a JSON string of a user object.
    // If it's a standard JWT or just a simple string, you might not need the JSON.parse
    // and can potentially check for `if (token)` after retrieval.
    const parsed = JSON.parse(token);
    if (parsed && parsed.firstName) {
      return <>{children}</>; // ✅ Authorized
    }
  } catch (e) {
    // Invalid token format (JSON.parse failed)
    // Use localStorage.removeItem() to clear the invalid item
    localStorage.removeItem(tokenKey);
    return (
      <Navigate
        to={role === "owner" ? "/owner-login" : "/driver-login"}
        replace
      />
    );
  }

  // Fallback for cases where token exists but doesn't pass the validation check (e.g., if JSON.parse succeeds but doesn't have `firstName`)
  return null;
};

export default ProtectedRoute;