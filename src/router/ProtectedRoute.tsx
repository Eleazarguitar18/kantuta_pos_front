import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/auth/AuthContext";

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Si no hay sesión iniciada, redirige forzosamente a SignIn
    return <Navigate to="/signin" replace />;
  }

  // Si hay sesión iniciada, renderiza la vista destino
  return <Outlet />;
}
