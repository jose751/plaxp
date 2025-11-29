import { apiService } from '../../../shared/services/apiService';
import type {
  ListarEstudiantesResponse,
  ListarEstudiantesParams,
  CrearEstudianteData,
  CrearEstudianteResponse,
  ActualizarEstudianteData,
  ActualizarEstudianteResponse,
  ObtenerEstudianteResponse,
  EliminarEstudianteResponse,
  SincronizarMoodleData,
  SincronizarMoodleResponse,
  EstudianteMasivoData,
  CargaMasivaResponse,
} from '../types/estudiante.types';

/**
 * Listar estudiantes con filtros y paginación
 * GET /api/estudiantes
 *
 * Query Params:
 *   - page: número de página (default: 1)
 *   - limit: elementos por página (default: 10)
 *   - nombre: búsqueda por nombre o apellidos
 *   - correo: filtro por correo
 *   - identificacion: filtro por identificación
 *   - idMoodle: filtro por ID de Moodle
 *   - estado: filtro por estado (true/false)
 *   - requiereFacturaElectronica: filtro por facturación electrónica (true/false)
 */
export const listarEstudiantesApi = async (
  params?: ListarEstudiantesParams
): Promise<ListarEstudiantesResponse> => {
  // Construir los parámetros de la query
  const queryParams: Record<string, any> = {};

  if (params?.page) {
    queryParams.page = params.page;
  }

  if (params?.limit) {
    queryParams.limit = params.limit;
  }

  if (params?.q) {
    queryParams.q = params.q;
  }

  if (params?.estado !== undefined) {
    queryParams.estado = params.estado;
  }

  if (params?.idSucursal) {
    queryParams.idSucursal = params.idSucursal;
  }

  return await apiService.get<ListarEstudiantesResponse>(
    'estudiantes',
    queryParams
  );
};

/**
 * Crear un nuevo estudiante
 * POST /api/estudiantes
 *
 * Se envía como multipart/form-data para soportar fotos.
 */
export const crearEstudianteApi = async (
  data: CrearEstudianteData,
  foto?: File
): Promise<CrearEstudianteResponse> => {
  const formData = new FormData();
  formData.append('nombre', data.nombre);
  formData.append('primerApellido', data.primerApellido);
  if (data.segundoApellido) formData.append('segundoApellido', data.segundoApellido);
  formData.append('correo', data.correo);
  if (data.telefono) formData.append('telefono', data.telefono);
  if (data.fechaNacimiento) formData.append('fechaNacimiento', data.fechaNacimiento);
  if (data.nombreUsuario) formData.append('nombreUsuario', data.nombreUsuario);
  if (data.contrasenaTemporal) formData.append('contrasenaTemporal', data.contrasenaTemporal);
  formData.append('identificacion', data.identificacion);
  if (data.direccion) formData.append('direccion', data.direccion);
  formData.append('idSucursal', data.idSucursal);

  if (foto) {
    formData.append('foto', foto);
  }

  return await apiService.upload<CrearEstudianteResponse>('estudiantes', formData);
};

/**
 * Obtener un estudiante por ID
 * GET /api/estudiantes/{id}
 *
 * Retorna información detallada del estudiante incluyendo:
 * - Datos básicos (nombre, apellidos, correo, teléfono)
 * - Información de Moodle (ID, usuario, contraseña temporal)
 * - Datos de Hacienda CR (identificación, ubicación)
 * - Fechas (creación, modificación)
 */
export const obtenerEstudiantePorIdApi = async (
  id: string
): Promise<ObtenerEstudianteResponse> => {
  return await apiService.get<ObtenerEstudianteResponse>(`estudiantes/${id}`);
};

/**
 * Actualizar un estudiante existente
 * PUT /api/estudiantes/{id}
 *
 * Se envía como multipart/form-data para soportar fotos.
 */
export const actualizarEstudianteApi = async (
  id: string,
  data: ActualizarEstudianteData,
  foto?: File,
  eliminarFoto?: boolean
): Promise<ActualizarEstudianteResponse> => {
  const formData = new FormData();
  if (data.nombre) formData.append('nombre', data.nombre);
  if (data.primerApellido) formData.append('primerApellido', data.primerApellido);
  if (data.segundoApellido) formData.append('segundoApellido', data.segundoApellido);
  if (data.correo) formData.append('correo', data.correo);
  if (data.telefono) formData.append('telefono', data.telefono);
  if (data.fechaNacimiento) formData.append('fechaNacimiento', data.fechaNacimiento);
  if (data.nombreUsuario) formData.append('nombreUsuario', data.nombreUsuario);
  if (data.idMoodle) formData.append('idMoodle', data.idMoodle);
  if (data.identificacion) formData.append('identificacion', data.identificacion);
  if (data.direccion) formData.append('direccion', data.direccion);
  if (data.estado !== undefined) formData.append('estado', String(data.estado));
  if (data.idSucursal) formData.append('idSucursal', data.idSucursal);

  if (foto) {
    formData.append('foto', foto);
  } else if (eliminarFoto) {
    formData.append('eliminarFoto', 'true');
  }

  return await apiService.uploadPut<ActualizarEstudianteResponse>(`estudiantes/${id}`, formData);
};

/**
 * Eliminar estudiante (soft delete)
 * DELETE /api/estudiantes/{id}
 *
 * Realiza una eliminación lógica del estudiante.
 * El estudiante no se elimina físicamente de la base de datos.
 */
export const eliminarEstudianteApi = async (
  id: string
): Promise<EliminarEstudianteResponse> => {
  return await apiService.delete<EliminarEstudianteResponse>(`estudiantes/${id}`);
};

/**
 * Sincronizar con Moodle
 * POST /api/estudiantes/{id}/sync-moodle
 *
 * Actualiza la fecha de sincronización y opcionalmente el ID de Moodle.
 */
export const sincronizarMoodleApi = async (
  id: string,
  data?: SincronizarMoodleData
): Promise<SincronizarMoodleResponse> => {
  return await apiService.post<SincronizarMoodleResponse>(
    `estudiantes/${id}/sync-moodle`,
    data
  );
};

/**
 * Carga masiva de estudiantes
 * POST /api/estudiantes/masivo
 *
 * Crea múltiples estudiantes en una sola petición.
 * Cada estudiante se crea con su usuario en Moodle automáticamente.
 * Se envía correo con credenciales a cada estudiante creado exitosamente.
 */
export const cargaMasivaEstudiantesApi = async (
  estudiantes: EstudianteMasivoData[]
): Promise<CargaMasivaResponse> => {
  return await apiService.post<CargaMasivaResponse>(
    'estudiantes/masivo',
    { estudiantes },
    { timeout: 300000 } // 5 minutos para carga masiva
  );
};
