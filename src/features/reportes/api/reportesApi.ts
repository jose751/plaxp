import { apiService } from '../../../shared/services/apiService';
import type {
  RecaudacionDiariaResponse,
  RecaudacionMensualResponse,
  RecaudacionMensualParams,
  IngresosPorPlanResponse,
  IngresosPorPlanParams,
  IngresosPorSucursalResponse,
  IngresosPorSucursalParams,
} from '../types/reportes.types';

/**
 * Obtener recaudación diaria
 * GET /api/reportes/recaudacion-diaria
 *
 * @param fecha - Fecha en formato YYYY-MM-DD (opcional, default: fecha actual)
 */
export const obtenerRecaudacionDiariaApi = async (
  fecha?: string
): Promise<RecaudacionDiariaResponse> => {
  const params: Record<string, any> = {};

  if (fecha) {
    params.fecha = fecha;
  }

  return await apiService.get<RecaudacionDiariaResponse>(
    'reportes/recaudacion-diaria',
    params
  );
};

/**
 * Obtener recaudación mensual con comparativo
 * GET /api/reportes/recaudacion-mensual
 *
 * @param params - Parámetros opcionales (anio, mes, mesesComparar)
 */
export const obtenerRecaudacionMensualApi = async (
  params?: RecaudacionMensualParams
): Promise<RecaudacionMensualResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.anio) {
    queryParams.anio = params.anio;
  }

  if (params?.mes) {
    queryParams.mes = params.mes;
  }

  if (params?.mesesComparar) {
    queryParams.mesesComparar = params.mesesComparar;
  }

  return await apiService.get<RecaudacionMensualResponse>(
    'reportes/recaudacion-mensual',
    queryParams
  );
};

/**
 * Obtener ingresos por plan de pago
 * GET /api/reportes/ingresos-por-plan
 *
 * @param params - Parámetros opcionales (fechaInicio, fechaFin, limite)
 */
export const obtenerIngresosPorPlanApi = async (
  params?: IngresosPorPlanParams
): Promise<IngresosPorPlanResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.fechaInicio) {
    queryParams.fechaInicio = params.fechaInicio;
  }

  if (params?.fechaFin) {
    queryParams.fechaFin = params.fechaFin;
  }

  if (params?.limite) {
    queryParams.limite = params.limite;
  }

  return await apiService.get<IngresosPorPlanResponse>(
    'reportes/ingresos-por-plan',
    queryParams
  );
};

/**
 * Obtener ingresos por sucursal
 * GET /api/reportes/ingresos-por-sucursal
 *
 * @param params - Parámetros opcionales (fechaInicio, fechaFin)
 */
export const obtenerIngresosPorSucursalApi = async (
  params?: IngresosPorSucursalParams
): Promise<IngresosPorSucursalResponse> => {
  const queryParams: Record<string, any> = {};

  if (params?.fechaInicio) {
    queryParams.fechaInicio = params.fechaInicio;
  }

  if (params?.fechaFin) {
    queryParams.fechaFin = params.fechaFin;
  }

  return await apiService.get<IngresosPorSucursalResponse>(
    'reportes/ingresos-por-sucursal',
    queryParams
  );
};
