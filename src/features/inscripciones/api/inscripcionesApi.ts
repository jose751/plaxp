import { apiService } from '../../../shared/services/apiService';
import type {
  ListarEstudiantesCursoResponse,
  ListarProfesoresCursoResponse,
  ObtenerParticipantesCursoResponse,
  InscribirEstudiantesRequest,
  InscribirEstudiantesResponse,
  DesinscribirEstudianteResponse,
} from '../types/inscripcion.types';

/**
 * Obtener todos los participantes de un curso (estudiantes y profesores)
 * GET /api/inscripciones/curso/{cursoId}/participantes
 */
export const obtenerParticipantesCursoApi = async (
  cursoId: string
): Promise<ObtenerParticipantesCursoResponse> => {
  return await apiService.get<ObtenerParticipantesCursoResponse>(
    `inscripciones/curso/${cursoId}/participantes`
  );
};

/**
 * Listar estudiantes de un curso
 * GET /api/inscripciones/curso/{cursoId}/estudiantes
 */
export const listarEstudiantesCursoApi = async (
  cursoId: string,
  activos: boolean = true
): Promise<ListarEstudiantesCursoResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('activos', activos.toString());

  return await apiService.get<ListarEstudiantesCursoResponse>(
    `inscripciones/curso/${cursoId}/estudiantes?${queryParams.toString()}`
  );
};

/**
 * Listar profesores de un curso
 * GET /api/inscripciones/curso/{cursoId}/profesores
 */
export const listarProfesoresCursoApi = async (
  cursoId: string,
  activos: boolean = true
): Promise<ListarProfesoresCursoResponse> => {
  const queryParams = new URLSearchParams();
  queryParams.append('activos', activos.toString());

  return await apiService.get<ListarProfesoresCursoResponse>(
    `inscripciones/curso/${cursoId}/profesores?${queryParams.toString()}`
  );
};

/**
 * Inscribir estudiante(s) a un curso
 * POST /api/inscripciones/inscribir
 */
export const inscribirEstudiantesApi = async (
  data: InscribirEstudiantesRequest
): Promise<InscribirEstudiantesResponse> => {
  return await apiService.post<InscribirEstudiantesResponse>(
    'inscripciones/inscribir',
    data
  );
};

/**
 * Desinscribir estudiante de un curso
 * DELETE /api/inscripciones/{id}
 */
export const desinscribirEstudianteApi = async (
  inscripcionId: string
): Promise<DesinscribirEstudianteResponse> => {
  return await apiService.delete<DesinscribirEstudianteResponse>(
    `inscripciones/${inscripcionId}`
  );
};
