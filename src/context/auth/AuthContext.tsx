import { createContext, useContext, useState } from "react";
import type { User } from "../../modules/Administracion/Usuarios/types/auth.type";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loginStorage: (token: string, refresh: string, user: User) => void;
  logoutStorage: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);
export function AuthContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("access_token");
  });

  const loginStorage = (
    newToken: string,
    refreshToken: string,
    newUser: User,
  ) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("access_token", newToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };
  const logoutStorage = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated:
          !!token && token !== "null" && token !== "undefined" && !!user,
        loginStorage,
        logoutStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
