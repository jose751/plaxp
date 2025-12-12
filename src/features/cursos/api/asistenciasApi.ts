import { apiService } from '../../../shared/services/apiService';
import type {
  AsistenciaFechaResponse,
  GuardarAsistenciasData,
  GuardarAsistenciasResponse,
  ActualizarAsistenciaData,
  ActualizarAsistenciaResponse,
  ResumenAsistenciaResponse,
  ListarAsistenciasParams,
  ListarAsistenciasResponse,
} from '../types/curso.types';

/**
 * Listar asistencias de un curso
 * GET /api/asistencias/curso/{cursoId}
 */
export const listarAsistenciasCursoApi = async (
  cursoId: string,
  params?: ListarAsistenciasParams
): Promise<ListarAsistenciasResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.estudianteId) queryParams.append('estudianteId', params.estudianteId);
  if (params?.fechaInicio) queryParams.append('fechaInicio', params.fechaInicio);
  if (params?.fechaFin) queryParams.append('fechaFin', params.fechaFin);
  if (params?.estado) queryParams.append('estado', params.estado);
  if (params?.pagina) queryParams.append('pagina', params.pagina.toString());
  if (params?.limite) queryParams.append('limite', params.limite.toString());

  const url = `asistencias/curso/${cursoId}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return await apiService.get<ListarAsistenciasResponse>(url);
};

/**
 * Ver asistencia de una fecha específica
 * GET /api/asistencias/curso/{cursoId}/fecha/{fecha}
 */
export const obtenerAsistenciaFechaApi = async (
  cursoId: string,
  fecha: string
): Promise<AsistenciaFechaResponse> => {
  return await apiService.get<AsistenciaFechaResponse>(`asistencias/curso/${cursoId}/fecha/${fecha}`);
};

/**
 * Guardar asistencia del curso (masivo)
 * POST /api/asistencias/curso/{cursoId}/fecha/{fecha}
 */
export const guardarAsistenciasCursoApi = async (
  cursoId: string,
  fecha: string,
  data: GuardarAsistenciasData
): Promise<GuardarAsistenciasResponse> => {
  return await apiService.post<GuardarAsistenciasResponse>(
    `asistencias/curso/${cursoId}/fecha/${fecha}`,
    data
  );
};

/**
 * Actualizar asistencia de un estudiante
 * PUT /api/asistencias/curso/{cursoId}/estudiante/{estudianteId}/fecha/{fecha}
 */
export const actualizarAsistenciaEstudianteApi = async (
  cursoId: string,
  estudianteId: string,
  fecha: string,
  data: ActualizarAsistenciaData
): Promise<ActualizarAsistenciaResponse> => {
  return await apiService.put<ActualizarAsistenciaResponse>(
    `asistencias/curso/${cursoId}/estudiante/${estudianteId}/fecha/${fecha}`,
    data
  );
};

/**
 * Obtener resumen de asistencia del estudiante
 * GET /api/asistencias/curso/{cursoId}/estudiante/{estudianteId}/resumen
 */
export const obtenerResumenAsistenciaApi = async (
  cursoId: string,
  estudianteId: string,
  fechaInicio?: string,
  fechaFin?: string
): Promise<ResumenAsistenciaResponse> => {
  const queryParams = new URLSearchParams();

  if (fechaInicio) queryParams.append('fechaInicio', fechaInicio);
  if (fechaFin) queryParams.append('fechaFin', fechaFin);

  const url = `asistencias/curso/${cursoId}/estudiante/${estudianteId}/resumen${
    queryParams.toString() ? `?${queryParams.toString()}` : ''
  }`;

  return await apiService.get<ResumenAsistenciaResponse>(url);
};
