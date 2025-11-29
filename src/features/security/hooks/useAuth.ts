import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../shared/contexts/AuthContext';

/**
 * Hook para manejar el formulario de login
 * Usa el AuthContext para gestión de estado global
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  const navigate = useNavigate();

  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLocalLoading(true);

    try {
      await context.login(email, password);
      // Login exitoso - navegar al dashboard
      navigate('/dashboard');
      // Esperar 1.5 segundos mostrando la LoadingScreen antes de terminar
      setTimeout(() => {
        context.finishLoading();
      }, 1500);
    } catch (error: any) {
      setError(error?.message || 'Error al iniciar sesión');
      setLocalLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    handleLogin,
    isAuthenticated: context.isAuthenticated,
    user: context.user,
    isLoading: localLoading,
    logout: context.logout,
    refreshPermissions: context.refreshPermissions,
  };
};
