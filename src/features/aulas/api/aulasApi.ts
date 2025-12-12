import { apiService } from '../../../shared/services/apiService';
import type {
  ListarAulasResponse,
  ListarAulasParams,
  CrearAulaData,
  CrearAulaResponse,
  ActualizarAulaData,
  ActualizarAulaResponse,
  ObtenerAulaResponse,
  ToggleAulaResponse,
  ObtenerTodasAulasResponse,
} from '../types/aula.types';

/**
 * Listar aulas con paginación
 * GET /api/aulas
 */
export const listarAulasApi = async (
  params: ListarAulasParams
): Promise<ListarAulasResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.q) queryParams.append('q', params.q);
  if (params.sucursalId) queryParams.append('sucursalId', params.sucursalId);
  if (params.activo !== undefined) queryParams.append('activo', params.activo.toString());

  const url = `aulas${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return await apiService.get<ListarAulasResponse>(url);
};

/**
 * Obtener aulas por sucursal
 * GET /api/aulas/sucursal/:sucursalId
 * @param sucursalId - ID de la sucursal (obligatorio)
 * @param soloActivas - Si es true, solo retorna aulas activas (default: true)
 */
export const obtenerAulasPorSucursalApi = async (
  sucursalId: string,
  soloActivas: boolean = true
): Promise<ObtenerTodasAulasResponse> => {
  const url = `aulas/sucursal/${sucursalId}${!soloActivas ? '?soloActivas=false' : ''}`;
  return await apiService.get<ObtenerTodasAulasResponse>(url);
};

/**
 * @deprecated Usar obtenerAulasPorSucursalApi en su lugar
 * Obtener todas las aulas activas (sin paginación)
 * GET /api/aulas?pageSize=1000&activo=true
 */
export const obtenerTodasAulasApi = async (sucursalId?: string): Promise<ObtenerTodasAulasResponse> => {
  // Si hay sucursalId, usar el nuevo endpoint
  if (sucursalId) {
    return obtenerAulasPorSucursalApi(sucursalId, true);
  }

  // Fallback al endpoint anterior (no debería usarse)
  const queryParams = new URLSearchParams();
  queryParams.append('pageSize', '1000');
  queryParams.append('activo', 'true');

  const response = await apiService.get<ListarAulasResponse>(`aulas?${queryParams.toString()}`);

  return {
    success: response.success,
    message: response.message,
    data: response.data,
  };
};

/**
 * Crear un aula
 * POST /api/aulas
 */
export const crearAulaApi = async (data: CrearAulaData): Promise<CrearAulaResponse> => {
  return await apiService.post<CrearAulaResponse>('aulas', data);
};

/**
 * Obtener un aula por ID
 * GET /api/aulas/{id}
 */
export const obtenerAulaPorIdApi = async (id: string): Promise<ObtenerAulaResponse> => {
  return await apiService.get<ObtenerAulaResponse>(`aulas/${id}`);
};

/**
 * Actualizar un aula
 * PUT /api/aulas/{id}
 */
export const actualizarAulaApi = async (
  id: string,
  data: ActualizarAulaData
): Promise<ActualizarAulaResponse> => {
  return await apiService.put<ActualizarAulaResponse>(`aulas/${id}`, data);
};

/**
 * Activar un aula
 * PATCH /api/aulas/{id}/activar
 */
export const activarAulaApi = async (id: string): Promise<ToggleAulaResponse> => {
  return await apiService.patch<ToggleAulaResponse>(`aulas/${id}/activar`, {});
};

/**
 * Desactivar un aula
 * PATCH /api/aulas/{id}/desactivar
 */
export const desactivarAulaApi = async (id: string): Promise<ToggleAulaResponse> => {
  return await apiService.patch<ToggleAulaResponse>(`aulas/${id}/desactivar`, {});
};
