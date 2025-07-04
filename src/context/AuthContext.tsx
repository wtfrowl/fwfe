import { createContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";

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
    const driverToken = Cookies.get("driverToken");
    const ownerToken = Cookies.get("ownerToken");

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
    Cookies.remove("ownerToken"); // ensure only one role logged in
    Cookies.set("driverToken", JSON.stringify(token));
    setUser(token);
    setRole("driver");
  };

  const driverLogout = (): void => {
    Cookies.remove("driverToken");
    setUser(null);
    setRole(null);
  };

  const ownerLogin = (token: object): void => {
    Cookies.remove("driverToken");
    Cookies.set("ownerToken", JSON.stringify(token));
    setUser(token);
    setRole("owner");
  };

  const ownerLogout = (): void => {
    Cookies.remove("ownerToken");
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
