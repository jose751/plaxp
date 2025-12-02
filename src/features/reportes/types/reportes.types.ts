/**
 * Types para los reportes financieros
 */

// ==================== Recaudación Diaria ====================
export interface DesglosePorMetodoPago {
  metodoPago: string;
  cantidad: number;
  total: number;
}

export interface RecaudacionDiariaData {
  fecha: string;
  totalRecaudado: number;
  cantidadTransacciones: number;
  desglosePorMetodoPago: DesglosePorMetodoPago[];
}

export interface RecaudacionDiariaResponse {
  success: boolean;
  message: string;
  data: RecaudacionDiariaData;
}

// ==================== Recaudación Mensual ====================
export interface MesData {
  anio: number;
  mes: number;
  nombreMes: string;
  totalRecaudado: number;
  cantidadTransacciones: number;
}

export interface RecaudacionMensualData {
  mesActual: MesData;
  mesesAnteriores: MesData[];
  variacionPorcentual: number | null;
}

export interface RecaudacionMensualResponse {
  success: boolean;
  message: string;
  data: RecaudacionMensualData;
}

export interface RecaudacionMensualParams {
  anio?: number;
  mes?: number;
  mesesComparar?: number;
}

// ==================== Ingresos por Plan ====================
export interface PlanIngreso {
  planPagoId: string;
  planPagoNombre: string;
  tipoPago: number;
  tipoPagoNombre: string;
  cantidadMatriculas: number;
  totalRecaudado: number;
  porcentajeDelTotal: number;
}

export interface IngresosPorPlanData {
  fechaInicio: string;
  fechaFin: string;
  totalGeneral: number;
  planes: PlanIngreso[];
}

export interface IngresosPorPlanResponse {
  success: boolean;
  message: string;
  data: IngresosPorPlanData;
}

export interface IngresosPorPlanParams {
  fechaInicio?: string;
  fechaFin?: string;
  limite?: number;
}

// ==================== Ingresos por Sucursal ====================
export interface SucursalIngreso {
  sucursalId: string;
  sucursalNombre: string;
  cantidadTransacciones: number;
  totalRecaudado: number;
  porcentajeDelTotal: number;
}

export interface IngresosPorSucursalData {
  fechaInicio: string;
  fechaFin: string;
  totalGeneral: number;
  sucursales: SucursalIngreso[];
}

export interface IngresosPorSucursalResponse {
  success: boolean;
  message: string;
  data: IngresosPorSucursalData;
}

export interface IngresosPorSucursalParams {
  fechaInicio?: string;
  fechaFin?: string;
}

// ==================== Tipo de reporte activo ====================
export type TipoReporte =
  | 'recaudacion-diaria'
  | 'recaudacion-mensual'
  | 'ingresos-por-plan'
  | 'ingresos-por-sucursal';
