import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Hook para verificar permisos del usuario actual
 *
 * @example
 * // Verificar un permiso específico
 * const { hasPermission } = usePermissions();
 * if (hasPermission('usuarios.crear')) {
 *   // mostrar botón de crear usuario
 * }
 *
 * @example
 * // Verificar si tiene al menos uno de varios permisos
 * const { hasAnyPermission } = usePermissions();
 * if (hasAnyPermission(['usuarios.ver', 'usuarios.crear'])) {
 *   // mostrar menú de usuarios
 * }
 *
 * @example
 * // Verificar si tiene todos los permisos requeridos
 * const { hasAllPermissions } = usePermissions();
 * if (hasAllPermissions(['usuarios.ver', 'usuarios.editar'])) {
 *   // mostrar vista de edición completa
 * }
 */
export const usePermissions = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('usePermissions debe ser usado dentro de un AuthProvider');
  }

  return {
    hasPermission: context.hasPermission,
    hasAnyPermission: context.hasAnyPermission,
    hasAllPermissions: context.hasAllPermissions,
    permisos: context.user?.permisos ?? [],
  };
};

/**
 * Hook simplificado que retorna true/false para un permiso específico
 * Útil para verificaciones simples en componentes
 *
 * @example
 * const canCreateUsers = useHasPermission('usuarios.crear');
 * return canCreateUsers ? <CreateButton /> : null;
 */
export const useHasPermission = (codigo: string): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(codigo);
};
