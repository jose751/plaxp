import { apiService } from '../../../shared/services/apiService';
import type {
  ListarHorariosResponse,
  ListarHorariosParams,
  CrearHorarioData,
  CrearHorarioResponse,
  ActualizarHorarioData,
  ActualizarHorarioResponse,
  ObtenerHorarioResponse,
  EliminarHorarioResponse,
  ListarHorariosCursoResponse,
  ListarHorariosSucursalResponse,
  ListarHorariosAulaResponse,
  VerificarConflictoData,
  VerificarConflictoResponse,
} from '../types/horario.types';

/**
 * Listar horarios con paginación
 * GET /api/horarios
 */
export const listarHorariosApi = async (
  params: ListarHorariosParams
): Promise<ListarHorariosResponse> => {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
  if (params.sucursalId) queryParams.append('sucursalId', params.sucursalId);
  if (params.cursoId) queryParams.append('cursoId', params.cursoId);
  if (params.aulaId) queryParams.append('aulaId', params.aulaId);
  if (params.diaSemana) queryParams.append('diaSemana', params.diaSemana.toString());
  if (params.modalidad) queryParams.append('modalidad', params.modalidad);
  if (params.activo !== undefined) queryParams.append('activo', params.activo.toString());

  const url = `horarios${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return await apiService.get<ListarHorariosResponse>(url);
};

/**
 * Crear un horario
 * POST /api/horarios
 */
export const crearHorarioApi = async (data: CrearHorarioData): Promise<CrearHorarioResponse> => {
  return await apiService.post<CrearHorarioResponse>('horarios', data);
};

/**
 * Obtener un horario por ID
 * GET /api/horarios/{id}
 */
export const obtenerHorarioPorIdApi = async (id: string): Promise<ObtenerHorarioResponse> => {
  return await apiService.get<ObtenerHorarioResponse>(`horarios/${id}`);
};

/**
 * Actualizar un horario
 * PUT /api/horarios/{id}
 */
export const actualizarHorarioApi = async (
  id: string,
  data: ActualizarHorarioData
): Promise<ActualizarHorarioResponse> => {
  return await apiService.put<ActualizarHorarioResponse>(`horarios/${id}`, data);
};

/**
 * Eliminar un horario
 * DELETE /api/horarios/{id}
 */
export const eliminarHorarioApi = async (id: string): Promise<EliminarHorarioResponse> => {
  return await apiService.delete<EliminarHorarioResponse>(`horarios/${id}`);
};

/**
 * Listar horarios de un curso
 * GET /api/horarios/curso/:cursoId
 */
export const listarHorariosCursoApi = async (cursoId: string): Promise<ListarHorariosCursoResponse> => {
  return await apiService.get<ListarHorariosCursoResponse>(`horarios/curso/${cursoId}`);
};

/**
 * Listar horarios de una sucursal (para vista de calendario)
 * GET /api/horarios/sucursal/:sucursalId
 */
export const listarHorariosSucursalApi = async (
  sucursalId: string,
  fechaDesde?: string,
  fechaHasta?: string
): Promise<ListarHorariosSucursalResponse> => {
  const queryParams = new URLSearchParams();
  if (fechaDesde) queryParams.append('fechaDesde', fechaDesde);
  if (fechaHasta) queryParams.append('fechaHasta', fechaHasta);

  const url = `horarios/sucursal/${sucursalId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return await apiService.get<ListarHorariosSucursalResponse>(url);
};

/**
 * Listar horarios de un aula (vista semanal)
 * GET /api/horarios/aula/:aulaId
 */
export const listarHorariosAulaApi = async (aulaId: string): Promise<ListarHorariosAulaResponse> => {
  return await apiService.get<ListarHorariosAulaResponse>(`horarios/aula/${aulaId}`);
};

/**
 * Verificar conflicto de horario
 * POST /api/horarios/verificar-conflicto
 */
export const verificarConflictoApi = async (
  data: VerificarConflictoData
): Promise<VerificarConflictoResponse> => {
  return await apiService.post<VerificarConflictoResponse>('horarios/verificar-conflicto', data);
};
