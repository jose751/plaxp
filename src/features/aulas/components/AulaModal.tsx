import React, { useState, useEffect } from 'react';
import { FaDoorOpen, FaSave, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { crearAulaApi, actualizarAulaApi, obtenerAulaPorIdApi } from '../api/aulasApi';
import { SucursalSelect } from '../../sucursales/components/SucursalSelect';

interface AulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  aulaId?: string | null; // Si se pasa, es modo edición
  defaultSucursalId?: string; // Sucursal por defecto al crear
}

export const AulaModal: React.FC<AulaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  aulaId,
  defaultSucursalId = '',
}) => {
  const isEditMode = Boolean(aulaId);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Datos del formulario
  const [nombre, setNombre] = useState('');
  const [sucursalId, setSucursalId] = useState('');
  const [capacidadMaxima, setCapacidadMaxima] = useState<number>(0);
  const [descripcion, setDescripcion] = useState('');

  // Errores
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset form cuando se abre/cierra el modal
  useEffect(() => {
    if (isOpen) {
      if (aulaId) {
        loadAulaData(aulaId);
      } else {
        resetForm();
      }
    }
  }, [isOpen, aulaId, defaultSucursalId]);

  const resetForm = () => {
    setNombre('');
    setSucursalId(defaultSucursalId);
    setCapacidadMaxima(0);
    setDescripcion('');
    setErrors({});
    setApiError(null);
    setShowSuccess(false);
  };

  const loadAulaData = async (id: string) => {
    setLoadingData(true);
    setApiError(null);
    try {
      const response = await obtenerAulaPorIdApi(id);
      if (response.success && response.data) {
        const aula = response.data;
        setNombre(aula.nombre);
        setSucursalId(aula.sucursalId);
        setCapacidadMaxima(aula.capacidadMaxima);
        setDescripcion(aula.descripcion || '');
      }
    } catch (err: any) {
      console.error('Error al cargar aula:', err);
      setApiError(err.message || 'Error al cargar los datos del aula');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    } else if (nombre.length > 100) {
      newErrors.nombre = 'El nombre no puede exceder 100 caracteres';
    }

    if (!sucursalId && !isEditMode) {
      newErrors.sucursalId = 'La sucursal es requerida';
    }

    if (capacidadMaxima < 0) {
      newErrors.capacidadMaxima = 'La capacidad no puede ser negativa';
    }

    if (descripcion.length > 500) {
      newErrors.descripcion = 'La descripción no puede exceder 500 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isEditMode && aulaId) {
        await actualizarAulaApi(aulaId, {
          nombre: nombre.trim(),
          capacidadMaxima,
          descripcion: descripcion.trim() || null,
        });
      } else {
        await crearAulaApi({
          sucursalId,
          nombre: nombre.trim(),
          capacidadMaxima,
          descripcion: descripcion.trim() || undefined,
        });
      }

      setShowSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error al guardar aula:', err);
      setApiError(err.message || 'Error al guardar el aula');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
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
                {isEditMode ? 'Editar Aula' : 'Nueva Aula'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isEditMode ? 'Modifica los datos del aula' : 'Completa los datos para crear un aula'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors disabled:opacity-50"
          >
            <FaTimes className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {loadingData ? (
            <div className="flex justify-center py-12">
              <CgSpinner className="w-8 h-8 text-lime-600 animate-spin" />
            </div>
          ) : showSuccess ? (
            <div className="flex flex-col items-center py-12">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {isEditMode ? '¡Aula actualizada!' : '¡Aula creada!'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <FaExclamationCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-900 dark:text-red-200">{apiError}</p>
                </div>
              )}

              {/* Nombre */}
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Nombre del Aula <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={nombre}
                  onChange={(e) => {
                    setNombre(e.target.value);
                    setErrors((prev) => ({ ...prev, nombre: '' }));
                  }}
                  placeholder="Ej: Aula 101, Laboratorio A"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.nombre
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100'
                      : 'border-neutral-300 dark:border-dark-border focus:border-lime-500 focus:ring-lime-500/20'
                  }`}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.nombre}
                  </p>
                )}
              </div>

              {/* Sucursal (solo en modo crear) */}
              {!isEditMode && (
                <SucursalSelect
                  value={sucursalId}
                  onChange={(value) => {
                    setSucursalId(value);
                    setErrors((prev) => ({ ...prev, sucursalId: '' }));
                  }}
                  error={errors.sucursalId}
                  required
                  label="Sucursal"
                  placeholder="Seleccionar sucursal"
                />
              )}

              {/* Capacidad Máxima */}
              <div>
                <label htmlFor="capacidadMaxima" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Capacidad Máxima
                </label>
                <input
                  type="number"
                  id="capacidadMaxima"
                  value={capacidadMaxima}
                  onChange={(e) => {
                    setCapacidadMaxima(parseInt(e.target.value) || 0);
                    setErrors((prev) => ({ ...prev, capacidadMaxima: '' }));
                  }}
                  min="0"
                  placeholder="0 = Sin límite"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.capacidadMaxima
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100'
                      : 'border-neutral-300 dark:border-dark-border focus:border-lime-500 focus:ring-lime-500/20'
                  }`}
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Deja en 0 para no establecer límite
                </p>
                {errors.capacidadMaxima && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.capacidadMaxima}
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    setErrors((prev) => ({ ...prev, descripcion: '' }));
                  }}
                  rows={3}
                  placeholder="Descripción opcional (equipamiento, ubicación, etc.)"
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 resize-none ${
                    errors.descripcion
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100'
                      : 'border-neutral-300 dark:border-dark-border focus:border-lime-500 focus:ring-lime-500/20'
                  }`}
                />
                <div className="flex justify-between mt-1">
                  {errors.descripcion && (
                    <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                      <FaExclamationCircle className="w-3 h-3" />
                      {errors.descripcion}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 ml-auto">
                    {descripcion.length}/500
                  </p>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {!loadingData && !showSuccess && (
          <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors border border-neutral-300 dark:border-dark-border disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-lime-500 to-lime-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-lime-500/30"
            >
              {loading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {isEditMode ? 'Guardar' : 'Crear Aula'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
