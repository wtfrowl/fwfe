import { createContext, useState, useEffect, ReactNode } from "react";
import { cleanupSocketOnLogout } from "../utils/socket";
import { LoginResponse } from "../types/auth";

interface AuthContextType {
  driverLogin: (data: LoginResponse) => void;
  driverLogout: () => void;
  ownerLogin: (data: LoginResponse) => void;
  ownerLogout: () => void;
  user: any;
  role: "driver" | "owner" | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<"driver" | "owner" | null>(null);

  /** Clear everything */
  const clearAuth = () => {
    cleanupSocketOnLogout();
    localStorage.removeItem("driverToken");
    localStorage.removeItem("ownerToken");
    localStorage.removeItem("user");
    setUser(null);
    setRole(null);
  };

  /** Restore auth on refresh */
  useEffect(() => {
    const driverToken = localStorage.getItem("driverToken");
    const ownerToken = localStorage.getItem("ownerToken");
    const userString = localStorage.getItem("user");

    if (userString) {
      setUser(JSON.parse(userString));

      if (driverToken) setRole("driver");
      else if (ownerToken) setRole("owner");
    }
  }, []);

  /** Login handlers */
  const driverLogin = (data: LoginResponse) => {
    clearAuth();
    localStorage.setItem("driverToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    setRole("driver");
  };

  const ownerLogin = (data: LoginResponse) => {
    clearAuth();
    localStorage.setItem("ownerToken", data.accessToken);
    localStorage.setItem("user", JSON.stringify(data));
    setUser(data);
    setRole("owner");
  };

  /** Logout handlers */
  const driverLogout = () => clearAuth();
  const ownerLogout = () => clearAuth();

  return (
    <AuthContext.Provider
      value={{
        driverLogin,
        driverLogout,
        ownerLogin,
        ownerLogout,
        user,
        role,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
