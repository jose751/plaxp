import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCreditCard,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaDollarSign,
  FaSync,
  FaLayerGroup,
  FaPercentage,
  FaCoins,
  FaClock,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerPlanPagoPorIdApi, listarImpuestosApi, listarMonedasApi } from '../api/planesPagoApi';
import type { PlanPago, Impuesto, Moneda } from '../types/planPago.types';
import { TipoPago, PeriodicidadUnidad } from '../types/planPago.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const ViewPlanPagoPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [plan, setPlan] = useState<PlanPago | null>(null);
  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const [planRes, impuestosRes, monedasRes] = await Promise.all([
        obtenerPlanPagoPorIdApi(id),
        listarImpuestosApi({ activo: true }),
        listarMonedasApi({ activo: true }),
      ]);

      setPlan(planRes.data);
      if (impuestosRes.success) setImpuestos(impuestosRes.data);
      if (monedasRes.success) setMonedas(monedasRes.data);
    } catch (err: any) {
      console.error('Error al obtener plan de pago:', err);
      setError(err.message || 'Error al cargar los detalles del plan de pago');
    } finally {
      setLoading(false);
    }
  };

  const getMoneda = (idMoneda: string): Moneda | undefined => {
    return monedas.find((m) => m.id === idMoneda);
  };

  const getImpuesto = (idImpuesto: string): Impuesto | undefined => {
    return impuestos.find((i) => i.id === idImpuesto);
  };

  const formatMonto = (monto: number, moneda?: Moneda): string => {
    const simbolo = moneda?.simbolo || '$';
    return `${simbolo}${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTipoPagoInfo = (tipoPago: TipoPago) => {
    switch (tipoPago) {
      case TipoPago.UNICO:
        return {
          label: 'Pago Único',
          description: 'Una sola transacción',
          bgClass: 'bg-blue-50 dark:bg-blue-900/30',
          textClass: 'text-blue-700 dark:text-blue-400',
          borderClass: 'border-blue-200 dark:border-blue-800',
          icon: <FaDollarSign className="w-4 h-4" />,
        };
      case TipoPago.RECURRENTE:
        return {
          label: 'Recurrente',
          description: 'Cobros periódicos',
          bgClass: 'bg-purple-50 dark:bg-purple-900/30',
          textClass: 'text-purple-700 dark:text-purple-400',
          borderClass: 'border-purple-200 dark:border-purple-800',
          icon: <FaSync className="w-4 h-4" />,
        };
      case TipoPago.CUOTAS:
        return {
          label: 'Cuotas',
          description: 'Pagos fraccionados',
          bgClass: 'bg-amber-50 dark:bg-amber-900/30',
          textClass: 'text-amber-700 dark:text-amber-400',
          borderClass: 'border-amber-200 dark:border-amber-800',
          icon: <FaLayerGroup className="w-4 h-4" />,
        };
      default:
        return {
          label: 'Desconocido',
          description: '',
          bgClass: 'bg-neutral-50 dark:bg-neutral-900/30',
          textClass: 'text-neutral-700 dark:text-neutral-400',
          borderClass: 'border-neutral-200 dark:border-neutral-800',
          icon: null,
        };
    }
  };

  const getPeriodicidadLabel = (valor: number, unidad: PeriodicidadUnidad): string => {
    const unidadLabels: Record<PeriodicidadUnidad, { singular: string; plural: string }> = {
      [PeriodicidadUnidad.DIAS]: { singular: 'día', plural: 'días' },
      [PeriodicidadUnidad.SEMANAS]: { singular: 'semana', plural: 'semanas' },
      [PeriodicidadUnidad.MESES]: { singular: 'mes', plural: 'meses' },
      [PeriodicidadUnidad.ANIOS]: { singular: 'año', plural: 'años' },
    };

    const label = unidadLabels[unidad];
    return `Cada ${valor} ${valor === 1 ? label.singular : label.plural}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-rose-600 dark:text-rose-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Cargando información del plan de pago...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex flex-col items-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 mb-4">
            <FaTimesCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">
            Error al cargar el plan de pago
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/planes-pago')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Planes de Pago
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  const tipoPagoInfo = getTipoPagoInfo(plan.tipoPago);
  const moneda = getMoneda(plan.idMoneda);
  const impuesto = getImpuesto(plan.idImpuesto);

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/planes-pago')}
          className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Planes de Pago</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-500/30">
              <FaCreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Detalles del Plan de Pago
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Información completa del plan
              </p>
            </div>
          </div>
          {hasPermission('planes-pago.editar') && (
            <button
              onClick={() => navigate(`/planes-pago/edit/${plan.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
            >
              <FaEdit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {plan.nombre}
            </h2>
            {plan.descripcion && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{plan.descripcion}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${tipoPagoInfo.bgClass} ${tipoPagoInfo.textClass} border ${tipoPagoInfo.borderClass}`}
            >
              {tipoPagoInfo.icon}
              {tipoPagoInfo.label}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${
                plan.activo
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {plan.activo ? (
                <FaCheckCircle className="w-3 h-3" />
              ) : (
                <FaTimesCircle className="w-3 h-3" />
              )}
              {plan.activo ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>

        {/* Configuración Financiera */}
        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            Configuración Financiera
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Moneda
              </label>
              <div className="flex items-center gap-2">
                <FaCoins className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {moneda ? `${moneda.codigo} - ${moneda.nombre}` : plan.idMoneda}
                </span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Impuesto
              </label>
              <div className="flex items-center gap-2">
                <FaPercentage className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {impuesto ? `${impuesto.nombre} (${impuesto.tasa}%)` : plan.idImpuesto}
                </span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Subtotal
              </label>
              <div className="flex items-center gap-2">
                <FaDollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {formatMonto(plan.subtotal, moneda)}
                </span>
              </div>
            </div>

            <div className="pb-3 md:pb-0">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Total
              </label>
              <div className="flex items-center gap-2">
                <FaDollarSign className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {formatMonto(plan.total, moneda)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración Recurrente */}
        {plan.tipoPago === TipoPago.RECURRENTE &&
          plan.periodicidadValor &&
          plan.idPeriodicidadUnidad && (
            <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-dark-border">
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
                Configuración de Periodicidad
              </h3>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                    <FaSync className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-200">
                      {getPeriodicidadLabel(plan.periodicidadValor, plan.idPeriodicidadUnidad)}
                    </p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      Se cobrará {formatMonto(plan.total, moneda)} de forma recurrente
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Configuración Cuotas */}
        {plan.tipoPago === TipoPago.CUOTAS && plan.numeroCuotas && (
          <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-dark-border">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
              Configuración de Cuotas
            </h3>
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                  <FaLayerGroup className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                    {plan.numeroCuotas} cuotas de {formatMonto(plan.total, moneda)}
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Pago fraccionado en cuotas fijas
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-dark-bg rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                    Subtotal Final
                  </p>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {formatMonto(plan.subtotalFinal || 0, moneda)}
                  </p>
                </div>
                <div className="bg-white dark:bg-dark-bg rounded-lg p-3 border border-amber-200 dark:border-amber-700">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Total Final</p>
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    {formatMonto(plan.totalFinal || 0, moneda)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Información de Auditoría */}
        <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Creación
              </label>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {plan.fechaCreacion
                    ? new Date(plan.fechaCreacion).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Última Modificación
              </label>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {plan.ultimaModificacion
                    ? new Date(plan.ultimaModificacion).toLocaleString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
