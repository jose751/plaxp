import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaDoorOpen,
  FaEdit,
  FaCheckCircle,
  FaTimesCircle,
  FaBuilding,
  FaUsers,
  FaClock,
  FaCalendarAlt,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerAulaPorIdApi, activarAulaApi, desactivarAulaApi } from '../api/aulasApi';
import type { Aula } from '../types/aula.types';
// TODO: Habilitar permisos cuando estén configurados
// import { usePermissions } from '../../../shared/hooks/usePermissions';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ViewAulaPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  // const { hasPermission } = usePermissions();

  const [aula, setAula] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadAula(id);
    }
  }, [id]);

  const loadAula = async (aulaId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerAulaPorIdApi(aulaId);
      if (response.success && response.data) {
        setAula(response.data);
      } else {
        setError('No se encontró el aula');
      }
    } catch (err: any) {
      console.error('Error al cargar aula:', err);
      setError(err.message || 'Error al cargar los datos del aula');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEstado = async () => {
    if (!aula || !id) return;

    setToggling(true);
    try {
      if (aula.activo) {
        await desactivarAulaApi(id);
      } else {
        await activarAulaApi(id);
      }
      // Recargar datos
      await loadAula(id);
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      setError(err.message || 'Error al cambiar el estado del aula');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <CgSpinner className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !aula) {
    return (
      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        <button
          onClick={() => navigate('/aulas')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Aulas</span>
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Aula no encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay isVisible={toggling} message="Actualizando estado..." />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/aulas')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Aulas</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/30">
                <FaDoorOpen className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {aula.nombre}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {aula.activo ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700">
                      <FaCheckCircle className="w-3 h-3" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700">
                      <FaTimesCircle className="w-3 h-3" />
                      Inactivo
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* TODO: Habilitar permisos cuando estén configurados en el backend */}
            {/* {hasPermission('aulas.editar') && ( */}
            <div className="flex gap-2">
              <button
                onClick={handleToggleEstado}
                disabled={toggling}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                  aula.activo
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 border border-red-300 dark:border-red-700'
                    : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 border border-green-300 dark:border-green-700'
                }`}
              >
                {aula.activo ? (
                  <>
                    <FaToggleOff className="w-4 h-4" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <FaToggleOn className="w-4 h-4" />
                    Activar
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/aulas/edit/${id}`)}
                className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all flex items-center gap-2 shadow-md shadow-primary/30"
              >
                <FaEdit className="w-4 h-4" />
                Editar
              </button>
            </div>
            {/* )} */}
          </div>
        </div>

        {/* Información Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detalles del Aula */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FaDoorOpen className="w-4 h-4 text-primary" />
              Información del Aula
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FaBuilding className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Sucursal</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {aula.sucursalNombre || 'No especificada'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <FaUsers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Capacidad Máxima</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {aula.capacidadMaxima > 0 ? `${aula.capacidadMaxima} personas` : 'Sin límite definido'}
                  </p>
                </div>
              </div>

              {aula.descripcion && (
                <div className="pt-3 border-t border-neutral-100 dark:border-dark-border">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Descripción</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    {aula.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadatos */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4 text-primary" />
              Información del Sistema
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">ID del Aula</p>
                <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300">
                  {aula.id}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Fecha de Creación</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {formatDate(aula.creadoEn)}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Última Actualización</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {formatDate(aula.actualizadoEn)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sección de Horarios (placeholder para futura integración) */}
        <div className="mt-6 bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <FaClock className="w-4 h-4 text-primary" />
              Horarios Asignados
            </h2>
            <button
              onClick={() => navigate(`/horarios?aulaId=${id}`)}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              Ver todos los horarios →
            </button>
          </div>

          <div className="py-8 text-center text-neutral-500 dark:text-neutral-400">
            <FaClock className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Los horarios de esta aula se mostrarán aquí</p>
            <p className="text-xs mt-1">Navega a la sección de horarios para ver la disponibilidad</p>
          </div>
        </div>
      </div>
    </>
  );
};
