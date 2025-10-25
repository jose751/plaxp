import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CodeInput } from './CodeInput';
import { PasswordRecoveryContext } from '../context/PasswordRecoveryContext';
import { solicitarRecuperacionApi } from '../api/SecurityApi';
import { RecoveryCookies } from '../../../shared/utils/cookieManager';

/**
 * Componente de verificación de código
 */
export const VerifyCodeCard: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(PasswordRecoveryContext);

  if (!context) {
    throw new Error('VerifyCodeCard debe ser usado dentro de un PasswordRecoveryProvider');
  }

  const { email, isLoading, verifyCode, emailSent, resetFlow } = context;
  const [_code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  /**
   * Manejar click en "Volver a intentar"
   */
  const handleVolverAIntentar = () => {
    RecoveryCookies.clearRecoveryCookies();
    resetFlow();
  };

  // Redirigir si no hay email enviado
  useEffect(() => {
    if (!emailSent || !email) {
      navigate('/password-recovery');
    }
  }, [emailSent, email, navigate]);

  /**
   * Manejar código completo
   */
  const handleCodeComplete = async (completedCode: string) => {
    setCode(completedCode);
    setError(null);
    setSuccessMessage(null);
    setIsVerifying(true);

    try {
      const isValid = await verifyCode(completedCode);

      if (isValid) {
        setIsRedirecting(true);
        // Esperar un momento para mostrar el mensaje de carga
        setTimeout(() => {
          navigate('/reset-password');
        }, 1500);
      } else {
        setError('Código incorrecto. Por favor, verifica e intenta de nuevo.');
      }
    } catch (err) {
      setError('Error al verificar el código. Por favor, intenta de nuevo.');
      console.error('Error al verificar código:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  /**
   * Reenviar código
   */
  const handleResendCode = async () => {
    setError(null);
    setSuccessMessage(null);
    setCode('');
    setIsResending(true);

    try {
      const response = await solicitarRecuperacionApi(email);

      if (response.success) {
        setSuccessMessage('Código reenviado exitosamente. Revisa tu correo.');
      } else {
        setError('Error al reenviar el código. Por favor, intenta de nuevo.');
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al reenviar el código. Por favor, intenta de nuevo.';
      setError(errorMessage);
      console.error('Error al reenviar código:', err);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 animate-fade-in">
      {/* Header con icono */}
      <div className="bg-white p-8 flex items-center justify-center">
        <div className="flex items-center justify-center">
          <img
            src="/Login/letter_icon.png"
            alt="Icono de Correo"
            className="w-32 h-32 object-contain"
          />
        </div>
      </div>

      {/* Formulario */}
      <div className="p-8">
        {/* Encabezado */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Verificar Código
          </h1>
          <p className="text-neutral-500 text-sm">
            Enviado a <span className="font-semibold text-neutral-700">{email}</span>
          </p>
        </div>

        {/* Input de Código */}
        <div className="mb-6">
          <CodeInput
            length={6}
            onComplete={handleCodeComplete}
            disabled={isVerifying || isRedirecting}
            error={!!error}
            loading={isVerifying || isRedirecting}
          />
        </div>

        {/* Mensaje de redirección */}
        {isRedirecting && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl animate-fade-in">
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-success" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-success text-sm font-medium">
                Código verificado. Redirigiendo...
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de éxito */}
        {successMessage && !isRedirecting && (
          <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl animate-fade-in">
            <p className="text-success text-sm text-center">{successMessage}</p>
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl animate-fade-in">
            <p className="text-danger text-sm text-center">{error}</p>
          </div>
        )}

        {/* Estado de carga */}
        {isVerifying && !isRedirecting && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/30 rounded-xl animate-fade-in">
            <div className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-primary text-sm font-medium">
                Verificando código...
              </p>
            </div>
          </div>
        )}

        {/* Reenviar código */}
        <div className="text-center mb-6">
          <p className="text-sm text-neutral-500 mb-2">
            ¿No recibiste el código?
          </p>
          <button
            type="button"
            onClick={handleResendCode}
            disabled={isLoading || isVerifying || isRedirecting || isResending}
            className="text-primary font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isResending && (
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isResending ? 'Reenviando...' : 'Reenviar código'}
          </button>
        </div>

        {/* Instrucciones adicionales */}
        <div className="p-4 bg-info/5 border border-info/20 rounded-xl mb-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-info flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="text-info text-sm font-medium mb-1">
                Sugerencias
              </p>
              <ul className="text-neutral-600 text-xs space-y-1">
                <li>• Revisa tu bandeja de entrada y carpeta de spam</li>
                <li>• El código expira en 10 minutos</li>
                <li>• Puedes pegar el código directamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enlace de Regreso */}
        <div className="text-center border-t border-neutral-300 pt-6">
          <p className="text-sm text-neutral-500">
            ¿Correo incorrecto?{' '}
            <Link
              to="/password-recovery"
              onClick={handleVolverAIntentar}
              className="font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Volver a intentar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
