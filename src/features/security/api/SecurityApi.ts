import { apiService } from '../../../shared/services/apiService';
import type {
  LoginResponse,
  RecuperacionResponse,
  VerificarCodigoResponse,
  RestablecerContrasenaResponse,
} from '../schemas/securityApiSchema';

/**
 * Login
 * POST /seguridad/login
 */
export const loginApi = async (correo: string, contrasena: string): Promise<LoginResponse> => {
  return await apiService.post<LoginResponse>(
    'seguridad/login',
    { correo, contrasena },
    { skipAuth: true }
  );
};

/**
 * Solicitar recuperación de contraseña
 * POST /seguridad/solicitar-recuperacion-contrasena
 */
export const solicitarRecuperacionApi = async (correo: string): Promise<RecuperacionResponse> => {
  return await apiService.post<RecuperacionResponse>(
    'seguridad/solicitar-recuperacion-contrasena',
    { correo },
    { skipAuth: true }
  );
};

/**
 * Verificar código de recuperación
 * POST /seguridad/validar-codigo-recuperacion
 */
export const verificarCodigoRecuperacionApi = async (
  codigo: string
): Promise<VerificarCodigoResponse> => {
  return await apiService.post<VerificarCodigoResponse>(
    'seguridad/validar-codigo-recuperacion',
    { codigo },
    { skipAuth: true }
  );
};

/**
 * Restablecer contraseña
 * POST /seguridad/restablecer-contrasena
 */
export const restablecerContrasenaApi = async (
  nuevaContrasena: string
): Promise<RestablecerContrasenaResponse> => {
  return await apiService.post<RestablecerContrasenaResponse>(
    'seguridad/cambiar-contrasena',
    { nueva_contrasena: nuevaContrasena },
    { skipAuth: true }
  );
};
