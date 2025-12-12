import React, { useState, useEffect } from 'react';
import { FaClock, FaTimes, FaBuilding, FaDesktop, FaBook, FaDoorOpen, FaCalendarAlt } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerHorarioPorIdApi } from '../api/horariosApi';
import type { Horario } from '../types/horario.types';

interface ViewHorarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  horarioId: string | null;
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ViewHorarioModal: React.FC<ViewHorarioModalProps> = ({
  isOpen,
  onClose,
  horarioId,
}) => {
  const [horario, setHorario] = useState<Horario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && horarioId) {
      loadHorario(horarioId);
    } else if (!isOpen) {
      setHorario(null);
      setError(null);
    }
  }, [isOpen, horarioId]);

  const loadHorario = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerHorarioPorIdApi(id);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/30">
              <FaClock className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Detalle del Horario
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Información completa del horario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <FaTimes className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <CgSpinner className="w-8 h-8 text-amber-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : horario ? (
            <div className="space-y-4">
              {/* Curso */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  <FaBook className="w-3.5 h-3.5 text-neutral-400" />
                  Curso
                </label>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                  {horario.cursoNombre || 'Sin nombre'}
                </p>
              </div>

              {/* Día y Horario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaCalendarAlt className="w-3.5 h-3.5 text-neutral-400" />
                    Día
                  </label>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    {horario.diaSemanaTexto}
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaClock className="w-3.5 h-3.5 text-neutral-400" />
                    Horario
                  </label>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    {horario.horaInicio} - {horario.horaFin}
                  </p>
                </div>
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Duración
                </label>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                  {horario.duracionMinutos} minutos
                </p>
              </div>

              {/* Modalidad */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Modalidad
                </label>
                <div className="bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                  {horario.modalidad === 'presencial' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                      <FaBuilding className="w-3 h-3" />
                      Presencial
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      <FaDesktop className="w-3 h-3" />
                      Virtual
                    </span>
                  )}
                </div>
              </div>

              {/* Aula (solo si es presencial) */}
              {horario.modalidad === 'presencial' && (
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    <FaDoorOpen className="w-3.5 h-3.5 text-neutral-400" />
                    Aula
                  </label>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    {horario.aulaNombre || 'Sin asignar'}
                  </p>
                </div>
              )}

              {/* Capacidad del Curso */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Capacidad del Curso
                </label>
                <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                  {horario.cursoCapacidadMaxima ? `${horario.cursoCapacidadMaxima} personas` : 'Sin límite'}
                </p>
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Estado
                </label>
                <div className="bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    horario.activo
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  }`}>
                    {horario.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Información del sistema */}
              <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                  Información del sistema
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">ID</span>
                    <span className="font-mono text-neutral-600 dark:text-neutral-300">{horario.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Creado</span>
                    <span className="text-neutral-600 dark:text-neutral-300">{formatDate(horario.creadoEn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Actualizado</span>
                    <span className="text-neutral-600 dark:text-neutral-300">{formatDate(horario.actualizadoEn)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && horario && (
          <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 border border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-hover"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
