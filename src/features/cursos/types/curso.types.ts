/**
 * Interfaz para un Curso
 */
export interface Curso {
  categoriaId: string;
  id: string;
  empresaId: string;
  categoriaNombre: string;
  idMoodle?: string;
  codigo: string;
  nombre: string;
  nombreCorto: string;
  slug: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  enableCompletion: boolean;
  estado: boolean;
  sincronizadoMoodle: boolean;
  idSucursal?: string; // Sucursal principal (único campo de sucursal para cursos)
  capacidadMaxima?: number; // Capacidad máxima de estudiantes
  creadoEn: string;
  modificadoEn: string;
}

/**
 * Parámetros para listar cursos
 */
export interface ListarCursosParams {
  page?: number;
  pageSize?: number;
  q?: string;
  estado?: 'activo' | 'inactivo' | 'todos';
  categoriaId?: string;
  idSucursal?: string; // Filtrar por sucursal
}

/**
 * Datos para crear un curso
 */
export interface CrearCursoData {
  categoriaId: string;
  codigo: string;
  nombre: string;
  nombreCorto: string;
  slug: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  enableCompletion: boolean;
  idSucursal: string; // Sucursal principal (obligatorio)
  capacidadMaxima?: number; // Capacidad máxima de estudiantes (opcional)
}

/**
 * Datos para actualizar un curso
 */
export interface ActualizarCursoData {
  categoriaId?: string;
  codigo?: string;
  nombre?: string;
  nombreCorto?: string;
  slug?: string;
  descripcion?: string;
  fechaInicio?: string;
  fechaFin?: string;
  enableCompletion?: boolean;
  estado?: boolean;
  idSucursal?: string; // Sucursal principal
  capacidadMaxima?: number; // Capacidad máxima de estudiantes
}

/**
 * Información de paginación
 */
export interface CursoPaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
}

/**
 * Respuesta de listar cursos con paginación
 * GET /api/cursos
 */
export interface ListarCursosResponse {
  success: boolean;
  message: string;
  data: {
    cursos: Curso[];
    pagination: CursoPaginationInfo;
  };
}

/**
 * Respuesta de crear curso
 * POST /api/cursos
 */
export interface CrearCursoResponse {
  success: boolean;
  message: string;
  data: Curso;
}

/**
 * Respuesta de obtener curso por ID
 * GET /api/cursos/{id}
 */
export interface ObtenerCursoResponse {
  success: boolean;
  message: string;
  data: Curso;
}

/**
 * Respuesta de actualizar curso
 * PUT /api/cursos/{id}
 */
export interface ActualizarCursoResponse {
  success: boolean;
  message: string;
  data: Curso;
}

// ============ TIPOS DE ASISTENCIA ============

/**
 * Estado de asistencia
 */
export type EstadoAsistencia = 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO' | 'PERMISO';

/**
 * Registro de asistencia individual
 */
export interface Asistencia {
  id: string;
  empresaId: string;
  estudianteId: string;
  estudianteNombre: string;
  cursoId: string;
  cursoNombre: string;
  fecha: string;
  estado: EstadoAsistencia;
  horaLlegada?: string;
  minutosTardanza?: number;
  justificacion?: string;
  documentoAdjunto?: string;
  observaciones?: string;
  registradoPor: string;
  registradoPorNombre: string;
  creadoEn: string;
  actualizadoEn: string;
}

/**
 * Estudiante con su asistencia para una fecha
 */
export interface EstudianteAsistencia {
  estudianteId: string;
  estudianteNombre: string;
  asistencia: Asistencia | null;
}

/**
 * Resumen de asistencia de un día
 */
export interface ResumenAsistenciaDia {
  total: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  permisos: number;
  sinRegistro: number;
}

/**
 * Respuesta de asistencia por fecha
 */
export interface AsistenciaFechaResponse {
  success: boolean;
  data: {
    cursoId: string;
    cursoNombre: string;
    fecha: string;
    estudiantes: EstudianteAsistencia[];
    resumen: ResumenAsistenciaDia;
  };
}

/**
 * Datos para guardar asistencia individual
 */
export interface AsistenciaIndividualData {
  estudianteId: string;
  estado: EstadoAsistencia;
  horaLlegada?: string;
  minutosTardanza?: number;
  justificacion?: string;
  observaciones?: string;
}

/**
 * Datos para guardar asistencias masivas
 */
export interface GuardarAsistenciasData {
  asistencias: AsistenciaIndividualData[];
}

/**
 * Respuesta de guardar asistencias
 */
export interface GuardarAsistenciasResponse {
  success: boolean;
  message: string;
  data: {
    registrados: number;
  };
}

/**
 * Datos para actualizar asistencia individual
 */
export interface ActualizarAsistenciaData {
  estado?: EstadoAsistencia;
  horaLlegada?: string | null;
  minutosTardanza?: number | null;
  justificacion?: string | null;
  documentoAdjunto?: string | null;
  observaciones?: string;
}

/**
 * Respuesta de actualizar asistencia
 */
export interface ActualizarAsistenciaResponse {
  success: boolean;
  message: string;
  data: Asistencia;
}

/**
 * Resumen de asistencia de un estudiante
 */
export interface ResumenAsistenciaEstudiante {
  estudianteId: string;
  estudianteNombre: string;
  totalClases: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  permisos: number;
  porcentajeAsistencia: number;
}

/**
 * Respuesta de resumen de asistencia
 */
export interface ResumenAsistenciaResponse {
  success: boolean;
  data: ResumenAsistenciaEstudiante;
}

/**
 * Parámetros para listar asistencias
 */
export interface ListarAsistenciasParams {
  estudianteId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: EstadoAsistencia;
  pagina?: number;
  limite?: number;
}

/**
 * Respuesta de listar asistencias
 */
export interface ListarAsistenciasResponse {
  success: boolean;
  data: Asistencia[];
}
