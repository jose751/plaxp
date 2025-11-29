import { apiService } from '../../../shared/services/apiService';
import type {
  ListarPeriodosLectivosResponse,
  ListarPeriodosLectivosParams,
  CrearPeriodoLectivoData,
  CrearPeriodoLectivoResponse,
  ActualizarPeriodoLectivoData,
  ActualizarPeriodoLectivoResponse,
  ObtenerPeriodoLectivoResponse,
  ObtenerPeriodoLectivoActualResponse,
  EliminarPeriodoLectivoResponse,
} from '../types/periodoLectivo.types';

/**
 * Listar periodos lectivos con paginación
 * GET /api/periodos-lectivos
 */
export const listarPeriodosLectivosApi = async (
  params?: ListarPeriodosLectivosParams
): Promise<ListarPeriodosLectivosResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.q) queryParams.q = params.q;
  if (params?.estado !== undefined) queryParams.estado = params.estado;
  if (params?.esActual !== undefined) queryParams.esActual = params.esActual;

  return await apiService.get<ListarPeriodosLectivosResponse>('periodos-lectivos', queryParams);
};

/**
 * Crear un nuevo periodo lectivo
 * POST /api/periodos-lectivos
 */
export const crearPeriodoLectivoApi = async (
  data: CrearPeriodoLectivoData
): Promise<CrearPeriodoLectivoResponse> => {
  return await apiService.post<CrearPeriodoLectivoResponse>('periodos-lectivos', data);
};

/**
 * Obtener un periodo lectivo por ID
 * GET /api/periodos-lectivos/{id}
 */
export const obtenerPeriodoLectivoPorIdApi = async (
  id: string
): Promise<ObtenerPeriodoLectivoResponse> => {
  return await apiService.get<ObtenerPeriodoLectivoResponse>(`periodos-lectivos/${id}`);
};

/**
 * Obtener el periodo lectivo actual
 * GET /api/periodos-lectivos/actual
 */
export const obtenerPeriodoLectivoActualApi = async (): Promise<ObtenerPeriodoLectivoActualResponse> => {
  return await apiService.get<ObtenerPeriodoLectivoActualResponse>('periodos-lectivos/actual');
};

/**
 * Actualizar un periodo lectivo
 * PUT /api/periodos-lectivos/{id}
 */
export const actualizarPeriodoLectivoApi = async (
  id: string,
  data: ActualizarPeriodoLectivoData
): Promise<ActualizarPeriodoLectivoResponse> => {
  return await apiService.put<ActualizarPeriodoLectivoResponse>(`periodos-lectivos/${id}`, data);
};

/**
 * Eliminar un periodo lectivo
 * DELETE /api/periodos-lectivos/{id}
 */
export const eliminarPeriodoLectivoApi = async (
  id: string
): Promise<EliminarPeriodoLectivoResponse> => {
  return await apiService.delete<EliminarPeriodoLectivoResponse>(`periodos-lectivos/${id}`);
};
