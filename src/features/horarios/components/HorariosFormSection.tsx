import React, { useState } from 'react';
import { FaPlus, FaClock, FaTrash } from 'react-icons/fa';
import { AulaSelect } from '../../aulas/components/AulaSelect';
import type { DiaSemana, Modalidad } from '../types/horario.types';

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

export interface HorarioLocal {
  id: string; // ID temporal para el key
  diaSemana: DiaSemana;
  horaInicio: string;
  duracionMinutos: number;
  modalidad: Modalidad;
  aulaId?: string;
  aulaNombre?: string;
}

interface HorariosFormSectionProps {
  horarios: HorarioLocal[];
  onChange: (horarios: HorarioLocal[]) => void;
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

// Función para calcular hora fin
const calcularHoraFin = (horaInicio: string, duracionMinutos: number): string => {
  const [horas, minutos] = horaInicio.split(':').map(Number);
  const totalMinutos = horas * 60 + minutos + duracionMinutos;
  const horasFin = Math.floor(totalMinutos / 60) % 24;
  const minutosFin = totalMinutos % 60;
  return `${horasFin.toString().padStart(2, '0')}:${minutosFin.toString().padStart(2, '0')}`;
};

export const HorariosFormSection: React.FC<HorariosFormSectionProps> = ({
  horarios,
  onChange,
  sucursalId,
  disabled = false,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [nuevoHorario, setNuevoHorario] = useState<NuevoHorario>({
    diaSemana: '',
    horaInicio: '08:00',
    duracionMinutos: 60,
    modalidad: 'presencial',
    aulaId: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const handleAddHorario = () => {
    if (!validateForm()) return;

    const nuevo: HorarioLocal = {
      id: `temp-${Date.now()}`,
      diaSemana: nuevoHorario.diaSemana as DiaSemana,
      horaInicio: nuevoHorario.horaInicio,
      duracionMinutos: nuevoHorario.duracionMinutos,
      modalidad: nuevoHorario.modalidad,
      aulaId: nuevoHorario.modalidad === 'presencial' ? nuevoHorario.aulaId : undefined,
    };

    onChange([...horarios, nuevo]);
    resetForm();
    setShowForm(false);
  };

  const handleRemoveHorario = (id: string) => {
    onChange(horarios.filter(h => h.id !== id));
  };

  // No mostrar si no hay sucursal seleccionada
  if (!sucursalId) {
    return (
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <FaClock className="w-4 h-4 text-violet-600" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Horarios del Curso
          </h2>
        </div>
        <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
          <FaClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Selecciona una sucursal primero</p>
          <p className="text-xs mt-1">Los horarios dependen de la sucursal del curso</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaClock className="w-4 h-4 text-violet-600" />
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Horarios del Curso
          </h2>
          {horarios.length > 0 && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              ({horarios.length})
            </span>
          )}
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
                disabled={disabled}
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
                  disabled={disabled}
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
              disabled={disabled}
              className="px-3 py-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddHorario}
              disabled={disabled}
              className="px-3 py-1.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all flex items-center gap-1.5"
            >
              <FaPlus className="w-3 h-3" />
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* Lista de horarios */}
      {horarios.length === 0 ? (
        <div className="text-center py-6 text-neutral-500 dark:text-neutral-400">
          <FaClock className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hay horarios configurados</p>
          <p className="text-xs mt-1">Los horarios son opcionales</p>
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
                    {DIAS_SEMANA[horario.diaSemana]}
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {horario.horaInicio} - {calcularHoraFin(horario.horaInicio, horario.duracionMinutos)}
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
                </div>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveHorario(horario.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
