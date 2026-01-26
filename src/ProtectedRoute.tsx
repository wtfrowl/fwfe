import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  role: "owner" | "driver";
  children: ReactNode;
}

const ProtectedRoute = ({ role, children }: ProtectedRouteProps) => {
  const location = useLocation();
  const tokenKey = role === "owner" ? "ownerToken" : "driverToken";
  const token = localStorage.getItem(tokenKey);

  if (!token) {
    return (
      <Navigate
        to={role === "owner" ? "/owner-login" : "/driver-login"}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;