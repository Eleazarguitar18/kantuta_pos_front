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

    // 1. Buscamos el rol de forma ultra-segura barriendo todas las variantes posibles del objeto user
    const userRaw = user as any;

    // Evaluamos si viene en "user.role" o "user.Role"
    const roleObject = userRaw.role || userRaw.Role;

    if (roleObject) {
      if (typeof roleObject === "object") {
        // Tu interfaz real usa "nombre" en minúsculas, por si acaso revisamos "name" también
        roleName = roleObject.nombre || roleObject.name || "";
      } else if (typeof roleObject === "string") {
        roleName = roleObject;
      }
    }

    // Fallback extra por si el backend mandó la propiedad "roleName" suelta
    if (!roleName && userRaw.roleName) {
      roleName = userRaw.roleName;
    }

    // 2. Si después de buscar por todo el objeto no encontramos nada, imprimimos alerta en la consola
    if (!roleName) {
      console.error("🚨 KANTUTA POS ERROR: No se pudo extraer el rol del objeto usuario. Estructura actual de user:", user);
      return <Navigate to="/" replace />;
    }

    // 3. Normalizamos a minúsculas para comparar con seguridad total
    const normalizedRole = roleName.toLowerCase().trim();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase().trim());

    // CONTROL DE AUDITORÍA EN CONSOLA (F12)
    console.log("🔒 [Guard de Rutas]", {
      Ruta_Destino: window.location.pathname,
      Rol_Detectado: normalizedRole,
      Roles_Permitidos: normalizedAllowedRoles,
      Acceso_Concedido: normalizedAllowedRoles.includes(normalizedRole)
    });

    if (!normalizedAllowedRoles.includes(normalizedRole)) {
      // Redirigir al home si el rol no coincide con los autorizados
      return <Navigate to="/" replace />;
    }
  }

  // Si pasó todas las validaciones, renderiza la vista destino (ej: Usuarios)
  return <Outlet />;
}