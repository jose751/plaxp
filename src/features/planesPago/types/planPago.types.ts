/**
 * Tipos para el feature de Planes de Pago
 */

/**
 * Tipos de pago disponibles
 */
export const TipoPago = {
  UNICO: 1,
  RECURRENTE: 2,
  CUOTAS: 3,
} as const;

export type TipoPago = (typeof TipoPago)[keyof typeof TipoPago];

/**
 * Unidades de periodicidad para pagos recurrentes
 */
export const PeriodicidadUnidad = {
  DIAS: 1,
  SEMANAS: 2,
  MESES: 3,
  ANIOS: 4,
} as const;

export type PeriodicidadUnidad = (typeof PeriodicidadUnidad)[keyof typeof PeriodicidadUnidad];

/**
 * Plan de Pago - Entidad principal
 */
export interface PlanPago {
  id: string;
  empresaId: string;
  nombre: string;
  descripcion: string | null;
  tipoPago: TipoPago;
  idMoneda: string;
  idImpuesto: string;
  subtotal: number;
  total: number;
  periodicidadValor: number | null;
  idPeriodicidadUnidad: PeriodicidadUnidad | null;
  numeroCuotas: number | null;
  subtotalFinal: number | null;
  totalFinal: number | null;
  activo: boolean;
  fechaCreacion: string;
  ultimaModificacion: string;
  // Campos adicionales que pueden venir del API con joins
  moneda?: {
    id: string;
    codigo: string;
    nombre: string;
    simbolo: string;
  };
  impuesto?: {
    id: string;
    nombre: string;
    codigo: string;
    tasa: number;
  };
}

/**
 * Información de paginación
 */
export interface PlanPagoPaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Respuesta de listar planes de pago con paginación
 * GET /api/planes-pago
 */
export interface ListarPlanesPagoResponse {
  success: boolean;
  message: string;
  data: {
    planesPago: PlanPago[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Parámetros para listar planes de pago
 */
export interface ListarPlanesPagoParams {
  page?: number;
  limit?: number;
  q?: string;
  tipoPago?: TipoPago;
  activo?: boolean;
  idMoneda?: string;
}

/**
 * Datos para crear un nuevo plan de pago
 * POST /api/planes-pago
 */
export interface CrearPlanPagoData {
  nombre: string;
  descripcion?: string;
  tipoPago: TipoPago;
  idMoneda: string;
  idImpuesto: string;
  subtotal: number;
  total: number;
  periodicidadValor?: number;
  idPeriodicidadUnidad?: PeriodicidadUnidad;
  numeroCuotas?: number;
  subtotalFinal?: number;
  totalFinal?: number;
  activo?: boolean;
}

/**
 * Respuesta de crear plan de pago
 */
export interface CrearPlanPagoResponse {
  success: boolean;
  data: PlanPago;
  message: string;
}

/**
 * Datos para actualizar un plan de pago
 * PUT /api/planes-pago/{id}
 */
export interface ActualizarPlanPagoData {
  nombre?: string;
  descripcion?: string;
  tipoPago?: TipoPago;
  idMoneda?: string;
  idImpuesto?: string;
  subtotal?: number;
  total?: number;
  periodicidadValor?: number;
  idPeriodicidadUnidad?: PeriodicidadUnidad;
  numeroCuotas?: number;
  subtotalFinal?: number;
  totalFinal?: number;
  activo?: boolean;
}

/**
 * Respuesta de actualizar plan de pago
 */
export interface ActualizarPlanPagoResponse {
  success: boolean;
  data: PlanPago;
  message: string;
}

/**
 * Respuesta de obtener plan de pago por ID
 * GET /api/planes-pago/{id}
 */
export interface ObtenerPlanPagoResponse {
  success: boolean;
  data: PlanPago;
  message: string;
}

/**
 * Respuesta de eliminar plan de pago
 * DELETE /api/planes-pago/{id}
 */
export interface EliminarPlanPagoResponse {
  success: boolean;
  message: string;
  data: null;
}

/**
 * Impuesto - Para el selector
 */
export interface Impuesto {
  id: string;
  paisId: string;
  nombre: string;
  codigo: string;
  tasa: number;
  esExento: boolean;
  descripcion: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/**
 * Respuesta de listar impuestos
 * GET /api/impuestos
 */
export interface ListarImpuestosResponse {
  success: boolean;
  data: Impuesto[];
  message: string;
}

/**
 * Parámetros para listar impuestos
 */
export interface ListarImpuestosParams {
  activo?: boolean;
  codigo?: string;
  nombre?: string;
}

/**
 * Moneda - Para el selector
 */
export interface Moneda {
  id: string;
  codigo: string;
  nombre: string;
  simbolo: string;
  activo: boolean;
  creadoEn: string;
  actualizadoEn: string;
}

/**
 * Respuesta de listar monedas
 * GET /api/monedas
 */
export interface ListarMonedasResponse {
  success: boolean;
  data: Moneda[];
  message: string;
}

/**
 * Parámetros para listar monedas
 */
export interface ListarMonedasParams {
  activo?: boolean;
  codigo?: string;
  nombre?: string;
}
