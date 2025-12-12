import React, { useState, useEffect } from 'react';
import { FaDoorOpen, FaTimes, FaEdit, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerAulaPorIdApi, activarAulaApi, desactivarAulaApi } from '../api/aulasApi';
import { useToast } from '../../../shared/contexts/ToastContext';
import type { Aula } from '../types/aula.types';

interface ViewAulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  aulaId: string | null;
  onEdit?: (aulaId: string) => void;
  onStatusChange?: () => void;
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

export const ViewAulaModal: React.FC<ViewAulaModalProps> = ({
  isOpen,
  onClose,
  aulaId,
  onEdit,
  onStatusChange,
}) => {
  const [aula, setAula] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  useEffect(() => {
    if (isOpen && aulaId) {
      loadAula(aulaId);
    } else if (!isOpen) {
      setAula(null);
      setError(null);
    }
  }, [isOpen, aulaId]);

  const loadAula = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await obtenerAulaPorIdApi(id);
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
    if (!aula || !aulaId) return;

    setToggling(true);
    try {
      if (aula.activo) {
        await desactivarAulaApi(aulaId);
      } else {
        await activarAulaApi(aulaId);
      }
      await loadAula(aulaId);
      onStatusChange?.();
    } catch (err: any) {
      console.error('Error al cambiar estado:', err);
      showError(err.message || 'Error al cambiar el estado del aula');
      onClose();
    } finally {
      setToggling(false);
    }
  };

  const handleEdit = () => {
    if (aulaId && onEdit) {
      onEdit(aulaId);
      onClose();
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
            <div className="p-2 rounded-lg bg-gradient-to-br from-lime-500 to-lime-600 shadow-md shadow-lime-500/30">
              <FaDoorOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Detalle del Aula
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Información completa del aula
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
              <CgSpinner className="w-8 h-8 text-lime-600 animate-spin" />
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : aula ? (
            <div className="space-y-4">
              {/* Información principal */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Nombre
                  </label>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    {aula.nombre}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Sucursal
                  </label>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    {aula.sucursalNombre || '-'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Capacidad
                  </label>
                  <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    {aula.capacidadMaxima > 0 ? `${aula.capacidadMaxima} personas` : 'Sin límite'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Estado
                  </label>
                  <div className="bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      aula.activo
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                    }`}>
                      {aula.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {aula.descripcion && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Descripción
                    </label>
                    <p className="text-sm text-neutral-900 dark:text-neutral-100 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border">
                      {aula.descripcion}
                    </p>
                  </div>
                )}
              </div>

              {/* Información del sistema */}
              <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
                  Información del sistema
                </p>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">ID</span>
                    <span className="font-mono text-neutral-600 dark:text-neutral-300">{aula.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Creado</span>
                    <span className="text-neutral-600 dark:text-neutral-300">{formatDate(aula.creadoEn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500 dark:text-neutral-400">Actualizado</span>
                    <span className="text-neutral-600 dark:text-neutral-300">{formatDate(aula.actualizadoEn)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        {!loading && !error && aula && (
          <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              onClick={handleToggleEstado}
              disabled={toggling}
              className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 border disabled:opacity-50 ${
                aula.activo
                  ? 'text-red-700 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : 'text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              {toggling ? (
                <CgSpinner className="w-4 h-4 animate-spin" />
              ) : aula.activo ? (
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
            {onEdit && (
              <button
                onClick={handleEdit}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-lime-500 to-lime-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-lime-500/30"
              >
                <FaEdit className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
