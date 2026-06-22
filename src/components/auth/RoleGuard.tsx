import React from "react";
import { useRole } from "../../hooks/useRole";

interface RoleGuardProps {
  /** Roles que PUEDEN ver el contenido (ej: ['Administrador']) */
  allowed: string[];
  children: React.ReactNode;
  /** Contenido alternativo si el rol no está permitido (por defecto: nada) */
  fallback?: React.ReactNode;
}

/**
 * Componente declarativo para mostrar/ocultar elementos de la UI
 * según el rol del usuario autenticado.
 *
 * @example
 * ```tsx
 * <RoleGuard allowed={['Administrador']}>
 *   <Button>Eliminar</Button>
 * </RoleGuard>
 * ```
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowed,
  children,
  fallback = null,
}) => {
  const { hasRole } = useRole();
  return hasRole(allowed) ? <>{children}</> : <>{fallback}</>;
};
