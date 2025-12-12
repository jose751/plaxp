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
