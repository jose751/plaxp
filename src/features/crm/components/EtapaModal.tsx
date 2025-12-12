import { useState, useEffect, useRef } from 'react';
import { FaTimes, FaClock, FaTrophy, FaThumbsDown } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  crearEtapaApi,
  actualizarEtapaApi,
  obtenerEtapaPorIdApi,
} from '../api/crmApi';
import { TipoSistema, COLORES_ETAPA } from '../types/crm.types';

interface EtapaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  etapaId?: string | null;
  pipelineId?: string | null;
}

export const EtapaModal = ({ isOpen, onClose, onSuccess, etapaId, pipelineId }: EtapaModalProps) => {
  const isEditing = Boolean(etapaId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: '',
    color: COLORES_ETAPA[0].value,
    tipoSistema: TipoSistema.PROCESO as TipoSistema,
    probabilidadDefault: 0,
    activo: true,
  });

  // Ref para mantener el valor más reciente del formData
  const formDataRef = useRef(formData);
  useEffect(() => {
    formDataRef.current = formData;
    console.log('📝 formData actualizado:', formData.tipoSistema);
  }, [formData]);

  useEffect(() => {
    if (isOpen) {
      if (etapaId) {
        loadEtapa(etapaId);
      } else {
        // Reset form for new etapa
        setFormData({
          nombre: '',
          color: COLORES_ETAPA[0].value,
          tipoSistema: TipoSistema.PROCESO,
          probabilidadDefault: 0,
          activo: true,
        });
        setError(null);
      }
    }
  }, [isOpen, etapaId]);

  const loadEtapa = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerEtapaPorIdApi(id);
      if (response.success) {
        const etapa = response.data;
        // Normalizar tipoSistema a uppercase para coincidir con el enum
        const tipoNormalizado = (etapa.tipoSistema?.toUpperCase() || TipoSistema.PROCESO) as TipoSistema;
        setFormData({
          nombre: etapa.nombre,
          color: etapa.color,
          tipoSistema: tipoNormalizado,
          probabilidadDefault: etapa.probabilidadDefault ?? 0,
          activo: etapa.activo,
        });
      } else {
        setError('Error al cargar la etapa');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la etapa');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Usar el ref para obtener el valor más reciente
    const currentFormData = formDataRef.current;

    console.log('🚀 handleSubmit iniciado');
    console.log('🚀 formData (closure):', formData.tipoSistema);
    console.log('🚀 formDataRef (ref):', currentFormData.tipoSistema);

    setError(null);

    if (!currentFormData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (currentFormData.nombre.trim().length < 2) {
      setError('El nombre debe tener al menos 2 caracteres');
      return;
    }

    try {
      setSaving(true);

      const payload: any = {
        nombre: currentFormData.nombre.trim(),
        color: currentFormData.color,
        tipoSistema: currentFormData.tipoSistema,
        probabilidadDefault: currentFormData.probabilidadDefault,
        activo: currentFormData.activo,
      };

      // Incluir pipelineId solo al crear
      if (!isEditing && pipelineId) {
        payload.pipelineId = pipelineId;
      }

      console.log('📤 Payload:', JSON.stringify(payload));

      if (isEditing && etapaId) {
        const response = await actualizarEtapaApi(etapaId, payload);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || 'Error al actualizar la etapa');
        }
      } else {
        const response = await crearEtapaApi(payload);
        if (response.success) {
          onSuccess();
          onClose();
        } else {
          setError(response.message || 'Error al crear la etapa');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar la etapa');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {isEditing ? 'Editar Etapa' : 'Nueva Etapa'}
          </h3>
          <button
            onClick={onClose}
            disabled={saving}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <CgSpinner className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Contacto inicial, Negociación..."
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLORES_ETAPA.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        className={`
                          w-9 h-9 rounded-lg transition-all
                          ${formData.color === color.value
                            ? 'ring-2 ring-offset-2 ring-neutral-900 dark:ring-neutral-100 dark:ring-offset-dark-card scale-110'
                            : 'hover:scale-105'
                          }
                        `}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                {/* Tipo de Sistema */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Tipo de etapa <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔵 Click PROCESO');
                        setFormData(prev => ({ ...prev, tipoSistema: TipoSistema.PROCESO, probabilidadDefault: prev.probabilidadDefault === 100 || prev.probabilidadDefault === 0 ? 50 : prev.probabilidadDefault }));
                      }}
                      className={`
                        p-2 sm:p-3 rounded-lg border-2 text-center transition-all
                        ${formData.tipoSistema === TipoSistema.PROCESO
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600'
                        }
                      `}
                    >
                      <div className={`flex justify-center mb-1 ${formData.tipoSistema === TipoSistema.PROCESO ? 'text-blue-500' : 'text-neutral-400'}`}>
                        <FaClock className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <p className={`text-[10px] sm:text-xs font-medium ${formData.tipoSistema === TipoSistema.PROCESO ? 'text-blue-700 dark:text-blue-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        Proceso
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        console.log('🟢 Click GANADO');
                        setFormData(prev => ({ ...prev, tipoSistema: TipoSistema.GANADO, probabilidadDefault: 100 }));
                      }}
                      className={`
                        p-2 sm:p-3 rounded-lg border-2 text-center transition-all
                        ${formData.tipoSistema === TipoSistema.GANADO
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600'
                        }
                      `}
                    >
                      <div className={`flex justify-center mb-1 ${formData.tipoSistema === TipoSistema.GANADO ? 'text-green-500' : 'text-neutral-400'}`}>
                        <FaTrophy className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <p className={`text-[10px] sm:text-xs font-medium ${formData.tipoSistema === TipoSistema.GANADO ? 'text-green-700 dark:text-green-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        Ganado
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        console.log('🔴 Click PERDIDO');
                        setFormData(prev => ({ ...prev, tipoSistema: TipoSistema.PERDIDO, probabilidadDefault: 0 }));
                      }}
                      className={`
                        p-2 sm:p-3 rounded-lg border-2 text-center transition-all
                        ${formData.tipoSistema === TipoSistema.PERDIDO
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'border-neutral-200 dark:border-dark-border hover:border-neutral-300 dark:hover:border-neutral-600'
                        }
                      `}
                    >
                      <div className={`flex justify-center mb-1 ${formData.tipoSistema === TipoSistema.PERDIDO ? 'text-red-500' : 'text-neutral-400'}`}>
                        <FaThumbsDown className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <p className={`text-[10px] sm:text-xs font-medium ${formData.tipoSistema === TipoSistema.PERDIDO ? 'text-red-700 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        Perdido
                      </p>
                    </button>
                  </div>
                </div>

                {/* Probabilidad Default */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Probabilidad por defecto (%)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.probabilidadDefault}
                      onChange={(e) => setFormData(prev => ({ ...prev, probabilidadDefault: parseInt(e.target.value) }))}
                      className="flex-1 h-2 bg-neutral-200 dark:bg-dark-border rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <span className={`
                      min-w-[48px] text-center px-2 py-1 rounded text-sm font-medium
                      ${formData.probabilidadDefault >= 70 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                        formData.probabilidadDefault >= 30 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}
                    `}>
                      {formData.probabilidadDefault}%
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                    {formData.tipoSistema === TipoSistema.GANADO
                      ? 'Recomendado: 100% para etapas "Ganado"'
                      : formData.tipoSistema === TipoSistema.PERDIDO
                      ? 'Recomendado: 0% para etapas "Perdido"'
                      : 'Esta probabilidad se asignará automáticamente a las oportunidades que lleguen a esta etapa'}
                  </p>
                </div>

                {/* Estado activo */}
                <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-dark-hover rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Etapa activa
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Las etapas inactivas no aparecen en el tablero
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                    className={`
                      relative w-11 h-6 rounded-full transition-colors flex-shrink-0
                      ${formData.activo
                        ? 'bg-green-500'
                        : 'bg-neutral-300 dark:bg-neutral-600'
                      }
                    `}
                  >
                    <span
                      className={`
                        absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform
                        ${formData.activo ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="flex gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-200 dark:border-dark-border flex-shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
                {isEditing ? 'Guardar' : 'Crear'}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
