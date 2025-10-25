/**
 * Validación de seguridad de contraseña
 */

export interface PasswordStrength {
  score: number; // 0-4 (débil, regular, buena, fuerte, muy fuerte)
  label: string;
  color: string;
  message: string;
}

/**
 * Validar la fortaleza de una contraseña
 */
export const validatePasswordStrength = (password: string): PasswordStrength => {
  let score = 0;

  if (!password) {
    return {
      score: 0,
      label: 'Muy débil',
      color: 'danger',
      message: 'Ingresa una contraseña'
    };
  }

  // Longitud mínima
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;

  // Tiene números
  if (/\d/.test(password)) score++;

  // Tiene mayúsculas y minúsculas
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;

  // Tiene caracteres especiales
  if (/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/'`~;]/.test(password)) score++;

  // Normalizar score a escala 0-4
  const normalizedScore = Math.min(4, Math.floor(score * 4 / 5));

  const strengths = [
    {
      score: 0,
      label: 'Muy débil',
      color: 'danger',
      message: 'Debe tener al menos 8 caracteres'
    },
    {
      score: 1,
      label: 'Débil',
      color: 'danger',
      message: 'Agrega números y mayúsculas'
    },
    {
      score: 2,
      label: 'Regular',
      color: 'warning',
      message: 'Agrega caracteres especiales'
    },
    {
      score: 3,
      label: 'Buena',
      color: 'success',
      message: 'Contraseña segura'
    },
    {
      score: 4,
      label: 'Muy fuerte',
      color: 'success',
      message: 'Contraseña muy segura'
    }
  ];

  return strengths[normalizedScore];
};

/**
 * Validar que las contraseñas coincidan
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword && password.length > 0;
};

/**
 * Verificar si la contraseña cumple requisitos mínimos
 */
export const meetsMinimumRequirements = (password: string): boolean => {
  return password.length >= 8 && /\d/.test(password) && /[a-zA-Z]/.test(password);
};
