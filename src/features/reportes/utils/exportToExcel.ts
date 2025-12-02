import * as XLSX from 'xlsx';
import type {
  RecaudacionDiariaData,
  RecaudacionMensualData,
  IngresosPorPlanData,
  IngresosPorSucursalData,
} from '../types/reportes.types';

/**
 * Utilidades para exportar reportes a Excel
 */

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const downloadExcel = (workbook: XLSX.WorkBook, filename: string): void => {
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exportar Recaudación Diaria a Excel
 */
export const exportRecaudacionDiariaToExcel = (data: RecaudacionDiariaData): void => {
  const workbook = XLSX.utils.book_new();

  // Hoja de resumen
  const resumenData = [
    ['REPORTE DE RECAUDACIÓN DIARIA'],
    [],
    ['Fecha:', formatDate(data.fecha)],
    ['Total Recaudado:', formatCurrency(data.totalRecaudado)],
    ['Cantidad de Transacciones:', data.cantidadTransacciones],
    [],
    [],
    ['DESGLOSE POR MÉTODO DE PAGO'],
    ['Método de Pago', 'Cantidad', 'Total'],
    ...data.desglosePorMetodoPago.map((item) => [
      item.metodoPago,
      item.cantidad,
      formatCurrency(item.total),
    ]),
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);

  // Ajustar anchos de columna
  wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }];

  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Recaudación Diaria');

  const fechaArchivo = data.fecha.split('T')[0];
  downloadExcel(workbook, `recaudacion_diaria_${fechaArchivo}`);
};

/**
 * Exportar Recaudación Mensual a Excel
 */
export const exportRecaudacionMensualToExcel = (data: RecaudacionMensualData): void => {
  const workbook = XLSX.utils.book_new();

  // Hoja de resumen
  const resumenData = [
    ['REPORTE DE RECAUDACIÓN MENSUAL'],
    [],
    ['MES ACTUAL'],
    ['Año:', data.mesActual.anio],
    ['Mes:', data.mesActual.nombreMes],
    ['Total Recaudado:', formatCurrency(data.mesActual.totalRecaudado)],
    ['Cantidad de Transacciones:', data.mesActual.cantidadTransacciones],
    [],
    ['Variación vs mes anterior:', `${data.variacionPorcentual >= 0 ? '+' : ''}${data.variacionPorcentual.toFixed(1)}%`],
    [],
    [],
    ['COMPARATIVO DE MESES ANTERIORES'],
    ['Año', 'Mes', 'Total Recaudado', 'Transacciones'],
    ...data.mesesAnteriores.map((mes) => [
      mes.anio,
      mes.nombreMes,
      formatCurrency(mes.totalRecaudado),
      mes.cantidadTransacciones,
    ]),
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];

  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Recaudación Mensual');

  downloadExcel(workbook, `recaudacion_mensual_${data.mesActual.anio}_${data.mesActual.mes}`);
};

/**
 * Exportar Ingresos por Plan a Excel
 */
export const exportIngresosPorPlanToExcel = (data: IngresosPorPlanData): void => {
  const workbook = XLSX.utils.book_new();

  const getTipoPagoLabel = (tipo: number): string => {
    switch (tipo) {
      case 1:
        return 'Único';
      case 2:
        return 'Recurrente';
      case 3:
        return 'Cuotas';
      default:
        return 'Desconocido';
    }
  };

  const resumenData = [
    ['REPORTE DE INGRESOS POR PLAN DE PAGO'],
    [],
    ['Período:', `${formatDate(data.fechaInicio)} - ${formatDate(data.fechaFin)}`],
    ['Total General:', formatCurrency(data.totalGeneral)],
    [],
    [],
    ['DETALLE POR PLAN'],
    ['Plan de Pago', 'Tipo de Pago', 'Matrículas', 'Total Recaudado', '% del Total'],
    ...data.planes.map((plan) => [
      plan.planPagoNombre,
      getTipoPagoLabel(plan.tipoPago),
      plan.cantidadMatriculas,
      formatCurrency(plan.totalRecaudado),
      `${plan.porcentajeDelTotal.toFixed(2)}%`,
    ]),
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Ingresos por Plan');

  const fechaInicio = data.fechaInicio.split('T')[0];
  const fechaFin = data.fechaFin.split('T')[0];
  downloadExcel(workbook, `ingresos_por_plan_${fechaInicio}_${fechaFin}`);
};

/**
 * Exportar Ingresos por Sucursal a Excel
 */
export const exportIngresosPorSucursalToExcel = (data: IngresosPorSucursalData): void => {
  const workbook = XLSX.utils.book_new();

  const resumenData = [
    ['REPORTE DE INGRESOS POR SUCURSAL'],
    [],
    ['Período:', `${formatDate(data.fechaInicio)} - ${formatDate(data.fechaFin)}`],
    ['Total General:', formatCurrency(data.totalGeneral)],
    [],
    [],
    ['DETALLE POR SUCURSAL'],
    ['Sucursal', 'Transacciones', 'Total Recaudado', '% del Total'],
    ...data.sucursales.map((sucursal) => [
      sucursal.sucursalNombre,
      sucursal.cantidadTransacciones,
      formatCurrency(sucursal.totalRecaudado),
      `${sucursal.porcentajeDelTotal.toFixed(2)}%`,
    ]),
  ];

  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  wsResumen['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 12 }];

  XLSX.utils.book_append_sheet(workbook, wsResumen, 'Ingresos por Sucursal');

  const fechaInicio = data.fechaInicio.split('T')[0];
  const fechaFin = data.fechaFin.split('T')[0];
  downloadExcel(workbook, `ingresos_por_sucursal_${fechaInicio}_${fechaFin}`);
};
