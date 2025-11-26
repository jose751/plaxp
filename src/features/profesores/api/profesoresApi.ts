import { apiService } from '../../../shared/services/apiService';
import type {
  ListarProfesoresResponse,
  ListarProfesoresParams,
  CrearProfesorData,
  CrearProfesorResponse,
  ActualizarProfesorData,
  ActualizarProfesorResponse,
  ObtenerProfesorResponse,
  EliminarProfesorResponse,
} from '../types/profesor.types';

/**
 * Listar profesores con paginación y filtros
 * GET /api/profesores
 */
export const listarProfesoresApi = async (
  params: ListarProfesoresParams
): Promise<ListarProfesoresResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.nombre) queryParams.append('nombre', params.nombre);
  if (params.correo) queryParams.append('correo', params.correo);
  if (params.identificacion) queryParams.append('identificacion', params.identificacion);
  if (params.idMoodle) queryParams.append('idMoodle', params.idMoodle);
  if (params.estado !== undefined) queryParams.append('estado', params.estado.toString());
  if (params.idSucursal) queryParams.append('idSucursal', params.idSucursal);

  const url = `profesores${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return await apiService.get<ListarProfesoresResponse>(url);
};

/**
 * Crear un nuevo profesor
 * POST /api/profesores
 */
export const crearProfesorApi = async (data: CrearProfesorData): Promise<CrearProfesorResponse> => {
  return await apiService.post<CrearProfesorResponse>('profesores', data);
};

/**
 * Obtener un profesor por ID
 * GET /api/profesores/{id}
 */
export const obtenerProfesorPorIdApi = async (id: string): Promise<ObtenerProfesorResponse> => {
  return await apiService.get<ObtenerProfesorResponse>(`profesores/${id}`);
};

/**
 * Actualizar un profesor
 * PUT /api/profesores/{id}
 */
export const actualizarProfesorApi = async (
  id: string,
  data: ActualizarProfesorData
): Promise<ActualizarProfesorResponse> => {
  return await apiService.put<ActualizarProfesorResponse>(`profesores/${id}`, data);
};

/**
 * Eliminar un profesor (soft delete)
 * DELETE /api/profesores/{id}
 */
export const eliminarProfesorApi = async (id: string): Promise<EliminarProfesorResponse> => {
  return await apiService.delete<EliminarProfesorResponse>(`profesores/${id}`);
};
