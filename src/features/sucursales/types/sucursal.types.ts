/**
 * Tipos para el feature de Sucursales
 */

/**
 * Sucursal - Entidad principal
 */
export interface Sucursal {
  id: string;
  empresaId: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  estado: number;
  creadoEn: string;
}

/**
 * Información de paginación
 */
export interface SucursalPaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Respuesta de listar sucursales con paginación
 * GET /api/sucursales
 */
export interface ListarSucursalesResponse {
  success: boolean;
  message: string;
  data: Sucursal[];
  pagination: SucursalPaginationInfo;
}

/**
 * Parámetros para listar sucursales
 */
export interface ListarSucursalesParams {
  page?: number;
  limit?: number;
  nombre?: string;
  estado?: 0 | 1;
}

/**
 * Datos para crear una nueva sucursal
 * POST /api/sucursales
 */
export interface CrearSucursalData {
  nombre: string;
  direccion?: string;
  telefono: string;
  correo: string;
  estado?: number;
}

/**
 * Respuesta de crear sucursal
 */
export interface CrearSucursalResponse {
  success: boolean;
  data: Sucursal;
  message: string;
}

/**
 * Datos para actualizar una sucursal
 * PATCH /api/sucursales/{id}
 */
export interface ActualizarSucursalData {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  estado?: number;
}

/**
 * Respuesta de actualizar sucursal
 */
export interface ActualizarSucursalResponse {
  success: boolean;
  data: Sucursal;
  message: string;
}

/**
 * Respuesta de obtener sucursal por ID
 * GET /api/sucursales/{id}
 */
export interface ObtenerSucursalResponse {
  success: boolean;
  data: Sucursal;
  message: string;
}

/**
 * Respuesta de eliminar sucursal
 * DELETE /api/sucursales/{id}
 */
export interface EliminarSucursalResponse {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}

/**
 * Respuesta de obtener todas las sucursales (sin paginación)
 * GET /api/sucursales/todas
 */
export interface ObtenerTodasSucursalesResponse {
  success: boolean;
  message: string;
  data: Sucursal[];
}
