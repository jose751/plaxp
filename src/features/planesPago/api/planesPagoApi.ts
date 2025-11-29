import { apiService } from '../../../shared/services/apiService';
import type {
  ListarPlanesPagoResponse,
  ListarPlanesPagoParams,
  CrearPlanPagoData,
  CrearPlanPagoResponse,
  ActualizarPlanPagoData,
  ActualizarPlanPagoResponse,
  ObtenerPlanPagoResponse,
  EliminarPlanPagoResponse,
  ListarImpuestosResponse,
  ListarImpuestosParams,
  ListarMonedasResponse,
  ListarMonedasParams,
} from '../types/planPago.types';

/**
 * Listar planes de pago con paginación
 * GET /api/planes-pago
 */
export const listarPlanesPagoApi = async (
  params?: ListarPlanesPagoParams
): Promise<ListarPlanesPagoResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.page) queryParams.page = params.page;
  if (params?.limit) queryParams.limit = params.limit;
  if (params?.q) queryParams.q = params.q;
  if (params?.tipoPago !== undefined) queryParams.tipoPago = params.tipoPago;
  if (params?.activo !== undefined) queryParams.activo = params.activo;
  if (params?.idMoneda) queryParams.idMoneda = params.idMoneda;

  return await apiService.get<ListarPlanesPagoResponse>('planes-pago', queryParams);
};

/**
 * Crear un nuevo plan de pago
 * POST /api/planes-pago
 */
export const crearPlanPagoApi = async (
  data: CrearPlanPagoData
): Promise<CrearPlanPagoResponse> => {
  return await apiService.post<CrearPlanPagoResponse>('planes-pago', data);
};

/**
 * Obtener un plan de pago por ID
 * GET /api/planes-pago/{id}
 */
export const obtenerPlanPagoPorIdApi = async (
  id: string
): Promise<ObtenerPlanPagoResponse> => {
  return await apiService.get<ObtenerPlanPagoResponse>(`planes-pago/${id}`);
};

/**
 * Actualizar un plan de pago
 * PUT /api/planes-pago/{id}
 */
export const actualizarPlanPagoApi = async (
  id: string,
  data: ActualizarPlanPagoData
): Promise<ActualizarPlanPagoResponse> => {
  return await apiService.put<ActualizarPlanPagoResponse>(`planes-pago/${id}`, data);
};

/**
 * Eliminar un plan de pago
 * DELETE /api/planes-pago/{id}
 */
export const eliminarPlanPagoApi = async (
  id: string
): Promise<EliminarPlanPagoResponse> => {
  return await apiService.delete<EliminarPlanPagoResponse>(`planes-pago/${id}`);
};

/**
 * Listar impuestos del país
 * GET /api/impuestos
 */
export const listarImpuestosApi = async (
  params?: ListarImpuestosParams
): Promise<ListarImpuestosResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.activo !== undefined) queryParams.activo = params.activo;
  if (params?.codigo) queryParams.codigo = params.codigo;
  if (params?.nombre) queryParams.nombre = params.nombre;

  return await apiService.get<ListarImpuestosResponse>('impuestos', queryParams);
};

/**
 * Listar monedas de la empresa
 * GET /api/monedas
 */
export const listarMonedasApi = async (
  params?: ListarMonedasParams
): Promise<ListarMonedasResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.activo !== undefined) queryParams.activo = params.activo;
  if (params?.codigo) queryParams.codigo = params.codigo;
  if (params?.nombre) queryParams.nombre = params.nombre;

  return await apiService.get<ListarMonedasResponse>('monedas', queryParams);
};
