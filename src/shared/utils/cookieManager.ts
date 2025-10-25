/**
 * Utilidad para manejar cookies de forma centralizada
 */

interface CookieOptions {
  expires?: number; // días hasta expiración
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}

/**
 * Establecer una cookie
 */
export const setCookie = (
  name: string,
  value: string,
  options: CookieOptions = {}
): void => {
  const {
    expires = 1,
    path = '/',
    secure = true,
    sameSite = 'Lax',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  // Agregar fecha de expiración
  if (expires) {
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  // Agregar path
  cookieString += `; path=${path}`;

  // Agregar secure (solo HTTPS)
  if (secure) {
    cookieString += '; secure';
  }

  // Agregar SameSite
  cookieString += `; SameSite=${sameSite}`;

  document.cookie = cookieString;
};

/**
 * Obtener una cookie por nombre
 */
export const getCookie = (name: string): string | null => {
  const cookies = document.cookie.split(';');
  const cookie = cookies.find(c => c.trim().startsWith(`${encodeURIComponent(name)}=`));

  if (!cookie) {
    return null;
  }

  const value = cookie.split('=')[1];
  return value ? decodeURIComponent(value) : null;
};

/**
 * Eliminar una cookie
 */
export const deleteCookie = (name: string, path: string = '/'): void => {
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
};

/**
 * Verificar si existe una cookie
 */
export const hasCookie = (name: string): boolean => {
  return getCookie(name) !== null;
};

/**
 * Limpiar todas las cookies del dominio actual
 */
export const clearAllCookies = (): void => {
  const cookies = document.cookie.split(';');

  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    deleteCookie(name);
  });
};

/**
 * Cookies específicas de recuperación de contraseña
 */
export const RecoveryCookies = {
  /**
   * Guardar email de recuperación
   */
  setRecoveryEmail: (email: string): void => {
    setCookie('recovery_email', email, {
      expires: 1, // 1 día
      secure: true,
      sameSite: 'Strict',
    });
  },

  /**
   * Obtener email de recuperación
   */
  getRecoveryEmail: (): string | null => {
    return getCookie('recovery_email');
  },

  /**
   * Guardar token de recuperación (si tu backend lo envía)
   */
  setRecoveryToken: (token: string): void => {
    setCookie('recovery_token', token, {
      expires: 0.0104, // ~15 minutos (15/1440)
      secure: true,
      sameSite: 'Strict',
    });
  },

  /**
   * Obtener token de recuperación
   */
  getRecoveryToken: (): string | null => {
    return getCookie('recovery_token');
  },

  /**
   * Limpiar cookies de recuperación
   */
  clearRecoveryCookies: (): void => {
    deleteCookie('recovery_email');
    deleteCookie('recovery_token');
  },
};
