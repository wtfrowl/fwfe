import { createContext, ReactNode } from "react";
import Cookies from "js-cookie";

interface AuthContextType {
  driverLogin: (token: object) => void;
  driverLogout: () => void;
  ownerLogin: (token: object) => void;
  ownerLogout: () => void;
}

const AuthContext = createContext<AuthContextType | any>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const driverLogin = (token: object): void => {
    Cookies.remove("ownerToken"); // ✅ Ensure owner is logged out
    Cookies.set("driverToken", JSON.stringify(token));
  };

  const driverLogout = (): void => {
    Cookies.remove("driverToken");
  };

  const ownerLogin = (token: object): void => {
    Cookies.remove("driverToken"); // ✅ Ensure driver is logged out
    Cookies.set("ownerToken", JSON.stringify(token));
  };

  const ownerLogout = (): void => {
    Cookies.remove("ownerToken");
  };

  return (
    <AuthContext.Provider
      value={{ driverLogin, driverLogout, ownerLogin, ownerLogout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
