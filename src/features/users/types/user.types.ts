/**
 * Tipos para el feature de Usuarios
 */

/**
 * Usuario - Entidad principal
 */
export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  estado: 'activo' | 'inactivo' | '1' | '0' | 1 | 0 | any; // Puede venir como string o número desde la API
  ultimoAcceso?: string;
  idRol?: string; // ID del rol (puede venir en algunos endpoints)
  nombreRol?: any; // Nombre del rol (puede venir en algunos endpoints)
  idSucursalPrincipal?: string; // Sucursal principal
  idSucursales?: string[]; // Lista de sucursales adicionales
  pathFoto?: string | null; // Ruta de la foto del usuario
}

/**
 * Información de paginación
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

/**
 * Respuesta de listar usuarios
 */
export interface ListarUsuariosResponse {
  success: boolean;
  data: Usuario[];
  pagination: PaginationInfo;
  message: string;
}

/**
 * Parámetros para listar usuarios
 */
export interface ListarUsuariosParams {
  page?: number;
  pageSize?: number;
  estado?: 'activo' | 'inactivo' | 'todos';
  q?: string; // Búsqueda en nombre y correo
}

/**
 * Datos para crear un nuevo usuario
 */
export interface CrearUsuarioData {
  nombre: string;
  correo: string;
  contrasena: string;
  estado: number; // 1 = activo, 0 = inactivo
  idRol: string;
  idSucursalPrincipal: string; // Sucursal principal (obligatorio)
  idSucursales?: string[]; // Lista de sucursales adicionales (opcional, puede estar vacía)
}

/**
 * Respuesta de crear usuario
 */
export interface CrearUsuarioResponse {
  success: boolean;
  data: {
    id: string;
    nombre: string;
    correo: string;
    estado: string;
    ultimoLogin: string;
    creadoEn: string;
  };
  message: string;
}

/**
 * Datos para actualizar un usuario
 * PUT /api/usuarios/{id}
 */
export interface ActualizarUsuarioData {
  nombre: string;
  correo: string;
  contrasena?: string; // Opcional al actualizar
  estado: number; // 1 = activo, 0 = inactivo
  idRol: string;
  idSucursalPrincipal?: string; // Sucursal principal
  idSucursales?: string[]; // Lista de sucursales adicionales
}

/**
 * Respuesta de actualizar usuario
 */
export interface ActualizarUsuarioResponse {
  success: boolean;
  data: {
    id: string;
    nombre: string;
    correo: string;
    estado: string;
    ultimoLogin: string;
    creadoEn: string;
  };
  message: string;
}

/**
 * Datos detallados de un usuario
 * GET /api/usuarios/{id}
 */
export interface UsuarioDetalle {
  id: string;
  idEmpresa: string;
  nombre: string;
  correo: string;
  estado: string;
  creadoEn: string;
  ultimoLogin: string;
  fechaModificacion: string;
  idRol: string;
  nombreRol: string;
  idSucursalPrincipal?: string; // Sucursal principal
  idSucursales?: string[]; // Lista de sucursales adicionales
  pathFoto?: string | null; // Ruta de la foto del usuario
}

/**
 * Respuesta de obtener usuario por ID
 */
export interface ObtenerUsuarioResponse {
  success: boolean;
  data: UsuarioDetalle;
  message: string;
}
