import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { HiCurrencyDollar, HiDocumentText, HiDownload, HiRefresh, HiCalendar } from 'react-icons/hi';
import { obtenerIngresosPorPlanApi } from '../api/reportesApi';
import { exportIngresosPorPlanToExcel } from '../utils/exportToExcel';
import type { IngresosPorPlanData } from '../types/reportes.types';

const COLORS = ['#8b5cf6', '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const formatMoney = (n: number) =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const getTipoPagoLabel = (tipo: number): string => {
  switch (tipo) {
    case 1:
      return 'Pago Único';
    case 2:
      return 'Recurrente';
    case 3:
      return 'Cuotas';
    default:
      return 'Otro';
  }
};

const getTipoPagoBadgeColor = (tipo: number): string => {
  switch (tipo) {
    case 1:
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 2:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
    case 3:
      return 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900/20 dark:text-neutral-400';
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-dark-card px-4 py-3 rounded-xl shadow-xl border border-neutral-100 dark:border-dark-border">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white">{data.planPagoNombre || data.name}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {formatMoney(data.totalRecaudado || data.value)}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          {data.cantidadMatriculas} matrículas
        </p>
        <p className="text-xs text-neutral-500">
          {data.porcentajeDelTotal?.toFixed(1)}% del total
        </p>
      </div>
    );
  }
  return null;
};

export const IngresosPorPlanReporte: React.FC = () => {
  const [fechaInicio, setFechaInicio] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [fechaFin, setFechaFin] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [data, setData] = useState<IngresosPorPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerIngresosPorPlanApi({ fechaInicio, fechaFin });
      if (response.success) {
        setData(response.data);
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.message || 'Error al obtener los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fechaInicio, fechaFin]);

  const chartData = useMemo(() => {
    if (!data?.planes) return [];
    return data.planes.map((item, index) => ({
      ...item,
      name: item.planPagoNombre,
      value: item.totalRecaudado,
      color: COLORS[index % COLORS.length],
    }));
  }, [data]);

  const handleExport = () => {
    if (data) {
      exportIngresosPorPlanToExcel(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30">
            <HiDocumentText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Ingresos por Plan de Pago</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Desglose de recaudación por tipo de plan</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="px-4 py-2 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-card text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-neutral-500 dark:text-neutral-400">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="px-4 py-2 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-card text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-100 dark:bg-dark-card border border-neutral-200 dark:border-dark-border text-neutral-500 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all disabled:opacity-50"
          >
            <HiRefresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExport}
            disabled={!data || loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiDownload className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">{error}</p>
          <button
            onClick={fetchData}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Datos */}
      {data && !loading && !error && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg shadow-amber-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiCalendar className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium opacity-90">Período</span>
              </div>
              <p className="text-base font-bold">
                {new Date(data.fechaInicio).toLocaleDateString('es-CR', { day: 'numeric', month: 'short' })} - {new Date(data.fechaFin).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiCurrencyDollar className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium opacity-90">Total General</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(data.totalGeneral)}</p>
            </div>

            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiDocumentText className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium opacity-90">Planes de Pago</span>
              </div>
              <p className="text-2xl font-bold">{data.planes.length}</p>
            </div>
          </div>

          {/* Gráficos */}
          {chartData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 dark:border-dark-border">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Distribución por Plan</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Porcentaje del total</p>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-4">
                    {chartData.slice(0, 6).map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-neutral-600 dark:text-neutral-400 max-w-[100px] truncate">{item.planPagoNombre}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-100 dark:border-dark-border">
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Monto por Plan</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">En colones</p>
                </div>
                <div className="p-6">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData.slice(0, 6)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        tickFormatter={(v) => `₡${(v / 1000).toFixed(0)}K`}
                      />
                      <YAxis
                        type="category"
                        dataKey="planPagoNombre"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 500 }}
                        width={120}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="totalRecaudado" radius={[0, 8, 8, 0]} barSize={24}>
                        {chartData.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-dark-bg flex items-center justify-center mx-auto mb-4">
                <HiDocumentText className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400">No hay datos para el período seleccionado</p>
            </div>
          )}

          {/* Tabla de desglose */}
          {chartData.length > 0 && (
            <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-neutral-100 dark:border-dark-border">
                <h3 className="font-semibold text-neutral-900 dark:text-white">Detalle por Plan de Pago</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 dark:bg-dark-bg">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Plan de Pago
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Matrículas
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                        % del Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-dark-border">
                    {chartData.map((item, index) => (
                      <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-dark-hover transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="font-medium text-neutral-900 dark:text-white">{item.planPagoNombre}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoPagoBadgeColor(item.tipoPago)}`}>
                            {getTipoPagoLabel(item.tipoPago)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">
                          {item.cantidadMatriculas}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">
                          {formatMoney(item.totalRecaudado)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
                            {item.porcentajeDelTotal.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-neutral-50 dark:bg-dark-bg">
                    <tr>
                      <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-white" colSpan={2}>Total</td>
                      <td className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">
                        {chartData.reduce((acc, item) => acc + item.cantidadMatriculas, 0)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(data.totalGeneral)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                          100%
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
