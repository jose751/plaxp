import React, { useState } from 'react';
import { HiCalendar, HiChartBar, HiDocumentText, HiOfficeBuilding, HiCurrencyDollar } from 'react-icons/hi';
import { RecaudacionDiariaReporte } from '../components/RecaudacionDiariaReporte';
import { RecaudacionMensualReporte } from '../components/RecaudacionMensualReporte';
import { IngresosPorPlanReporte } from '../components/IngresosPorPlanReporte';
import { IngresosPorSucursalReporte } from '../components/IngresosPorSucursalReporte';
import type { TipoReporte } from '../types/reportes.types';

interface ReporteTab {
  id: TipoReporte;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadowColor: string;
}

const tabs: ReporteTab[] = [
  {
    id: 'recaudacion-diaria',
    label: 'Recaudación Diaria',
    description: 'Ingresos del día',
    icon: HiCalendar,
    gradient: 'from-blue-500 to-blue-600',
    shadowColor: 'shadow-blue-500/25',
  },
  {
    id: 'recaudacion-mensual',
    label: 'Recaudación Mensual',
    description: 'Comparativo mensual',
    icon: HiChartBar,
    gradient: 'from-violet-500 to-purple-600',
    shadowColor: 'shadow-violet-500/25',
  },
  {
    id: 'ingresos-por-plan',
    label: 'Ingresos por Plan',
    description: 'Por tipo de plan',
    icon: HiDocumentText,
    gradient: 'from-amber-500 to-orange-600',
    shadowColor: 'shadow-amber-500/25',
  },
  {
    id: 'ingresos-por-sucursal',
    label: 'Ingresos por Sucursal',
    description: 'Por ubicación',
    icon: HiOfficeBuilding,
    gradient: 'from-emerald-500 to-teal-600',
    shadowColor: 'shadow-emerald-500/25',
  },
];

export const ReportesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TipoReporte>('recaudacion-diaria');

  const renderReporte = () => {
    switch (activeTab) {
      case 'recaudacion-diaria':
        return <RecaudacionDiariaReporte />;
      case 'recaudacion-mensual':
        return <RecaudacionMensualReporte />;
      case 'ingresos-por-plan':
        return <IngresosPorPlanReporte />;
      case 'ingresos-por-sucursal':
        return <IngresosPorSucursalReporte />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30">
            <HiCurrencyDollar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reportes Financieros</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">Analiza los ingresos y recaudaciones</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-dark-border">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative group flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg ${tab.shadowColor}`
                      : 'bg-neutral-50 dark:bg-dark-bg hover:bg-neutral-100 dark:hover:bg-dark-hover text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    isActive
                      ? 'bg-white/20'
                      : 'bg-white dark:bg-dark-card shadow-sm'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      isActive
                        ? 'text-white'
                        : 'text-neutral-500 dark:text-neutral-400'
                    }`} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-sm font-semibold truncate ${
                      isActive ? 'text-white' : 'text-neutral-900 dark:text-white'
                    }`}>
                      {tab.label}
                    </p>
                    <p className={`text-xs truncate ${
                      isActive ? 'text-white/80' : 'text-neutral-500 dark:text-neutral-400'
                    }`}>
                      {tab.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenido del reporte */}
        <div className="p-6">
          {renderReporte()}
        </div>
      </div>
    </div>
  );
};
