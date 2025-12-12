import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaClock,
  FaSave,
  FaExclamationCircle,
  FaSearch,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaBook,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  crearHorarioApi,
  actualizarHorarioApi,
  obtenerHorarioPorIdApi,
  verificarConflictoApi,
} from '../api/horariosApi';
import { listarCursosApi } from '../../cursos/api/cursosApi';
import { AulaSelect } from '../../aulas/components/AulaSelect';
import { DiaSelect } from '../components/DiaSelect';
import { TimeInput } from '../components/TimeInput';
import { DuracionSelect } from '../components/DuracionSelect';
import { ModalidadSelect } from '../components/ModalidadSelect';
import { ConflictAlert } from '../components/ConflictAlert';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';
import type { DiaSemana, Modalidad, Conflicto } from '../types/horario.types';
import type { Curso } from '../../cursos/types/curso.types';

export const CreateEditHorarioPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [verificandoConflicto, setVerificandoConflicto] = useState(false);

  // Datos del formulario
  const [cursoId, setCursoId] = useState('');
  const [cursoNombre, setCursoNombre] = useState('');
  const [aulaId, setAulaId] = useState('');
  const [modalidad, setModalidad] = useState<Modalidad>('presencial');
  const [diaSemana, setDiaSemana] = useState<DiaSemana | ''>('');
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [duracionMinutos, setDuracionMinutos] = useState(60);

  // Modal de selección de curso
  const [showCursoModal, setShowCursoModal] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [cursosPage, setCursosPage] = useState(1);
  const [cursosTotalPages, setCursosTotalPages] = useState(1);
  const [cursosTotal, setCursosTotal] = useState(0);
  const [loadingCursos, setLoadingCursos] = useState(false);
  const [cursoSearch, setCursoSearch] = useState('');

  // Errores y conflictos
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [conflictos, setConflictos] = useState<Conflicto[]>([]);

  // Cargar datos del horario en modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadHorarioData(id);
    }
  }, [id, isEditMode]);

  const loadHorarioData = async (horarioId: string) => {
    setLoadingData(true);
    try {
      const response = await obtenerHorarioPorIdApi(horarioId);
      if (response.success && response.data) {
        const horario = response.data;
        setCursoId(horario.cursoId);
        setCursoNombre(horario.cursoNombre || '');
        setAulaId(horario.aulaId || '');
        setModalidad(horario.modalidad);
        setDiaSemana(horario.diaSemana);
        setHoraInicio(horario.horaInicio);
        setDuracionMinutos(horario.duracionMinutos);
      }
    } catch (err: any) {
      console.error('Error al cargar horario:', err);
      setApiError(err.message || 'Error al cargar los datos del horario');
    } finally {
      setLoadingData(false);
    }
  };

  // Cargar cursos para el modal
  const fetchCursos = useCallback(async (page: number, search?: string) => {
    setLoadingCursos(true);
    try {
      const response = await listarCursosApi({
        page,
        pageSize: 8,
        q: search || undefined,
        estado: 'activo',
      });
      if (response.success) {
        setCursos(response.data.cursos);
        setCursosTotalPages(response.data.pagination.totalPages);
        setCursosTotal(response.data.pagination.totalRecords);
      }
    } catch (err) {
      console.error('Error al cargar cursos:', err);
    } finally {
      setLoadingCursos(false);
    }
  }, []);

  useEffect(() => {
    if (showCursoModal) {
      const timer = setTimeout(() => {
        fetchCursos(cursosPage, cursoSearch);
      }, cursoSearch ? 300 : 0);
      return () => clearTimeout(timer);
    }
  }, [showCursoModal, cursosPage, cursoSearch, fetchCursos]);

  useEffect(() => {
    setCursosPage(1);
  }, [cursoSearch]);

  // Verificar conflicto de horario
  const verificarConflicto = async (): Promise<boolean> => {
    if (modalidad === 'virtual' || !aulaId || !diaSemana) {
      setConflictos([]);
      return true;
    }

    setVerificandoConflicto(true);
    try {
      const response = await verificarConflictoApi({
        aulaId,
        diaSemana: diaSemana as DiaSemana,
        horaInicio,
        duracionMinutos,
        excludeHorarioId: isEditMode ? id : undefined,
      });

      if (response.success) {
        setConflictos(response.data.conflictos);
        return !response.data.tieneConflicto;
      }
      return true;
    } catch (err: any) {
      console.error('Error al verificar conflicto:', err);
      return true; // En caso de error, permitir continuar
    } finally {
      setVerificandoConflicto(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!cursoId) {
      newErrors.cursoId = 'Debe seleccionar un curso';
    }

    if (modalidad === 'presencial' && !aulaId) {
      newErrors.aulaId = 'El aula es requerida para modalidad presencial';
    }

    if (!diaSemana) {
      newErrors.diaSemana = 'Debe seleccionar un día de la semana';
    }

    if (!horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es requerida';
    }

    if (duracionMinutos < 1 || duracionMinutos > 720) {
      newErrors.duracionMinutos = 'La duración debe estar entre 1 y 720 minutos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setConflictos([]);

    if (!validateForm()) return;

    // Verificar conflicto antes de guardar
    const sinConflicto = await verificarConflicto();
    if (!sinConflicto) {
      return; // Hay conflicto, no continuar
    }

    setLoading(true);

    try {
      if (isEditMode && id) {
        await actualizarHorarioApi(id, {
          aulaId: modalidad === 'presencial' ? aulaId : null,
          modalidad,
          diaSemana: diaSemana as DiaSemana,
          horaInicio,
          duracionMinutos,
        });
      } else {
        await crearHorarioApi({
          cursoId,
          aulaId: modalidad === 'presencial' ? aulaId : undefined,
          modalidad,
          diaSemana: diaSemana as DiaSemana,
          horaInicio,
          duracionMinutos,
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        navigate('/horarios');
      }, 1500);
    } catch (err: any) {
      console.error('Error al guardar horario:', err);
      setApiError(err.message || 'Error al guardar el horario');
      setLoading(false);
    }
  };

  // Modal de selección de curso
  const renderCursoModal = () => {
    if (!showCursoModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowCursoModal(false)} />
        <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-2xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/30">
                <FaBook className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Seleccionar Curso
              </h2>
            </div>
            <button
              onClick={() => setShowCursoModal(false)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
            >
              <FaTimes className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-neutral-200 dark:border-dark-border">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={cursoSearch}
                onChange={(e) => setCursoSearch(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loadingCursos ? (
              <div className="flex justify-center py-12">
                <CgSpinner className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : cursos.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                No se encontraron cursos
              </div>
            ) : (
              <div className="grid gap-2">
                {cursos.map((curso) => (
                  <button
                    key={curso.id}
                    onClick={() => {
                      setCursoId(curso.id);
                      setCursoNombre(curso.nombre);
                      setShowCursoModal(false);
                      setErrors((prev) => ({ ...prev, cursoId: '' }));
                    }}
                    className="p-3 text-left rounded-lg border border-neutral-200 dark:border-dark-border hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FaBook className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {curso.nombre}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        {curso.codigo} • {curso.categoriaNombre || 'Sin categoría'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {cursosTotalPages > 1 && (
            <div className="px-5 py-3 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {cursosTotal} cursos
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCursosPage(p => Math.max(1, p - 1))}
                  disabled={cursosPage === 1}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 px-3 py-1 bg-neutral-100 dark:bg-dark-hover rounded-lg">
                  {cursosPage} / {cursosTotalPages}
                </span>
                <button
                  onClick={() => setCursosPage(p => Math.min(cursosTotalPages, p + 1))}
                  disabled={cursosPage === cursosTotalPages}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <CgSpinner className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay
        isVisible={loading || showSuccess}
        message={loading ? 'Guardando...' : ''}
        isSuccess={showSuccess}
        successMessage={isEditMode ? '¡Horario actualizado!' : '¡Horario creado exitosamente!'}
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/horarios')}
            disabled={loading}
            className="flex items-center gap-2 text-primary hover:text-primary/80 mb-4 transition-colors disabled:opacity-50 font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Horarios</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-primary to-purple-600 shadow-md shadow-primary/30">
              <FaClock className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditMode ? 'Editar Horario' : 'Nuevo Horario'}
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {isEditMode ? 'Modifica los datos del horario' : 'Asigna un horario a un curso'}
              </p>
            </div>
          </div>
        </div>

        {apiError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <FaExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 dark:text-red-200">{apiError}</p>
          </div>
        )}

        {conflictos.length > 0 && (
          <div className="mb-6">
            <ConflictAlert conflictos={conflictos} onClose={() => setConflictos([])} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Curso */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Curso <span className="text-red-500">*</span>
            </h2>

            {cursoId ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                    <FaBook className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      {cursoNombre}
                    </p>
                  </div>
                </div>
                {!isEditMode && (
                  <button
                    type="button"
                    onClick={() => setShowCursoModal(true)}
                    className="text-sm text-primary hover:text-primary/80 font-medium px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    Cambiar
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCursoModal(true)}
                className={`w-full p-4 border-2 border-dashed rounded-lg text-left transition-all flex items-center gap-3 ${
                  errors.cursoId
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                    : 'border-neutral-300 dark:border-dark-border hover:border-primary dark:hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-dark-hover flex items-center justify-center">
                  <FaBook className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-700 dark:text-neutral-300">
                    Seleccionar curso
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Haz clic para buscar y seleccionar
                  </p>
                </div>
              </button>
            )}

            {errors.cursoId && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                <FaExclamationCircle className="w-3 h-3" />
                {errors.cursoId}
              </p>
            )}
          </div>

          {/* Modalidad */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <ModalidadSelect
              value={modalidad}
              onChange={(value) => {
                setModalidad(value);
                if (value === 'virtual') {
                  setAulaId('');
                  setConflictos([]);
                }
              }}
            />
          </div>

          {/* Aula (solo si es presencial) */}
          {modalidad === 'presencial' && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
              <AulaSelect
                value={aulaId}
                onChange={(value) => {
                  setAulaId(value);
                  setErrors((prev) => ({ ...prev, aulaId: '' }));
                  setConflictos([]);
                }}
                error={errors.aulaId}
                required
                label="Aula"
                placeholder="Seleccionar aula"
              />
            </div>
          )}

          {/* Día y Hora */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Día y Hora
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DiaSelect
                value={diaSemana}
                onChange={(value) => {
                  setDiaSemana(value);
                  setErrors((prev) => ({ ...prev, diaSemana: '' }));
                  setConflictos([]);
                }}
                error={errors.diaSemana}
                required
              />

              <TimeInput
                value={horaInicio}
                onChange={(value) => {
                  setHoraInicio(value);
                  setErrors((prev) => ({ ...prev, horaInicio: '' }));
                  setConflictos([]);
                }}
                error={errors.horaInicio}
                required
                label="Hora de Inicio"
              />

              <DuracionSelect
                value={duracionMinutos}
                onChange={(value) => {
                  setDuracionMinutos(value);
                  setConflictos([]);
                }}
                error={errors.duracionMinutos}
                required
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              onClick={() => navigate('/horarios')}
              disabled={loading || verificandoConflicto}
              className="px-5 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center border border-neutral-300 dark:border-dark-border rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || verificandoConflicto}
              className="px-5 py-2.5 bg-gradient-to-r from-primary to-purple-600 shadow-md shadow-primary/30 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loading || verificandoConflicto ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  {verificandoConflicto ? 'Verificando...' : 'Guardando...'}
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {isEditMode ? 'Guardar Cambios' : 'Crear Horario'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de selección de curso */}
      {renderCursoModal()}
    </>
  );
};
