/**
 * Interfaz para un Aula
 */
export interface Aula {
  id: string;
  empresaId: string;
  sucursalId: string;
  nombre: string;
  capacidadMaxima: number;
  descripcion: string | null;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
  // Campos adicionales en respuestas
  sucursalNombre?: string;
  horariosActivos?: number;
}

/**
 * Parámetros para listar aulas
 */
export interface ListarAulasParams {
  page?: number;
  pageSize?: number;
  sucursalId?: string;
  q?: string;
  activo?: boolean;
}

/**
 * Datos para crear un aula
 */
export interface CrearAulaData {
  sucursalId: string;
  nombre: string;
  capacidadMaxima?: number;
  descripcion?: string;
}

/**
 * Datos para actualizar un aula
 */
export interface ActualizarAulaData {
  nombre?: string;
  capacidadMaxima?: number;
  descripcion?: string | null;
}

/**
 * Información de paginación
 */
export interface AulaPaginationInfo {
  page: number;
  pageSize: number;
  totalRecords: number;
  totalPages: number;
}

/**
 * Respuesta de listar aulas con paginación
 * GET /api/aulas
 */
export interface ListarAulasResponse {
  success: boolean;
  message: string;
  data: Aula[];
  pagination: AulaPaginationInfo;
}

/**
 * Respuesta de crear aula
 * POST /api/aulas
 */
export interface CrearAulaResponse {
  success: boolean;
  message: string;
  data: Aula;
}

/**
 * Respuesta de obtener aula por ID
 * GET /api/aulas/{id}
 */
export interface ObtenerAulaResponse {
  success: boolean;
  message?: string;
  data: Aula;
}

/**
 * Respuesta de actualizar aula
 * PUT /api/aulas/{id}
 */
export interface ActualizarAulaResponse {
  success: boolean;
  message: string;
  data: Aula;
}

/**
 * Respuesta de activar/desactivar aula
 * PATCH /api/aulas/{id}/activar
 * PATCH /api/aulas/{id}/desactivar
 */
export interface ToggleAulaResponse {
  success: boolean;
  message: string;
  data: Aula;
}

/**
 * Respuesta para obtener todas las aulas (sin paginación)
 */
export interface ObtenerTodasAulasResponse {
  success: boolean;
  message?: string;
  data: Aula[];
}
