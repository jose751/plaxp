import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaClock,
  FaEdit,
  FaTrash,
  FaBook,
  FaBuilding,
  FaDesktop,
  FaCalendarAlt,
  FaUsers,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerHorarioPorIdApi, eliminarHorarioApi } from '../api/horariosApi';
import type { Horario } from '../types/horario.types';
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

export const ViewHorarioPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  // const { hasPermission } = usePermissions();

  const [horario, setHorario] = useState<Horario | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadHorario(id);
    }
  }, [id]);

  const loadHorario = async (horarioId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerHorarioPorIdApi(horarioId);
      if (response.success && response.data) {
        setHorario(response.data);
      } else {
        setError('No se encontró el horario');
      }
    } catch (err: any) {
      console.error('Error al cargar horario:', err);
      setError(err.message || 'Error al cargar los datos del horario');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await eliminarHorarioApi(id);
      navigate('/horarios');
    } catch (err: any) {
      console.error('Error al eliminar horario:', err);
      setError(err.message || 'Error al eliminar el horario');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <CgSpinner className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !horario) {
    return (
      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        <button
          onClick={() => navigate('/horarios')}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Horarios</span>
        </button>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error || 'Horario no encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay isVisible={deleting} message="Eliminando horario..." />

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <FaTrash className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                ¿Eliminar horario?
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Esta acción eliminará permanentemente el horario del curso "{horario.cursoNombre}".
                Esta acción no se puede deshacer.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2.5 border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/horarios')}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Horarios</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/30">
                <FaClock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {horario.diaSemanaTexto} {horario.horaInicio} - {horario.horaFin}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    horario.modalidad === 'presencial'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700'
                      : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700'
                  }`}>
                    {horario.modalidad === 'presencial' ? (
                      <><FaBuilding className="w-3 h-3" /> Presencial</>
                    ) : (
                      <><FaDesktop className="w-3 h-3" /> Virtual</>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* TODO: Habilitar permisos cuando estén configurados en el backend */}
            {/* {hasPermission('horarios.eliminar') && ( */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-medium rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-all flex items-center gap-2 border border-red-300 dark:border-red-700"
              >
                <FaTrash className="w-4 h-4" />
                Eliminar
              </button>
              {/* )} */}
              {/* {hasPermission('horarios.editar') && ( */}
              <button
                onClick={() => navigate(`/horarios/edit/${id}`)}
                className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all flex items-center gap-2 shadow-md shadow-primary/30"
              >
                <FaEdit className="w-4 h-4" />
                Editar
              </button>
              {/* )} */}
            </div>
          </div>
        </div>

        {/* Información Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Detalles del Horario */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <FaClock className="w-4 h-4 text-primary" />
              Información del Horario
            </h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <FaBook className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Curso</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {horario.cursoNombre || 'No especificado'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <FaCalendarAlt className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Día y Hora</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {horario.diaSemanaTexto} de {horario.horaInicio} a {horario.horaFin}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Duración: {horario.duracionMinutos} minutos
                  </p>
                </div>
              </div>

              {horario.modalidad === 'presencial' && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <FaBuilding className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Aula</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {horario.aulaNombre || 'No asignada'}
                    </p>
                    {horario.aulaCapacidad && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Capacidad: {horario.aulaCapacidad} personas
                      </p>
                    )}
                  </div>
                </div>
              )}

              {horario.cursoCapacidadMaxima && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <FaUsers className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Capacidad del Curso</p>
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {horario.cursoCapacidadMaxima} personas
                    </p>
                  </div>
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
                <p className="text-xs text-neutral-500 dark:text-neutral-400">ID del Horario</p>
                <p className="text-sm font-mono text-neutral-700 dark:text-neutral-300">
                  {horario.id}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Estado</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {horario.activo ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Inactivo
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Fecha de Creación</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {formatDate(horario.creadoEn)}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Última Actualización</p>
                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                  {formatDate(horario.actualizadoEn)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
