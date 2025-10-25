import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import {
  solicitarRecuperacionApi,
  verificarCodigoRecuperacionApi,
  restablecerContrasenaApi,
} from '../api/SecurityApi';
import { RecoveryCookies } from '../../../shared/utils/cookieManager';

/**
 * Interface del contexto de recuperación de contraseña
 */
export interface PasswordRecoveryContextType {
  // Estado
  emailSent: boolean;
  waitingForCode: boolean;
  email: string;
  isLoading: boolean;
  verifiedCode: string | null;

  // Acciones
  sendRecoveryEmail: (email: string) => Promise<void>;
  verifyCode: (code: string) => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<void>;
  resetFlow: () => void;
}

/**
 * Contexto de recuperación de contraseña
 */
export const PasswordRecoveryContext = createContext<PasswordRecoveryContextType | undefined>(
  undefined
);

/**
 * Provider de recuperación de contraseña
 * Integrado con API real y manejo de cookies
 */
export const PasswordRecoveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [emailSent, setEmailSent] = useState(false);
  const [waitingForCode, setWaitingForCode] = useState(false);
  const [email, setEmail] = useState('');
  const [verifiedCode, setVerifiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Restaurar estado desde cookies al montar el componente
  useEffect(() => {
    const savedEmail = RecoveryCookies.getRecoveryEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setEmailSent(true);
      setWaitingForCode(true);
    }
  }, []);

  /**
   * Enviar correo de recuperación
   */
  const sendRecoveryEmail = async (emailParam: string) => {
    setIsLoading(true);

    try {
      const response = await solicitarRecuperacionApi(emailParam);

      if (response.success) {
        setEmail(emailParam);
        setEmailSent(true);
        setWaitingForCode(true);

        // Guardar email en cookies
        RecoveryCookies.setRecoveryEmail(emailParam);

        // Guardar token de recuperación si el backend lo envía
        if (response.data?.token) {
          RecoveryCookies.setRecoveryToken(response.data.token);
        }

        console.log('Correo de recuperación enviado:', response.message);
      } else {
        // Lanzar error con el mensaje de la API
        throw new Error(response.message || 'Error al enviar correo');
      }
    } catch (error: any) {
      console.error('Error al enviar correo:', error);
      // Propagar el error con el mensaje original
      if (error.message) {
        throw error;
      }
      throw new Error('Error al enviar correo. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Verificar código de recuperación
   */
  const verifyCode = async (code: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await verificarCodigoRecuperacionApi(code);

      // Si success es true, el código es válido
      if (response.success) {
        setWaitingForCode(false);
        setVerifiedCode(code);

        console.log('Código verificado correctamente:', response.message);
        return true;
      } else {
        console.log('Código inválido:', response.message);
        return false;
      }
    } catch (error) {
      console.error('Error al verificar código:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resetear contraseña
   */
  const resetPassword = async (newPassword: string) => {
    setIsLoading(true);

    try {
      if (!verifiedCode) {
        throw new Error('Debes verificar el código primero');
      }

      // Debug: verificar estado antes de llamar API
      console.log('🔐 Estado antes de resetear contraseña:', {
        verifiedCode,
        email,
        recoveryEmail: RecoveryCookies.getRecoveryEmail(),
        recoveryToken: RecoveryCookies.getRecoveryToken(),
      });

      const response = await restablecerContrasenaApi(newPassword);

      console.log('🔐 Respuesta de restablecer contraseña:', response);

      if (response.success) {
        console.log('✅ Contraseña restablecida correctamente:', response.message);

        // Limpiar cookies y resetear el flujo
        RecoveryCookies.clearRecoveryCookies();
        resetFlow();
      } else {
        throw new Error(response.message || 'Error al restablecer contraseña');
      }
    } catch (error) {
      console.error('❌ Error al resetear contraseña:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Resetear el flujo de recuperación
   */
  const resetFlow = () => {
    setEmailSent(false);
    setWaitingForCode(false);
    setEmail('');
    setVerifiedCode(null);
    RecoveryCookies.clearRecoveryCookies();
  };

  const value: PasswordRecoveryContextType = {
    emailSent,
    waitingForCode,
    email,
    isLoading,
    verifiedCode,
    sendRecoveryEmail,
    verifyCode,
    resetPassword,
    resetFlow,
  };

  return (
    <PasswordRecoveryContext.Provider value={value}>
      {children}
    </PasswordRecoveryContext.Provider>
  );
};
