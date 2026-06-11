import { ReactNode, useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import { LoadingState } from "./components/ui/LoadingState";
import { getLoginPath } from "./utils/auth";

interface ProtectedRouteProps {
  role: "owner" | "driver";
  children: ReactNode;
}

const ProtectedRoute = ({ role, children }: ProtectedRouteProps) => {
  const location = useLocation();
  const { isAuthenticated, isReady, role: currentRole } = useContext(AuthContext);

  if (!isReady) {
    return <LoadingState label="Checking your FleetWise session..." />;
  }

  if (!isAuthenticated || currentRole !== role) {
    return (
      <Navigate
        to={getLoginPath(role)}
        state={{ from: location }}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
