/**
 * Tipos para el módulo de Profesores
 */

/**
 * Interfaz base de Profesor
 */
export interface Profesor {
  id: string;
  empresaId: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  nombreUsuario: string;
  correo: string;
  telefono?: string;
  fechaNacimiento?: string;
  idMoodle?: string;
  contrasenaTemporal?: string;
  identificacion: string;
  direccion?: string;
  estado: boolean;
  idSucursalPrincipal?: string; // Sucursal principal
  idSucursales?: string[]; // Lista de sucursales adicionales
  creadoEn: string;
  modificadoEn: string;
}

/**
 * Datos para crear un profesor
 */
export interface CrearProfesorData {
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  nombreUsuario?: string; // Opcional, se genera automáticamente
  correo: string;
  telefono?: string;
  fechaNacimiento?: string;
  contrasenaTemporal?: string; // Opcional, se genera automáticamente
  identificacion: string; // Obligatorio
  direccion?: string;
  idSucursalPrincipal: string; // Sucursal principal (obligatorio)
  idSucursales?: string[]; // Lista de sucursales adicionales (opcional, puede estar vacía)
}

/**
 * Datos para actualizar un profesor
 */
export interface ActualizarProfesorData {
  nombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  nombreUsuario?: string;
  correo?: string;
  telefono?: string;
  fechaNacimiento?: string;
  idMoodle?: string;
  identificacion?: string;
  direccion?: string;
  estado?: boolean;
  idSucursalPrincipal?: string; // Sucursal principal
  idSucursales?: string[]; // Lista de sucursales adicionales
}

/**
 * Parámetros para listar profesores
 */
export interface ListarProfesoresParams {
  page?: number;
  limit?: number;
  nombre?: string;
  correo?: string;
  identificacion?: string;
  idMoodle?: string;
  estado?: boolean;
  idSucursal?: string; // Filtrar por sucursal
}

/**
 * Respuesta de listado de profesores
 */
export interface ListarProfesoresResponse {
  success: boolean;
  message?: string;
  data: {
    profesores: Profesor[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Respuesta de crear profesor
 */
export interface CrearProfesorResponse {
  success: boolean;
  data: Profesor;
  message: string;
}

/**
 * Respuesta de actualizar profesor
 */
export interface ActualizarProfesorResponse {
  success: boolean;
  data: Profesor;
}

/**
 * Respuesta de obtener profesor
 */
export interface ObtenerProfesorResponse {
  success: boolean;
  data: Profesor;
}

/**
 * Respuesta de eliminar profesor
 */
export interface EliminarProfesorResponse {
  success: boolean;
  message: string;
  data: Record<string, never>;
}
