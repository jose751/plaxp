import React, { useState, useEffect } from 'react';
import { FaPlus, FaClock, FaTrash, FaExclamationCircle } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  listarHorariosCursoApi,
  crearHorarioApi,
  eliminarHorarioApi,
} from '../api/horariosApi';
import { AulaSelect } from '../../aulas/components/AulaSelect';
import type { Horario, DiaSemana, Modalidad, CrearHorarioData } from '../types/horario.types';

const DIAS_SEMANA: Record<DiaSemana, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
};

const DURACIONES = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h 30min' },
  { value: 120, label: '2 horas' },
  { value: 180, label: '3 horas' },
];

interface HorariosCursoManagerProps {
  cursoId: string;
  sucursalId?: string;
  disabled?: boolean;
}

interface NuevoHorario {
  diaSemana: DiaSemana | '';
  horaInicio: string;
  duracionMinutos: number;
  modalidad: Modalidad;
  aulaId: string;
}

export const HorariosCursoManager: React.FC<HorariosCursoManagerProps> = ({
  cursoId,
  sucursalId,
  disabled = false,
}) => {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [nuevoHorario, setNuevoHorario] = useState<NuevoHorario>({
    diaSemana: '',
    horaInicio: '08:00',
    duracionMinutos: 60,
    modalidad: 'presencial',
    aulaId: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (cursoId) {
      loadHorarios();
    }
  }, [cursoId]);

  const loadHorarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await listarHorariosCursoApi(cursoId);
      if (response.success) {
        setHorarios(response.data);
      }
    } catch (err: any) {
      console.error('Error al cargar horarios:', err);
      setError(err.message || 'Error al cargar los horarios');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNuevoHorario({
      diaSemana: '',
      horaInicio: '08:00',
      duracionMinutos: 60,
      modalidad: 'presencial',
      aulaId: '',
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!nuevoHorario.diaSemana) {
      errors.diaSemana = 'Selecciona un día';
    }

    if (!nuevoHorario.horaInicio) {
      errors.horaInicio = 'Ingresa la hora de inicio';
    }

    if (nuevoHorario.modalidad === 'presencial' && !nuevoHorario.aulaId) {
      errors.aulaId = 'Selecciona un aula para modalidad presencial';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddHorario = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setError(null);

    try {
      const data: CrearHorarioData = {
        cursoId,
        diaSemana: nuevoHorario.diaSemana as DiaSemana,
        horaInicio: nuevoHorario.horaInicio,
        duracionMinutos: nuevoHorario.duracionMinutos,
        modalidad: nuevoHorario.modalidad,
        aulaId: nuevoHorario.modalidad === 'presencial' ? nuevoHorario.aulaId : undefined,
      };

      const response = await crearHorarioApi(data);
      if (response.success) {
        await loadHorarios();
        resetForm();
        setShowForm(false);
      }
    } catch (err: any) {
      console.error('Error al crear horario:', err);
      setError(err.message || 'Error al crear el horario');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHorario = async (horarioId: string) => {
    if (!confirm('¿Estás seguro de eliminar este horario?')) return;

    setDeleting(horarioId);
    setError(null);

    try {
      const response = await eliminarHorarioApi(horarioId);
      if (response.success) {
        await loadHorarios();
      }
    } catch (err: any) {
      console.error('Error al eliminar horario:', err);
      setError(err.message || 'Error al eliminar el horario');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaClock className="w-4 h-4 text-violet-600" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Horarios del Curso
          </h2>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            ({horarios.length})
          </span>
        </div>
        {!disabled && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
          >
            <FaPlus className="w-3 h-3" />
            Agregar
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
          <FaExclamationCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 dark:text-red-200">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <CgSpinner className="w-6 h-6 text-violet-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Formulario para agregar horario */}
          {showForm && (
            <div className="mb-4 p-4 bg-neutral-50 dark:bg-dark-bg rounded-lg border border-neutral-200 dark:border-dark-border">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {/* Día */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Día <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={nuevoHorario.diaSemana}
                    onChange={(e) => {
                      setNuevoHorario(prev => ({ ...prev, diaSemana: e.target.value ? Number(e.target.value) as DiaSemana : '' }));
                      setFormErrors(prev => ({ ...prev, diaSemana: '' }));
                    }}
                    disabled={saving}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 ${
                      formErrors.diaSemana
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-100'
                        : 'border-neutral-300 dark:border-dark-border focus:ring-violet-100'
                    }`}
                  >
                    <option value="">Seleccionar día</option>
                    {Object.entries(DIAS_SEMANA).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {formErrors.diaSemana && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.diaSemana}</p>
                  )}
                </div>

                {/* Hora inicio */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Hora inicio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={nuevoHorario.horaInicio}
                    onChange={(e) => {
                      setNuevoHorario(prev => ({ ...prev, horaInicio: e.target.value }));
                      setFormErrors(prev => ({ ...prev, horaInicio: '' }));
                    }}
                    disabled={saving}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 ${
                      formErrors.horaInicio
                        ? 'border-red-300 dark:border-red-600 focus:ring-red-100'
                        : 'border-neutral-300 dark:border-dark-border focus:ring-violet-100'
                    }`}
                  />
                  {formErrors.horaInicio && (
                    <p className="text-xs text-red-600 mt-1">{formErrors.horaInicio}</p>
                  )}
                </div>

                {/* Duración */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Duración
                  </label>
                  <select
                    value={nuevoHorario.duracionMinutos}
                    onChange={(e) => setNuevoHorario(prev => ({ ...prev, duracionMinutos: Number(e.target.value) }))}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  >
                    {DURACIONES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Modalidad */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Modalidad
                  </label>
                  <select
                    value={nuevoHorario.modalidad}
                    onChange={(e) => {
                      const modalidad = e.target.value as Modalidad;
                      setNuevoHorario(prev => ({
                        ...prev,
                        modalidad,
                        aulaId: modalidad === 'virtual' ? '' : prev.aulaId,
                      }));
                      if (modalidad === 'virtual') {
                        setFormErrors(prev => ({ ...prev, aulaId: '' }));
                      }
                    }}
                    disabled={saving}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="virtual">Virtual</option>
                  </select>
                </div>

                {/* Aula (solo si es presencial) */}
                {nuevoHorario.modalidad === 'presencial' && (
                  <div>
                    <AulaSelect
                      value={nuevoHorario.aulaId}
                      onChange={(value) => {
                        setNuevoHorario(prev => ({ ...prev, aulaId: value }));
                        setFormErrors(prev => ({ ...prev, aulaId: '' }));
                      }}
                      error={formErrors.aulaId}
                      disabled={saving}
                      required
                      label="Aula"
                      placeholder="Seleccionar aula"
                      sucursalId={sucursalId}
                    />
                  </div>
                )}
              </div>

              {/* Botones del formulario */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAddHorario}
                  disabled={saving}
                  className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-70 flex items-center gap-1.5"
                >
                  {saving ? (
                    <>
                      <CgSpinner className="w-4 h-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <FaPlus className="w-3 h-3" />
                      Agregar Horario
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Lista de horarios */}
          {horarios.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
              <FaClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay horarios configurados</p>
              {!disabled && (
                <p className="text-xs mt-1">Haz clic en "Agregar" para crear un horario</p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {horarios.map((horario) => (
                <div
                  key={horario.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-dark-bg rounded-lg border border-neutral-200 dark:border-dark-border"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[80px]">
                      <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                        {horario.diaSemanaTexto}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {horario.horaInicio} - {horario.horaFin}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        horario.modalidad === 'presencial'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                      }`}>
                        {horario.modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
                      </span>
                      {horario.aulaNombre && (
                        <span className="text-xs text-neutral-600 dark:text-neutral-300">
                          {horario.aulaNombre}
                        </span>
                      )}
                    </div>
                  </div>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleDeleteHorario(horario.id)}
                      disabled={deleting === horario.id}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === horario.id ? (
                        <CgSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaTrash className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
