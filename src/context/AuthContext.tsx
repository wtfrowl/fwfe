import { createContext, useState, useEffect, ReactNode } from "react";
import { cleanupSocketOnLogout } from "../utils/socket";

interface AuthContextType {
  driverLogin: (token: object) => void;
  driverLogout: () => void;
  ownerLogin: (token: object) => void;
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

  useEffect(() => {
    const driverToken = localStorage.getItem("driverToken");
    const ownerToken = localStorage.getItem("ownerToken");

    if (driverToken) {
      setUser(JSON.parse(driverToken));
      setRole("driver");
    } else if (ownerToken) {
      setUser(JSON.parse(ownerToken));
      setRole("owner");
    } else {
      setUser(null);
      setRole(null);
    }
  }, []);

  const driverLogin = (token: object): void => {
    ownerLogout(); // ensure only one role logged in
   // Cookies.remove("ownerToken"); // ensure only one role logged in
   localStorage.setItem("driverToken", JSON.stringify(token));
    setUser(token);
    setRole("driver");
  };

  const driverLogout = (): void => {
      cleanupSocketOnLogout();
    localStorage.removeItem("driverToken");
    setUser(null);
    setRole(null);
  };

  const ownerLogin = (token: object): void => {
    driverLogout(); // ensure only one role logged in
    //Cookies.remove("driverToken");
   localStorage.setItem("ownerToken", JSON.stringify(token));
    setUser(token);
    setRole("owner");
  };

  const ownerLogout = (): void => {
      cleanupSocketOnLogout();
    localStorage.removeItem("ownerToken");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{ driverLogin, driverLogout, ownerLogin, ownerLogout, user, role }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
