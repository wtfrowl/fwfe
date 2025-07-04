import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Cookies from "js-cookie";

interface ProtectedRouteProps {
  role: "owner" | "driver";
  children: ReactNode;
}

const ProtectedRoute = ({ role, children }: ProtectedRouteProps) => {
  const location = useLocation();
  const token = Cookies.get(role === "owner" ? "ownerToken" : "driverToken");

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
    const parsed = JSON.parse(token);
    if (parsed && parsed.firstName) {
      return <>{children}</>; // ✅ Authorized
    }
  } catch (e) {
    // Invalid token format
    Cookies.remove(role === "owner" ? "ownerToken" : "driverToken");
    return (
      <Navigate
        to={role === "owner" ? "/owner-login" : "/driver-login"}
        replace
      />
    );
  }

  return null;
};

export default ProtectedRoute;
