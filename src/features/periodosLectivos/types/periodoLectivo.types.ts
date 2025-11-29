/**
 * Tipos para el feature de Periodos Lectivos
 */

/**
 * Estados posibles de un periodo lectivo
 */
export const EstadoPeriodoLectivo = {
  PLANEADO: 0,
  ACTIVO: 1,
  FINALIZADO: 3,
  CANCELADO: 4,
} as const;

export type EstadoPeriodoLectivo = typeof EstadoPeriodoLectivo[keyof typeof EstadoPeriodoLectivo];

/**
 * Periodo Lectivo - Entidad principal
 */
export interface PeriodoLectivo {
  id: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado: EstadoPeriodoLectivo;
  esActual: boolean;
}

/**
 * Información de paginación
 */
export interface PeriodoLectivoPaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Respuesta de listar periodos lectivos con paginación
 * GET /api/periodos-lectivos
 */
export interface ListarPeriodosLectivosResponse {
  success: boolean;
  message: string;
  data: {
    periodosLectivos: PeriodoLectivo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Parámetros para listar periodos lectivos
 */
export interface ListarPeriodosLectivosParams {
  page?: number;
  limit?: number;
  q?: string;
  estado?: EstadoPeriodoLectivo;
  esActual?: boolean;
}

/**
 * Datos para crear un nuevo periodo lectivo
 * POST /api/periodos-lectivos
 */
export interface CrearPeriodoLectivoData {
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: EstadoPeriodoLectivo;
  esActual?: boolean;
}

/**
 * Respuesta de crear periodo lectivo
 */
export interface CrearPeriodoLectivoResponse {
  success: boolean;
  data: PeriodoLectivo;
  message: string;
}

/**
 * Datos para actualizar un periodo lectivo
 * PUT /api/periodos-lectivos/{id}
 */
export interface ActualizarPeriodoLectivoData {
  nombre?: string;
  fechaInicio?: string;
  fechaFin?: string;
  estado?: EstadoPeriodoLectivo;
  esActual?: boolean;
}

/**
 * Respuesta de actualizar periodo lectivo
 */
export interface ActualizarPeriodoLectivoResponse {
  success: boolean;
  data: PeriodoLectivo;
  message: string;
}

/**
 * Respuesta de obtener periodo lectivo por ID
 * GET /api/periodos-lectivos/{id}
 */
export interface ObtenerPeriodoLectivoResponse {
  success: boolean;
  data: PeriodoLectivo;
  message: string;
}

/**
 * Respuesta de obtener periodo lectivo actual
 * GET /api/periodos-lectivos/actual
 */
export interface ObtenerPeriodoLectivoActualResponse {
  success: boolean;
  data: PeriodoLectivo;
  message: string;
}

/**
 * Respuesta de eliminar periodo lectivo
 * DELETE /api/periodos-lectivos/{id}
 */
export interface EliminarPeriodoLectivoResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}
