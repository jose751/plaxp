/**
 * Interfaz para un Estudiante inscrito
 */
export interface EstudianteInscrito {
  id: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  correo: string;
  identificacion: string;
  idMoodle?: string;
}

/**
 * Interfaz para un Profesor asignado
 */
export interface ProfesorAsignado {
  id: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  correo: string;
  identificacion: string;
  rolMoodleId?: number;
}

/**
 * Interfaz para una Inscripción
 */
export interface Inscripcion {
  id: string;
  empresaId: string;
  estudianteId: string;
  cursoId: string;
  rolMoodleId: number;
  fechaInicio?: string;
  fechaFin?: string;
  activo: boolean;
  sincronizadoMoodle: boolean;
  creadoEn: string;
  actualizadoEn: string;
  estudiante?: EstudianteInscrito;
}

/**
 * Interfaz para información del curso
 */
export interface CursoInfo {
  id: string;
  nombre: string;
  nombreCorto: string;
  codigo: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

/**
 * Datos para inscribir estudiante(s)
 */
export interface InscribirEstudianteData {
  estudianteId: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface InscribirEstudiantesRequest {
  cursoId: string;
  estudiantes: InscribirEstudianteData[];
}

/**
 * Respuesta de listar estudiantes de un curso
 */
export interface ListarEstudiantesCursoResponse {
  success: boolean;
  message?: string;
  data: Inscripcion[];
  total: number;
}

/**
 * Respuesta de listar profesores de un curso
 */
export interface ListarProfesoresCursoResponse {
  success: boolean;
  message?: string;
  data: ProfesorAsignado[];
  total: number;
}

/**
 * Respuesta de obtener participantes del curso
 */
export interface ObtenerParticipantesCursoResponse {
  success: boolean;
  message?: string;
  data: {
    curso: CursoInfo;
    profesores: ProfesorAsignado[];
    estudiantes: Inscripcion[];
    totalEstudiantes: number;
    totalProfesores: number;
  };
}

/**
 * Respuesta de inscribir estudiantes
 */
export interface InscribirEstudiantesResponse {
  success: boolean;
  message: string;
  data: Inscripcion[];
}

/**
 * Respuesta de desinscribir estudiante
 */
export interface DesinscribirEstudianteResponse {
  success: boolean;
  message: string;
}
