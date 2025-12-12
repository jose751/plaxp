import { useState, useEffect } from 'react';
import { HiX, HiViewBoards } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { crearPipelineApi, actualizarPipelineApi } from '../api/crmApi';
import type { CrmPipeline } from '../types/crm.types';

interface PipelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pipeline?: CrmPipeline | null;
}

const COLORES_PREDEFINIDOS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

const initialForm = {
  nombre: '',
  descripcion: '',
  color: '#3B82F6',
  esDefault: false,
};

export const PipelineModal = ({
  isOpen,
  onClose,
  onSuccess,
  pipeline,
}: PipelineModalProps) => {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!pipeline;

  // Cargar datos si es edición
  useEffect(() => {
    if (isEditing && pipeline) {
      setForm({
        nombre: pipeline.nombre,
        descripcion: pipeline.descripcion || '',
        color: pipeline.color,
        esDefault: pipeline.esDefault,
      });
    } else {
      setForm(initialForm);
    }
    setError(null);
  }, [pipeline, isEditing, isOpen]);

  const handleSave = async () => {
    if (!form.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isEditing && pipeline) {
        const response = await actualizarPipelineApi(pipeline.id, {
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          color: form.color,
          esDefault: form.esDefault,
        });
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError('Error al actualizar el pipeline');
        }
      } else {
        const response = await crearPipelineApi({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || undefined,
          color: form.color,
          esDefault: form.esDefault,
        });
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError('Error al crear el pipeline');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el pipeline');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: form.color }}
            >
              <HiViewBoards className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {isEditing ? 'Editar Pipeline' : 'Nuevo Pipeline'}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {isEditing ? 'Modifica los datos del pipeline' : 'Crea un nuevo pipeline de ventas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm(prev => ({ ...prev, nombre: e.target.value }))}
              placeholder="Ej: Cursos de Idiomas"
              className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Descripción opcional del pipeline..."
              rows={2}
              className="w-full px-4 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORES_PREDEFINIDOS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, color }))}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    form.color === color
                      ? 'ring-2 ring-offset-2 ring-primary scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              {/* Color personalizado */}
              <div className="relative">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm(prev => ({ ...prev, color: e.target.value }))}
                  className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                />
                <div
                  className="w-8 h-8 rounded-lg border-2 border-dashed border-neutral-300 dark:border-neutral-600 flex items-center justify-center text-neutral-400 hover:border-primary transition-colors"
                  title="Color personalizado"
                >
                  +
                </div>
              </div>
            </div>
          </div>

          {/* Es Default */}
          {!isEditing && (
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-dark-bg rounded-xl">
              <input
                type="checkbox"
                id="esDefault"
                checked={form.esDefault}
                onChange={(e) => setForm(prev => ({ ...prev, esDefault: e.target.checked }))}
                className="w-4 h-4 text-primary rounded border-neutral-300 focus:ring-primary"
              />
              <label htmlFor="esDefault" className="flex-1">
                <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Establecer como predeterminado
                </span>
                <span className="block text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Este pipeline se usará por defecto al crear leads
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.nombre.trim()}
            className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/25"
          >
            {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Guardar Cambios' : 'Crear Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
};
