import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/auth/AuthContext";

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    // Si no hay sesión iniciada, redirige forzosamente a SignIn
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && user) {
    let roleName = "";
    if (user.role) {
      if (typeof user.role === "object" && "name" in user.role) {
        roleName = user.role.name;
      } else if (typeof user.role === "string") {
        roleName = user.role;
      }
    }
    
    // Fallback if roleName is on custom property
    if (!roleName && (user as any).roleName) {
      roleName = (user as any).roleName;
    }

    if (!allowedRoles.includes(roleName)) {
      // Redirigir al home si no tiene permisos
      return <Navigate to="/" replace />;
    }
  }

  // Si hay sesión iniciada y tiene permisos, renderiza la vista destino
  return <Outlet />;
}
