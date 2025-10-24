import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { InputField } from '../../../shared/components/InputField';

/**
 * Componente principal que contiene la tarjeta de login
 */
export const LoginCard: React.FC = () => {
  const { email, setEmail, password, setPassword, handleLogin } = useAuth();

  return (
    // Contenedor Principal: Tarjeta de Login (Responsive)
    <div className="flex w-full max-w-5xl h-auto md:min-h-[550px] bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500">
      {/* Columna de Arte/Mensaje (Identidad de Marca - Oculta en Móvil) */}
      <div className="hidden md:flex md:w-1/2 bg-white flex-col justify-center items-center p-8">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-2 text-center leading-tight">
            Bienvenido a Plaxp
          </h2>
          <p className="text-neutral-600 text-center mb-8 leading-relaxed">
            La plataforma integral para gestionar tu negocio de forma eficiente
          </p>
        </div>
        <img
          src="/Login/personajes.jpg"
          alt="Personajes Plaxp"
          className="w-full max-w-lg object-contain"
        />
      </div>

      {/* Columna del Formulario de Login */}
      <div className="w-full md:w-1/2 p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
        {/* Logo de Marca (Plaxp) */}
        <div className="mb-6 md:text-left text-center">
          <img
            src="/logo.png"
            alt="Plaxp Logo"
            className="h-12 inline-block"
          />
        </div>

        {/* Encabezado del Formulario */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl font-bold text-neutral-900 mb-1">Iniciar Sesión</h1>
          <p className="text-neutral-500">Ingresa tus datos para acceder a la plataforma.</p>
        </div>

        <form className="space-y-6" onSubmit={handleLogin}>
          <InputField
            id="email"
            label="Correo Electrónico"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="ejemplo@tuempresa.com"
          />

          <InputField
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          {/* Opciones (Recordarme y Olvidó Contraseña) */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary border-neutral-300 rounded focus:ring-primary"
              />
              <label htmlFor="remember-me" className="ml-2 block text-neutral-700">
                Recordarme
              </label>
            </div>
            <a
              href="#"
              className="font-medium text-primary hover:opacity-80 transition-opacity"
            >
              ¿Olvidaste tu Contraseña?
            </a>
          </div>

          {/* Botón Principal */}
          <button
            type="submit"
            className="w-full py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-150"
          >
            Acceder a Plaxp
          </button>
        </form>

        {/* Sección de Acceso Alternativo / Footer */}
        <div className="mt-10 text-center border-t border-neutral-300 pt-6">
          <p className="text-sm text-neutral-500">
            ¿Aún no eres cliente?{' '}
            <a
              href="#"
              className="font-medium text-primary hover:opacity-80 transition-opacity"
            >
              Solicita tu Demo GRATIS
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
