// AuthContext.tsx
import { createContext, ReactNode } from "react";
import Cookies from "js-cookie";

// Define the structure of the AuthContext value
interface AuthContextType {
  driverLogin: (token: object) => void;
  driverLogout: () => void;
  ownerLogin: (token: object) => void;
  ownerLogout: () => void;
}

// Initialize AuthContext with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Driver authentication methods
  const driverLogin = (token: object): void => {
    Cookies.set("driverToken", JSON.stringify(token));
  };

  const driverLogout = (): void => {
    Cookies.remove("driverToken");
  };

  // Owner authentication methods
  const ownerLogin = (token: object): void => {
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
