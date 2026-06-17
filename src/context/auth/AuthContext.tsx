import { createContext, useContext, useState, useEffect, useRef } from "react";
import type { User } from "../../modules/Administracion/Usuarios/types/auth.type";

const isTokenExpired = (token: string | null) => {
  if (!token) return true;
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return true;
    }
    return false;
  } catch (e) {
    return true;
  }
};

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
    const tk = localStorage.getItem("access_token");
    if (tk && isTokenExpired(tk)) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      return null;
    }
    return tk;
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
    window.location.href = "/signin";
  };

  useEffect(() => {
    const currentToken = localStorage.getItem("access_token");
    if (currentToken && isTokenExpired(currentToken)) {
      logoutStorage();
    }
  }, []);

  const timeoutRef = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
      timeoutRef.current = setTimeout(() => {
        logoutStorage();
      }, 45 * 60 * 1000); // 45 minutos
    };

    resetTimer();

    const events = ["mousemove", "keydown", "scroll", "click"];
    const handleActivity = () => {
       resetTimer();
    };

    events.forEach(evt => window.addEventListener(evt, handleActivity));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current as any);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, []);

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
