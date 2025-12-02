import React, { useState, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
} from 'recharts';
import { HiCalendar, HiCurrencyDollar, HiTrendingUp, HiTrendingDown, HiDownload, HiRefresh, HiChartBar } from 'react-icons/hi';
import { obtenerRecaudacionMensualApi } from '../api/reportesApi';
import { exportRecaudacionMensualToExcel } from '../utils/exportToExcel';
import type { RecaudacionMensualData } from '../types/reportes.types';

const formatMoney = (n: number) =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-dark-card px-4 py-3 rounded-xl shadow-xl border border-neutral-100 dark:border-dark-border">
        <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{entry.name}:</span>
            <span className="text-xs font-bold text-neutral-900 dark:text-white">
              {entry.name === 'Total' ? formatMoney(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RecaudacionMensualReporte: React.FC = () => {
  const currentDate = new Date();
  const [anio, setAnio] = useState<number>(currentDate.getFullYear());
  const [mes, setMes] = useState<number>(currentDate.getMonth() + 1);
  const [mesesComparar, setMesesComparar] = useState<number>(5);
  const [data, setData] = useState<RecaudacionMensualData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerRecaudacionMensualApi({ anio, mes, mesesComparar });
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
  }, [anio, mes, mesesComparar]);

  const chartData = useMemo(() => {
    if (!data) return [];

    const allMonths = [
      ...data.mesesAnteriores.map((m) => ({
        nombre: `${m.nombreMes.substring(0, 3)} ${m.anio}`,
        total: m.totalRecaudado,
        transacciones: m.cantidadTransacciones,
        esActual: false,
      })),
      {
        nombre: `${data.mesActual.nombreMes.substring(0, 3)} ${data.mesActual.anio}`,
        total: data.mesActual.totalRecaudado,
        transacciones: data.mesActual.cantidadTransacciones,
        esActual: true,
      },
    ].reverse();

    // Calcular promedio
    const promedio = allMonths.reduce((acc, m) => acc + m.total, 0) / allMonths.length;

    return allMonths.reverse().map((m) => ({
      ...m,
      promedio,
    }));
  }, [data]);

  const handleExport = () => {
    if (data) {
      exportRecaudacionMensualToExcel(data);
    }
  };

  // Generar años disponibles (últimos 5 años)
  const aniosDisponibles = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Header con filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/30">
            <HiChartBar className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Recaudación Mensual</h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Comparativo de meses anteriores</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="px-4 py-2 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-card text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          >
            {aniosDisponibles.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            value={mes}
            onChange={(e) => setMes(Number(e.target.value))}
            className="px-4 py-2 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-card text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          >
            {MESES.map((m, index) => (
              <option key={index} value={index + 1}>{m}</option>
            ))}
          </select>

          <select
            value={mesesComparar}
            onChange={(e) => setMesesComparar(Number(e.target.value))}
            className="px-4 py-2 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-card text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
          >
            {[3, 5, 6, 9, 11].map((n) => (
              <option key={n} value={n}>Últimos {n + 1} meses</option>
            ))}
          </select>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-neutral-100 dark:bg-dark-card border border-neutral-200 dark:border-dark-border text-neutral-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all disabled:opacity-50"
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
          <div className="w-12 h-12 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
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
            className="px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-violet-500/25 transition-all"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Datos */}
      {data && !loading && !error && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 text-white shadow-lg shadow-violet-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiCalendar className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium opacity-90">Mes Actual</span>
              </div>
              <p className="text-xl font-bold">{data.mesActual.nombreMes} {data.mesActual.anio}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiCurrencyDollar className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium opacity-90">Total Recaudado</span>
              </div>
              <p className="text-2xl font-bold">{formatMoney(data.mesActual.totalRecaudado)}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg shadow-blue-500/30">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <HiChartBar className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium opacity-90">Transacciones</span>
              </div>
              <p className="text-2xl font-bold">{data.mesActual.cantidadTransacciones}</p>
            </div>

            <div className={`bg-gradient-to-br ${(data.variacionPorcentual ?? 0) >= 0 ? 'from-emerald-500 to-green-600 shadow-emerald-500/30' : 'from-rose-500 to-red-600 shadow-rose-500/30'} rounded-2xl p-5 text-white shadow-lg`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  {(data.variacionPorcentual ?? 0) >= 0 ? (
                    <HiTrendingUp className="w-5 h-5" />
                  ) : (
                    <HiTrendingDown className="w-5 h-5" />
                  )}
                </div>
                <span className="text-sm font-medium opacity-90">Variación vs Anterior</span>
              </div>
              <p className="text-2xl font-bold">
                {(data.variacionPorcentual ?? 0) >= 0 ? '+' : ''}{(data.variacionPorcentual ?? 0).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Gráfico */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white">Tendencia de Recaudación</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Comparativo mensual con línea de promedio</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-violet-500" />
                    <span className="text-neutral-500">Recaudado</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-emerald-500 rounded-full" />
                    <span className="text-neutral-500">Promedio</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="nombre"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9ca3af', fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    tickFormatter={(v) => `₡${(v / 1000000).toFixed(1)}M`}
                    width={70}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    fill="url(#colorTotal)"
                    stroke="none"
                  />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                    barSize={40}
                  />
                  <Line
                    type="monotone"
                    dataKey="promedio"
                    name="Promedio"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla comparativa */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 dark:border-dark-border">
              <h3 className="font-semibold text-neutral-900 dark:text-white">Detalle por Mes</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-dark-bg">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Mes
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Transacciones
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                      Total Recaudado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-dark-border">
                  <tr className="bg-violet-50 dark:bg-violet-900/10">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400">
                          Actual
                        </span>
                        <span className="font-medium text-neutral-900 dark:text-white">
                          {data.mesActual.nombreMes} {data.mesActual.anio}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">
                      {data.mesActual.cantidadTransacciones}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(data.mesActual.totalRecaudado)}
                    </td>
                  </tr>
                  {data.mesesAnteriores.map((mes, index) => (
                    <tr key={index} className="hover:bg-neutral-50 dark:hover:bg-dark-hover transition-colors">
                      <td className="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                        {mes.nombreMes} {mes.anio}
                      </td>
                      <td className="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">
                        {mes.cantidadTransacciones}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-neutral-900 dark:text-white">
                        {formatMoney(mes.totalRecaudado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
