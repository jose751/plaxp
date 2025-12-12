/**
 * Tipos de modalidad de horario
 */
export type Modalidad = 'virtual' | 'presencial';

/**
 * Tipo para días de la semana (ISO 8601)
 * 1 = Lunes, 2 = Martes, ..., 7 = Domingo
 */
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Mapeo de días de la semana a texto
 */
export const DIAS_SEMANA: Record<DiaSemana, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

/**
 * Interfaz para un Horario
 */
export interface Horario {
  id: string;
  empresaId: string;
  cursoId: string;
  aulaId: string | null;
  modalidad: Modalidad;
  diaSemana: DiaSemana;
  diaSemanaTexto: string;
  horaInicio: string; // "HH:mm"
  horaFin: string; // Calculado automáticamente
  duracionMinutos: number;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  // Campos adicionales en respuestas
  cursoNombre?: string;
  aulaNombre?: string;
  aulaCapacidad?: number;
  cursoCapacidadMaxima?: number; // Capacidad máxima del curso
}

/**
 * Parámetros para listar horarios
 */
export interface ListarHorariosParams {
  page?: number;
  pageSize?: number;
  sucursalId?: string;
  cursoId?: string;
  aulaId?: string;
  diaSemana?: DiaSemana;
  modalidad?: Modalidad;
  activo?: boolean;
}

/**
 * Datos para crear un horario
 */
export interface CrearHorarioData {
  cursoId: string;
  aulaId?: string; // Obligatorio si modalidad = 'presencial'
  modalidad: Modalidad;
  diaSemana: DiaSemana;
  horaInicio: string; // "HH:mm"
  duracionMinutos: number;
}

/**
 * Datos para actualizar un horario
 */
export interface ActualizarHorarioData {
  aulaId?: string | null;
  modalidad?: Modalidad;
  diaSemana?: DiaSemana;
  horaInicio?: string;
  duracionMinutos?: number;
}

/**
 * Información de paginación
 */
export interface HorarioPaginationInfo {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

/**
 * Respuesta de listar horarios con paginación
 * GET /api/horarios
 */
export interface ListarHorariosResponse {
  success: boolean;
  message: string;
  data: Horario[];
  pagination: HorarioPaginationInfo;
}

/**
 * Respuesta de crear horario
 * POST /api/horarios
 */
export interface CrearHorarioResponse {
  success: boolean;
  message: string;
  data: Horario;
}

/**
 * Respuesta de obtener horario por ID
 * GET /api/horarios/{id}
 */
export interface ObtenerHorarioResponse {
  success: boolean;
  message?: string;
  data: Horario;
}

/**
 * Respuesta de actualizar horario
 * PUT /api/horarios/{id}
 */
export interface ActualizarHorarioResponse {
  success: boolean;
  message: string;
  data: Horario;
}

/**
 * Respuesta de eliminar horario
 * DELETE /api/horarios/{id}
 */
export interface EliminarHorarioResponse {
  success: boolean;
  message: string;
}

/**
 * Respuesta de listar horarios por curso
 * GET /api/horarios/curso/:cursoId
 */
export interface ListarHorariosCursoResponse {
  success: boolean;
  data: Horario[];
}

/**
 * Respuesta de listar horarios por sucursal
 * GET /api/horarios/sucursal/:sucursalId
 */
export interface ListarHorariosSucursalResponse {
  success: boolean;
  data: Horario[];
}

/**
 * Horarios agrupados por día para vista semanal
 */
export interface HorariosSemana {
  aulaId: string;
  aulaNombre: string;
  aulaCapacidad: number;
  horariosPorDia: {
    [dia: number]: Horario[];
  };
}

/**
 * Respuesta de listar horarios por aula (vista semanal)
 * GET /api/horarios/aula/:aulaId
 */
export interface ListarHorariosAulaResponse {
  success: boolean;
  data: HorariosSemana;
}

/**
 * Datos para verificar conflicto
 */
export interface VerificarConflictoData {
  aulaId: string;
  diaSemana: DiaSemana;
  horaInicio: string;
  duracionMinutos: number;
  excludeHorarioId?: string; // Para excluir el horario actual en edición
}

/**
 * Conflicto detectado
 */
export interface Conflicto {
  horarioId: string;
  cursoId: string;
  cursoNombre: string;
  horaInicio: string;
  horaFin: string;
}

/**
 * Respuesta de verificar conflicto
 * POST /api/horarios/verificar-conflicto
 */
export interface VerificarConflictoResponse {
  success: boolean;
  data: {
    tieneConflicto: boolean;
    conflictos: Conflicto[];
  };
}
