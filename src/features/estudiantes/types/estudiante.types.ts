/**
 * Tipos para el feature de Estudiantes
 */

/**
 * Estudiante - Entidad principal
 */
export interface Estudiante {
  id: string;
  empresaId: string;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  nombreUsuario?: string;
  correo: string;
  telefono?: string;
  fechaNacimiento?: string;
  idMoodle?: string;
  contrasenaTemporal?: string;
  identificacion: string;
  direccion?: string;
  estado: boolean;
  idSucursal?: string; // Sucursal principal (único campo de sucursal para estudiantes)
  pathFoto?: string | null; // Ruta de la foto del estudiante
  creadoEn: string;
  modificadoEn: string;
}

/**
 * Información de paginación
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

/**
 * Respuesta de listar estudiantes
 */
export interface ListarEstudiantesResponse {
  success: boolean;
  message: string;
  data: {
    estudiantes: Estudiante[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Parámetros para listar estudiantes
 */
export interface ListarEstudiantesParams {
  page?: number;
  limit?: number;
  q?: string;
  correo?: string;
  identificacion?: string;
  idMoodle?: string;
  estado?: boolean;
  requiereFacturaElectronica?: boolean;
  idSucursal?: string; // Filtrar por sucursal
}

/**
 * Datos para crear un nuevo estudiante
 */
export interface CrearEstudianteData {
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  correo: string;
  telefono?: string;
  fechaNacimiento?: string;
  nombreUsuario?: string; // OPCIONAL: Se genera automáticamente si no se proporciona
  contrasenaTemporal?: string; // OPCIONAL: Se genera automáticamente si no se proporciona
  identificacion: string; // OBLIGATORIO
  direccion?: string;
  idSucursal: string; // Sucursal principal (obligatorio)
}

/**
 * Respuesta de crear estudiante
 */
export interface CrearEstudianteResponse {
  success: boolean;
  data: Estudiante;
  message: string;
}

/**
 * Datos para actualizar un estudiante
 */
export interface ActualizarEstudianteData {
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
  idSucursal?: string; // Sucursal principal
}

/**
 * Respuesta de actualizar estudiante
 */
export interface ActualizarEstudianteResponse {
  success: boolean;
  data: Estudiante;
  message: string;
}

/**
 * Respuesta de obtener estudiante por ID
 */
export interface ObtenerEstudianteResponse {
  success: boolean;
  data: Estudiante;
}

/**
 * Respuesta de eliminar estudiante
 */
export interface EliminarEstudianteResponse {
  success: boolean;
  message: string;
  data: {};
}

/**
 * Datos para sincronizar con Moodle
 */
export interface SincronizarMoodleData {
  idMoodle?: string; // Nuevo ID de Moodle (opcional)
}

/**
 * Respuesta de sincronizar con Moodle
 */
export interface SincronizarMoodleResponse {
  success: boolean;
  message: string;
  data: {};
}

/**
 * Datos para carga masiva de estudiantes
 */
export interface EstudianteMasivoData {
  nombre: string;
  primerApellido: string;
  segundoApellido?: string;
  correo: string;
  identificacion?: string;
  telefono?: string;
  fechaNacimiento?: string;
  direccion?: string;
  idSucursal: string;
}

/**
 * Estudiante fallido en carga masiva
 */
export interface EstudianteFallido {
  indice: number;
  datos: {
    nombre?: string;
    primerApellido?: string;
    correo?: string;
    identificacion?: string;
  };
  error: string;
}

/**
 * Respuesta de carga masiva de estudiantes
 */
export interface CargaMasivaResponse {
  success: boolean;
  message: string;
  data: {
    exitosos: Estudiante[];
    fallidos: EstudianteFallido[];
    totalProcesados: number;
    totalExitosos: number;
    totalFallidos: number;
  };
}
