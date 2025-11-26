import { apiService } from '../../../shared/services/apiService';
import type {
  ListarUsuariosResponse,
  ListarUsuariosParams,
  CrearUsuarioData,
  CrearUsuarioResponse,
  ActualizarUsuarioData,
  ActualizarUsuarioResponse,
  ObtenerUsuarioResponse,
} from '../types/user.types';

/**
 * Listar usuarios con filtros y búsqueda
 * GET /api/usuarios
 *
 * Query Params:
 *   - page: número de página (default: 1)
 *   - pageSize: elementos por página (default: 10, max: 100)
 *   - estado: 'activo' | 'inactivo' | 'todos' (default: 'activo')
 *   - q: búsqueda en nombre y correo
 *
 * BÚSQUEDA INTELIGENTE:
 *   1. Primero busca EXACTO (nombre = q OR correo = q)
 *   2. Si encuentra SOLO 1 resultado → Lo retorna
 *   3. Si NO encuentra 1 exacto → Busca LIKE (nombre LIKE %q% OR correo LIKE %q%)
 */
export const listarUsuariosApi = async (
  params?: ListarUsuariosParams
): Promise<ListarUsuariosResponse> => {
  // Construir los parámetros de la query
  const queryParams: Record<string, any> = {};

  if (params?.page) {
    queryParams.page = params.page;
  }

  if (params?.pageSize) {
    queryParams.pageSize = params.pageSize;
  }

  if (params?.estado) {
    queryParams.estado = params.estado;
  }

  if (params?.q) {
    queryParams.q = params.q;
  }

  return await apiService.get<ListarUsuariosResponse>(
    'usuarios',
    queryParams
  );
};

/**
 * Crear un nuevo usuario
 * POST /api/usuarios
 *
 * Se envía siempre como multipart/form-data para soportar fotos.
 * Los campos se envían como form fields individuales.
 * idSucursales se envía como campos repetidos (múltiples --form 'idSucursales=X')
 */
export const crearUsuarioApi = async (
  data: CrearUsuarioData,
  foto?: File
): Promise<CrearUsuarioResponse> => {
  const formData = new FormData();
  formData.append('nombre', data.nombre);
  formData.append('correo', data.correo);
  formData.append('contrasena', data.contrasena);
  formData.append('estado', String(data.estado));
  formData.append('idRol', data.idRol);
  formData.append('idSucursalPrincipal', data.idSucursalPrincipal);

  // Enviar idSucursales como arreglo JSON
  if (data.idSucursales && data.idSucursales.length > 0) {
    formData.append('idSucursales', JSON.stringify(data.idSucursales));
  }

  if (foto) {
    formData.append('foto', foto);
  }

  return await apiService.upload<CrearUsuarioResponse>('usuarios', formData);
};

/**
 * Obtener un usuario por ID
 * GET /api/usuarios/{id}
 *
 * Retorna información detallada del usuario incluyendo:
 * - Datos básicos (nombre, correo, estado)
 * - Información del rol
 * - Fechas (creación, último login, modificación)
 */
export const obtenerUsuarioPorIdApi = async (
  id: string
): Promise<ObtenerUsuarioResponse> => {
  return await apiService.get<ObtenerUsuarioResponse>(`usuarios/${id}`);
};

/**
 * Actualizar un usuario existente
 * PUT /api/usuarios/{id}
 *
 * Se envía siempre como multipart/form-data para soportar fotos.
 * Los campos se envían como form fields individuales.
 * idSucursales se envía como campos repetidos (múltiples --form 'idSucursales=X')
 */
export const actualizarUsuarioApi = async (
  id: string,
  data: ActualizarUsuarioData,
  foto?: File
): Promise<ActualizarUsuarioResponse> => {
  const formData = new FormData();
  formData.append('nombre', data.nombre);
  formData.append('correo', data.correo);

  if (data.contrasena) {
    formData.append('contrasena', data.contrasena);
  }

  formData.append('estado', String(data.estado));
  formData.append('idRol', data.idRol);

  if (data.idSucursalPrincipal) {
    formData.append('idSucursalPrincipal', data.idSucursalPrincipal);
  }

  // Enviar idSucursales como arreglo JSON
  if (data.idSucursales && data.idSucursales.length > 0) {
    formData.append('idSucursales', JSON.stringify(data.idSucursales));
  }

  if (foto) {
    formData.append('foto', foto);
  }

  return await apiService.uploadPut<ActualizarUsuarioResponse>(`usuarios/${id}`, formData);
};
