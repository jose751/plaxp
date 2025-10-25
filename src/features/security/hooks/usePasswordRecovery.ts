import { useState, useContext } from 'react';
import { PasswordRecoveryContext } from '../context/PasswordRecoveryContext';

/**
 * Hook para manejar el flujo de recuperación de contraseña
 * Usa el PasswordRecoveryContext para gestión de estado global
 */
export const usePasswordRecovery = () => {
  const context = useContext(PasswordRecoveryContext);

  if (!context) {
    throw new Error('usePasswordRecovery debe ser usado dentro de un PasswordRecoveryProvider');
  }

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /**
   * Manejar envío de correo de recuperación
   */
  const handleSendEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      await context.sendRecoveryEmail(email);
      setSuccess(true);
    } catch (err: any) {
      // Mostrar el mensaje del API si está disponible
      const errorMessage = err?.message || 'Error al enviar el correo. Por favor, intenta de nuevo.';
      setError(errorMessage);
      console.error('Error al enviar correo:', err);
    }
  };

  /**
   * Manejar verificación de código
   */
  const handleVerifyCode = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      const isValid = await context.verifyCode(code);

      if (!isValid) {
        setError('Código inválido. Por favor, verifica e intenta de nuevo.');
        return false;
      }

      setSuccess(true);
      return true;
    } catch (err) {
      setError('Error al verificar el código. Por favor, intenta de nuevo.');
      console.error('Error al verificar código:', err);
      return false;
    }
  };

  /**
   * Manejar cambio de contraseña
   */
  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    try {
      await context.resetPassword(newPassword);
      setSuccess(true);
    } catch (err) {
      setError('Error al resetear la contraseña. Por favor, intenta de nuevo.');
      console.error('Error al resetear contraseña:', err);
    }
  };

  return {
    // Estado local del formulario
    email,
    setEmail,
    code,
    setCode,
    newPassword,
    setNewPassword,
    error,
    setError,
    success,

    // Estado del contexto
    emailSent: context.emailSent,
    waitingForCode: context.waitingForCode,
    isLoading: context.isLoading,

    // Acciones
    handleSendEmail,
    handleVerifyCode,
    handleResetPassword,
    resetFlow: context.resetFlow,
  };
};
