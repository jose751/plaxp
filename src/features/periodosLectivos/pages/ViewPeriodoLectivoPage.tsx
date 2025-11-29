import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaClock, FaCheckCircle, FaTimesCircle, FaEdit, FaStar, FaCalendarCheck } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerPeriodoLectivoPorIdApi } from '../api/periodosLectivosApi';
import type { PeriodoLectivo } from '../types/periodoLectivo.types';
import { EstadoPeriodoLectivo } from '../types/periodoLectivo.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const ViewPeriodoLectivoPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [periodo, setPeriodo] = useState<PeriodoLectivo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchPeriodoDetails();
    }
  }, [id]);

  const fetchPeriodoDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await obtenerPeriodoLectivoPorIdApi(id);
      setPeriodo(response.data);
    } catch (err: any) {
      console.error('Error al obtener periodo lectivo:', err);
      setError(err.message || 'Error al cargar los detalles del periodo lectivo');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    // Extraer solo la parte de fecha para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getEstadoInfo = (estado: EstadoPeriodoLectivo) => {
    switch (estado) {
      case EstadoPeriodoLectivo.PLANEADO:
        return {
          label: 'Planeado',
          bgClass: 'bg-blue-50 dark:bg-blue-900/30',
          textClass: 'text-blue-700 dark:text-blue-400',
          borderClass: 'border-blue-200 dark:border-blue-800',
          icon: <FaClock className="w-3 h-3" />,
        };
      case EstadoPeriodoLectivo.ACTIVO:
        return {
          label: 'Activo',
          bgClass: 'bg-green-50 dark:bg-green-900/30',
          textClass: 'text-green-700 dark:text-green-400',
          borderClass: 'border-green-200 dark:border-green-800',
          icon: <FaCheckCircle className="w-3 h-3" />,
        };
      case EstadoPeriodoLectivo.FINALIZADO:
        return {
          label: 'Finalizado',
          bgClass: 'bg-purple-50 dark:bg-purple-900/30',
          textClass: 'text-purple-700 dark:text-purple-400',
          borderClass: 'border-purple-200 dark:border-purple-800',
          icon: <FaCheckCircle className="w-3 h-3" />,
        };
      case EstadoPeriodoLectivo.CANCELADO:
        return {
          label: 'Cancelado',
          bgClass: 'bg-red-50 dark:bg-red-900/30',
          textClass: 'text-red-700 dark:text-red-400',
          borderClass: 'border-red-200 dark:border-red-800',
          icon: <FaTimesCircle className="w-3 h-3" />,
        };
      default:
        return {
          label: 'Desconocido',
          bgClass: 'bg-neutral-50 dark:bg-neutral-900/30',
          textClass: 'text-neutral-700 dark:text-neutral-400',
          borderClass: 'border-neutral-200 dark:border-neutral-800',
          icon: null,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del periodo lectivo...</p>
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
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">Error al cargar el periodo lectivo</p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/periodos-lectivos')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Periodos Lectivos
          </button>
        </div>
      </div>
    );
  }

  if (!periodo) {
    return null;
  }

  const estadoInfo = getEstadoInfo(periodo.estado);

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/periodos-lectivos')}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Periodos Lectivos</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30">
              <FaCalendarAlt className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detalles del Periodo Lectivo</h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Información completa del periodo</p>
            </div>
          </div>
          {hasPermission('periodos-lectivos.editar') && (
            <button
              onClick={() => navigate(`/periodos-lectivos/edit/${periodo.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
            >
              <FaEdit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{periodo.nombre}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${estadoInfo.bgClass} ${estadoInfo.textClass} border ${estadoInfo.borderClass}`}
            >
              {estadoInfo.icon}
              {estadoInfo.label}
            </div>
            {periodo.esActual && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                <FaStar className="w-3 h-3" />
                Periodo Actual
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Inicio
              </label>
              <div className="flex items-center gap-2">
                <FaCalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatDate(periodo.fechaInicio)}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Fin
              </label>
              <div className="flex items-center gap-2">
                <FaCalendarCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{formatDate(periodo.fechaFin)}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Duración
              </label>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">
                  {(() => {
                    const inicio = new Date(periodo.fechaInicio);
                    const fin = new Date(periodo.fechaFin);
                    const diffTime = Math.abs(fin.getTime() - inicio.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    const months = Math.floor(diffDays / 30);
                    const days = diffDays % 30;
                    if (months > 0) {
                      return `${months} ${months === 1 ? 'mes' : 'meses'}${days > 0 ? ` y ${days} días` : ''}`;
                    }
                    return `${diffDays} días`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
