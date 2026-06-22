import { useMemo } from "react";
import { useAuth } from "../context/auth/AuthContext";

/**
 * Hook centralizado para gestión de roles en Kantuta POS.
 *
 * Extrae el nombre del rol del objeto `user` de forma segura,
 * normalizando a minúsculas para comparaciones fiables.
 *
 * Roles válidos: "Administrador" | "Operador"
 */
export const useRole = () => {
  const { user } = useAuth();

  const roleName = useMemo(() => {
    if (!user?.role) return "";

    const roleObj = user.role as any;

    if (typeof roleObj === "object") {
      // El backend envía { id, nombre, descripcion? }
      return (roleObj.nombre || roleObj.name || "").toString().toLowerCase().trim();
    }

    if (typeof roleObj === "string") {
      return roleObj.toLowerCase().trim();
    }

    return "";
  }, [user]);

  const isAdmin = roleName === "administrador";
  const isOperator = roleName === "operador";

  /**
   * Verifica si el usuario tiene alguno de los roles indicados.
   * Acepta nombres tal cual ("Administrador") — se normalizan internamente.
   */
  const hasRole = (allowedRoles: string[]) =>
    allowedRoles.some((r) => r.toLowerCase().trim() === roleName);

  return { roleName, isAdmin, isOperator, hasRole };
};
