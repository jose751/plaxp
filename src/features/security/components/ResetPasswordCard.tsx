import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PasswordRecoveryContext } from '../context/PasswordRecoveryContext';
import { validatePasswordStrength, validatePasswordMatch, meetsMinimumRequirements } from '../validations/passwordValidation';
import { RecoveryCookies } from '../../../shared/utils/cookieManager';

/**
 * Componente para restablecer la contraseña
 */
export const ResetPasswordCard: React.FC = () => {
  const navigate = useNavigate();
  const context = useContext(PasswordRecoveryContext);

  if (!context) {
    throw new Error('ResetPasswordCard debe ser usado dentro de un PasswordRecoveryProvider');
  }

  const { resetPassword, isLoading, verifiedCode } = context;
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState({ password: false, confirm: false });

  // Redirigir si no hay código verificado
  useEffect(() => {
    if (!verifiedCode) {
      navigate('/password-recovery');
    }
  }, [verifiedCode, navigate]);

  const passwordStrength = validatePasswordStrength(newPassword);
  const passwordsMatch = validatePasswordMatch(newPassword, confirmPassword);

  /**
   * Manejar envío del formulario
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar requisitos mínimos
    if (!meetsMinimumRequirements(newPassword)) {
      setError('La contraseña debe tener al menos 8 caracteres, incluyendo letras y números');
      return;
    }

    // Validar que las contraseñas coincidan
    if (!passwordsMatch) {
      setError('Las contraseñas no coinciden');
      return;
    }

    // Debug: verificar cookies antes de enviar
    console.log('🔐 Cookies antes de resetear contraseña:', {
      email: RecoveryCookies.getRecoveryEmail(),
      token: RecoveryCookies.getRecoveryToken(),
      verifiedCode,
    });

    try {
      await resetPassword(newPassword);
      // Redirigir al login después de éxito
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Error completo:', err);
      const errorMessage = err?.message || err?.error?.message || 'Error al restablecer la contraseña. Por favor, intenta de nuevo.';
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 animate-fade-in">
      {/* Logo */}
      <div className="p-6 pb-0 text-center">
        <img
          src="/logo.png"
          alt="Plaxp Logo"
          className="h-12 inline-block"
        />
      </div>

      {/* Header con icono */}
      <div className="bg-white p-6 flex items-center justify-center">
        <div className="w-32 h-32 bg-success/10 rounded-full flex items-center justify-center">
          <svg
            className="w-16 h-16 text-success"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
      </div>

      {/* Formulario */}
      <div className="p-8 pt-0">
        {/* Encabezado */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            Nueva Contraseña
          </h1>
          <p className="text-neutral-500 text-sm">
            Crea una contraseña segura
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mensaje de error */}
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl animate-fade-in">
              <p className="text-danger text-sm text-center">{error}</p>
            </div>
          )}

          {/* Nueva contraseña */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-neutral-700 mb-2">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, password: true })}
                className="w-full px-4 py-3 pr-12 border-2 border-neutral-300 rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/20 focus:outline-none transition-all"
                placeholder="Ingresa tu nueva contraseña"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>

            {/* Indicador de fortaleza */}
            {newPassword && touched.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium text-${passwordStrength.color}`}>
                    {passwordStrength.label}
                  </span>
                  <span className="text-xs text-neutral-500">{passwordStrength.message}</span>
                </div>
                <div className="w-full bg-neutral-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 bg-${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score + 1) * 20}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
              Confirmar contraseña
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => setTouched({ ...touched, confirm: true })}
                className={`w-full px-4 py-3 pr-12 border-2 rounded-xl focus:outline-none transition-all ${
                  touched.confirm && confirmPassword
                    ? passwordsMatch
                      ? 'border-success focus:border-success focus:ring-4 focus:ring-success/20'
                      : 'border-danger focus:border-danger focus:ring-4 focus:ring-danger/20'
                    : 'border-neutral-300 focus:border-primary focus:ring-4 focus:ring-primary/20'
                }`}
                placeholder="Confirma tu nueva contraseña"
                disabled={isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showConfirmPassword ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>

            {/* Mensaje de coincidencia */}
            {touched.confirm && confirmPassword && (
              <p className={`mt-2 text-xs ${passwordsMatch ? 'text-success' : 'text-danger'}`}>
                {passwordsMatch ? '✓ Las contraseñas coinciden' : '✗ Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          {/* Botón de submit */}
          <button
            type="submit"
            disabled={isLoading || !passwordsMatch || !meetsMinimumRequirements(newPassword)}
            className="w-full py-3 bg-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-lg focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Restableciendo...
              </div>
            ) : 'Restablecer Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};
