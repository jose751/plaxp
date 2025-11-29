import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { loginApi, type User } from '../../features/security/api/SecurityApi';
import { apiService } from '../services/apiService';
import { obtenerUsuarioActualApi } from '../../features/users/api/UsersApi';

/**
 * Interface del contexto de autenticación
 */
export interface AuthContextType {
  // Estado
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  isLoginInProgress: boolean; // Solo true durante el proceso de login

  // Acciones
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  finishLoading: () => void;
  refreshPermissions: () => Promise<void>;

  // Permisos
  hasPermission: (codigo: string) => boolean;
  hasAnyPermission: (codigos: string[]) => boolean;
  hasAllPermissions: (codigos: string[]) => boolean;
}

/**
 * Contexto de autenticación
 */
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticación integrado con el API service
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Iniciar en true para verificar sesión
  const [isLoginInProgress, setIsLoginInProgress] = useState(false); // Solo true durante login

  /**
   * Función de logout (usar useCallback para que sea estable)
   */
  const logout = useCallback(() => {
    console.log('🚪 Cerrando sesión...');

    // Limpiar localStorage
    localStorage.removeItem('user');

    // Limpiar cookie (intentar eliminarla)
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /**
   * Al iniciar la app, verificar si hay sesión guardada en localStorage
   */
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error recuperando sesión:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false); // Terminar la carga inicial
  }, []);

  /**
   * Registrar callback de error de autenticación en el apiService
   */
  useEffect(() => {
    apiService.setAuthErrorCallback(() => {
      console.warn('🔒 Error de autenticación en API, cerrando sesión automáticamente');
      logout();
    });
  }, [logout]);

  /**
   * La verificación de sesión se hace principalmente a través de los errores del API
   * Solo cuando el servidor responda con 401/403, se cerrará la sesión automáticamente
   */

  /**
   * Función para obtener datos completos del usuario actual
   */
  const fetchUserData = async (): Promise<User | null> => {
    try {
      const response = await obtenerUsuarioActualApi();
      if (response.success && response.data) {
        // Mapear datos de UsuarioActual a User
        const userData: User = {
          id: response.data.id,
          idEmpresa: response.data.idEmpresa,
          nombre: response.data.nombre,
          correo: response.data.correo,
          estado: response.data.estado,
          ultimoLogin: response.data.ultimoLogin,
          idRol: response.data.idRol,
          nombreRol: response.data.nombreRol,
          idSucursalPrincipal: response.data.idSucursalPrincipal,
          idSucursales: response.data.idSucursales,
          pathFoto: response.data.pathFoto,
          permisos: response.data.permisos,
        };
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  /**
   * Función de login
   */
  const login = async (email: string, password: string) => {
    // NO poner isLoading = true aquí para evitar que PublicRoute oculte el formulario

    try {
      const response = await loginApi(email, password);

      if (response.success) {
        // Después del login, obtener los datos completos del usuario
        const fullUserData = await fetchUserData();

        // Si se obtuvieron datos completos, usarlos; si no, usar los del login
        const userData = fullUserData || response.data;

        // Guardar usuario en localStorage para persistir la sesión
        localStorage.setItem('user', JSON.stringify(userData));

        setUser(userData);
        setIsAuthenticated(true);

        // Marcar que login fue exitoso para mostrar LoadingScreen
        setIsLoginInProgress(true);
      } else {
        throw new Error(response.message || 'Credenciales incorrectas');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Error al iniciar sesión. Verifica tus credenciales.';
      throw new Error(errorMessage);
    }
  };

  /**
   * Función para finalizar el estado de carga después de navegar
   */
  const finishLoading = useCallback(() => {
    setIsLoading(false);
    setIsLoginInProgress(false);
  }, []);

  /**
   * Función para refrescar los permisos del usuario actual
   */
  const refreshPermissions = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const fullUserData = await fetchUserData();
      if (fullUserData) {
        // Actualizar usuario en memoria y localStorage
        setUser(fullUserData);
        localStorage.setItem('user', JSON.stringify(fullUserData));
      }
    } catch (error) {
      console.error('Error al refrescar permisos:', error);
      throw error;
    }
  }, [isAuthenticated]);

  /**
   * Verifica si el usuario tiene un permiso específico
   * @param codigo - Código del permiso (ej: 'usuarios.ver', 'roles.crear')
   */
  const hasPermission = useCallback(
    (codigo: string): boolean => {
      if (!user?.permisos) return false;
      return user.permisos.some((permiso) => permiso.codigo === codigo);
    },
    [user]
  );

  /**
   * Verifica si el usuario tiene al menos uno de los permisos especificados
   * @param codigos - Array de códigos de permisos
   */
  const hasAnyPermission = useCallback(
    (codigos: string[]): boolean => {
      if (!user?.permisos || codigos.length === 0) return false;
      return codigos.some((codigo) => user.permisos!.some((permiso) => permiso.codigo === codigo));
    },
    [user]
  );

  /**
   * Verifica si el usuario tiene todos los permisos especificados
   * @param codigos - Array de códigos de permisos
   */
  const hasAllPermissions = useCallback(
    (codigos: string[]): boolean => {
      if (!user?.permisos) return false;
      if (codigos.length === 0) return true;
      return codigos.every((codigo) => user.permisos!.some((permiso) => permiso.codigo === codigo));
    },
    [user]
  );

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    isLoginInProgress,
    login,
    logout,
    finishLoading,
    refreshPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
