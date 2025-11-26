import { apiService } from '../../../shared/services/apiService';
import type {
  ListarCursosResponse,
  ListarCursosParams,
  CrearCursoData,
  CrearCursoResponse,
  ActualizarCursoData,
  ActualizarCursoResponse,
  ObtenerCursoResponse,
} from '../types/curso.types';

/**
 * Listar cursos con paginación
 * GET /api/cursos
 */
export const listarCursosApi = async (
  params: ListarCursosParams
): Promise<ListarCursosResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.q) queryParams.append('q', params.q);
  if (params.estado) queryParams.append('estado', params.estado);
  if (params.categoriaId) queryParams.append('categoriaId', params.categoriaId);
  if (params.idSucursal) queryParams.append('idSucursal', params.idSucursal);

  const url = `cursos${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return await apiService.get<ListarCursosResponse>(url);
};

/**
 * Crear un nuevo curso
 * POST /api/cursos
 * Acepta tanto JSON como FormData (con imagen)
 */
export const crearCursoApi = async (data: CrearCursoData | FormData): Promise<CrearCursoResponse> => {
  // Si es FormData, usar el método upload
  if (data instanceof FormData) {
    return await apiService.upload<CrearCursoResponse>('cursos', data);
  }

  // Si no, enviar como JSON normal
  return await apiService.post<CrearCursoResponse>('cursos', data);
};

/**
 * Obtener un curso por ID
 * GET /api/cursos/{id}
 */
export const obtenerCursoPorIdApi = async (id: string): Promise<ObtenerCursoResponse> => {
  return await apiService.get<ObtenerCursoResponse>(`cursos/${id}`);
};

/**
 * Actualizar un curso
 * PUT /api/cursos/{id}
 */
export const actualizarCursoApi = async (
  id: string,
  data: ActualizarCursoData
): Promise<ActualizarCursoResponse> => {
  return await apiService.put<ActualizarCursoResponse>(`cursos/${id}`, data);
};
