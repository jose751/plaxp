import { apiService } from '../../../shared/services/apiService';
import type {
  ListarMatriculasPagosParams,
  ListarMatriculasPagosResponse,
  MatriculaPago,
  CrearMatriculaPagoData,
  CrearMatriculaPagoResponse,
  CrearAbonoData,
  CrearAbonoResponse,
  ResumenAbonosResponse,
} from '../types/matriculaPago.types';

interface ObtenerMatriculaPagoResponse {
  success: boolean;
  message: string;
  data: MatriculaPago;
}

/**
 * Listar pagos de matrículas con filtros opcionales
 * GET /api/matriculas-pagos
 *
 * Filtros disponibles:
 *   - matriculaId: Filtrar por matrícula específica
 *   - estado: 1=pendiente, 2=pagado, 3=vencido, 4=anulado
 *   - fechaVencimientoDesde/Hasta: Rango de fechas de vencimiento
 *   - page: Número de página
 *   - limit: Elementos por página (max 100)
 */
export const listarMatriculasPagosApi = async (
  params?: ListarMatriculasPagosParams
): Promise<ListarMatriculasPagosResponse> => {
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

  if (params?.matriculaId) {
    queryParams.matriculaId = params.matriculaId;
  }

  if (params?.estado) {
    queryParams.estado = params.estado;
  }

  if (params?.fechaVencimientoDesde) {
    queryParams.fechaVencimientoDesde = params.fechaVencimientoDesde;
  }

  if (params?.fechaVencimientoHasta) {
    queryParams.fechaVencimientoHasta = params.fechaVencimientoHasta;
  }

  return await apiService.get<ListarMatriculasPagosResponse>(
    'matriculas-pagos',
    queryParams
  );
};

/**
 * Crear un pago de matrícula
 * POST /api/matriculas-pagos
 *
 * Campos requeridos:
 *   - matriculaId: ID de la matrícula
 *   - numeroPago: Número de pago (1 = inscripción)
 *   - subtotal: Monto antes de impuestos
 *   - total: Monto total a pagar
 */
export const crearMatriculaPagoApi = async (
  data: CrearMatriculaPagoData
): Promise<CrearMatriculaPagoResponse> => {
  return await apiService.post<CrearMatriculaPagoResponse>('matriculas-pagos', data);
};

/**
 * Obtener un pago por ID
 * GET /api/matriculas-pagos/{id}
 */
export const obtenerMatriculaPagoPorIdApi = async (
  id: string
): Promise<ObtenerMatriculaPagoResponse> => {
  return await apiService.get<ObtenerMatriculaPagoResponse>(`matriculas-pagos/${id}`);
};

/**
 * Obtener resumen de abonos de un pago
 * GET /api/matriculas-pagos-abonos/resumen/{matriculaPagoId}
 *
 * Retorna: totalPago, totalAbonado, saldoPendiente, abonos[]
 */
export const obtenerResumenAbonosApi = async (
  matriculaPagoId: string
): Promise<ResumenAbonosResponse> => {
  return await apiService.get<ResumenAbonosResponse>(
    `matriculas-pagos-abonos/resumen/${matriculaPagoId}`
  );
};

/**
 * Registrar un abono
 * POST /api/matriculas-pagos-abonos
 *
 * El monto no puede exceder el saldo pendiente del pago.
 */
export const crearAbonoApi = async (
  data: CrearAbonoData
): Promise<CrearAbonoResponse> => {
  return await apiService.post<CrearAbonoResponse>('matriculas-pagos-abonos', data);
};

/**
 * Eliminar un abono
 * DELETE /api/matriculas-pagos-abonos/{id}
 */
export const eliminarAbonoApi = async (
  id: string
): Promise<{ success: boolean; message: string }> => {
  return await apiService.delete<{ success: boolean; message: string }>(
    `matriculas-pagos-abonos/${id}`
  );
};

/**
 * Datos de empresa
 */
export interface EmpresaData {
  id: string;
  nombre: string;
  identificacion: string;
  correo: string;
  telefono: string;
  pathLogo: string | null;
  estado: boolean;
  fechaCreacion: string;
}

interface ObtenerEmpresaResponse {
  success: boolean;
  data: EmpresaData;
  message: string;
}

/**
 * Obtener datos de mi empresa
 * GET /api/mi-empresa
 */
export const obtenerMiEmpresaApi = async (): Promise<ObtenerEmpresaResponse> => {
  return await apiService.get<ObtenerEmpresaResponse>('mi-empresa');
};
