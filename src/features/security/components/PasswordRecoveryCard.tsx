import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InputField } from '../../../shared/components/InputField';
import { usePasswordRecovery } from '../hooks/usePasswordRecovery';
import { RecoveryCookies } from '../../../shared/utils/cookieManager';

/**
 * Componente de recuperación de contraseña
 */
export const PasswordRecoveryCard: React.FC = () => {
  const navigate = useNavigate();
  const {
    email,
    setEmail,
    handleSendEmail,
    emailSent,
    isLoading,
    error,
    success,
  } = usePasswordRecovery();

  const [isRedirecting, setIsRedirecting] = useState(false);

  // Limpiar cookies al montar el componente (cuando accede a "Olvidé mi contraseña")
  useEffect(() => {
    RecoveryCookies.clearRecoveryCookies();
  }, []);

  // Redirigir automáticamente cuando el correo se envía exitosamente
  useEffect(() => {
    if (emailSent && success) {
      setIsRedirecting(true);
      // Esperar un momento para que el usuario vea el mensaje de éxito
      const timer = setTimeout(() => {
        navigate('/verify-code');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [emailSent, success, navigate]);

  // Redirigir si ya hay un email enviado (restaurado desde cookies)
  useEffect(() => {
    if (emailSent && !success) {
      setIsRedirecting(true);
      // Si emailSent es true pero success es false, significa que se restauró desde cookies
      const timer = setTimeout(() => {
        navigate('/verify-code');
      }, 500);

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    // Contenedor Principal: Tarjeta de Recuperación (Responsive y Centrada)
    // Se ajusta max-w-lg (mediano) para simular la tarjeta sin la columna lateral
    <div className="flex w-full max-w-lg h-auto bg-white rounded-2xl shadow-2xl overflow-hidden mx-auto transition-all duration-500">
      
      {/* Columna del Formulario (Ahora es la única columna y ocupa todo el ancho) */}
      <div className="w-full p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
        
        {/* Logo de Marca (Plaxp) */}
        <div className="mb-6 text-center"> {/* Centrado para mejor estética */}
          <img
            src="/logo.png"
            alt="Plaxp Logo"
            className="h-12 inline-block"
          />
        </div>

        {/* Encabezado del Formulario */}
        <div className="mb-8 text-center"> {/* Centrado para mejor estética */}
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base">
            Ingresa tu correo electrónico y te enviaremos un código de recuperación.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSendEmail}>
          {/* Mensaje de redirección */}
          {isRedirecting && (
            <div className="p-4 bg-primary/10 border border-primary/30 rounded-xl animate-fade-in">
              <div className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-primary text-sm font-medium">
                  Redirigiendo a verificación de código...
                </p>
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {emailSent && success && !isRedirecting && (
            <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
              <p className="text-success text-sm text-center">
                Correo enviado exitosamente. Revisa tu bandeja de entrada.
              </p>
            </div>
          )}

          {/* Mensaje de error */}
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl">
              <p className="text-danger text-sm text-center">{error}</p>
            </div>
          )}

          <InputField
            id="email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="ejemplo@tuempresa.com"
            disabled={emailSent}
          />

          {/* Botón Principal */}
          <button
            type="submit"
            disabled={isLoading || emailSent || isRedirecting}
            className="w-full py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </div>
            ) : emailSent ? 'Correo Enviado' : 'Enviar Código de Recuperación'}
          </button>
        </form>

        {/* Enlace de Regreso al Login */}
        <div className="mt-8 text-center border-t border-neutral-300 pt-6">
          <p className="text-sm text-neutral-500">
            ¿Recordaste tu contraseña?{' '}
            <Link
              to="/"
              className="font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Volver al inicio de sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};