// Pages
export { ReportesPage } from './pages/ReportesPage';

// Components
export { RecaudacionDiariaReporte } from './components/RecaudacionDiariaReporte';
export { RecaudacionMensualReporte } from './components/RecaudacionMensualReporte';
export { IngresosPorPlanReporte } from './components/IngresosPorPlanReporte';
export { IngresosPorSucursalReporte } from './components/IngresosPorSucursalReporte';

// API
export {
  obtenerRecaudacionDiariaApi,
  obtenerRecaudacionMensualApi,
  obtenerIngresosPorPlanApi,
  obtenerIngresosPorSucursalApi,
} from './api/reportesApi';

// Types
export type {
  TipoReporte,
  RecaudacionDiariaData,
  RecaudacionDiariaResponse,
  RecaudacionMensualData,
  RecaudacionMensualResponse,
  RecaudacionMensualParams,
  IngresosPorPlanData,
  IngresosPorPlanResponse,
  IngresosPorPlanParams,
  IngresosPorSucursalData,
  IngresosPorSucursalResponse,
  IngresosPorSucursalParams,
} from './types/reportes.types';

// Utils
export {
  exportRecaudacionDiariaToExcel,
  exportRecaudacionMensualToExcel,
  exportIngresosPorPlanToExcel,
  exportIngresosPorSucursalToExcel,
} from './utils/exportToExcel';
