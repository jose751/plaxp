import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { InputField } from '../../../shared/components/InputField';

/**
 * Componente de recuperación de contraseña
 */
export const PasswordRecoveryCard: React.FC = () => {
  const [email, setEmail] = useState('');

  return (
    // Contenedor Principal: Tarjeta de Recuperación (Responsive)
    <div className="flex w-full max-w-4xl h-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
      {/* Columna del Icono (Oculta en Móvil) */}
      <div className="hidden md:flex md:w-2/5 bg-gradient-to-br from-primary/10 to-primary/5 flex-col justify-center items-center p-8">
        <div className="w-full max-w-xs flex items-center justify-center">
          <img
            src="/Login/access_icon.png"
            alt="Icono de Acceso"
            className="w-48 h-48 object-contain drop-shadow-lg"
          />
        </div>
        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold text-primary mb-2">
            Recupera tu Acceso
          </h3>
          <p className="text-neutral-600 text-sm leading-relaxed px-4">
            Te enviaremos un código de recuperación a tu correo electrónico
          </p>
        </div>
      </div>

      {/* Columna del Formulario */}
      <div className="w-full md:w-3/5 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
        {/* Logo de Marca (Plaxp) */}
        <div className="mb-6 text-center md:text-left">
          <img
            src="/logo.png"
            alt="Plaxp Logo"
            className="h-12 inline-block"
          />
        </div>

        {/* Encabezado del Formulario */}
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2">
            Recuperar Contraseña
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base">
            Ingresa tu correo electrónico y te enviaremos un código de recuperación.
          </p>
        </div>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <InputField
            id="email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="ejemplo@tuempresa.com"
          />

          {/* Botón Principal */}
          <button
            type="submit"
            className="w-full py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-150"
          >
            Enviar Código de Recuperación
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
