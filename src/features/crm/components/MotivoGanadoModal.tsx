import { useState } from 'react';
import { HiSparkles } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { MOTIVOS_GANADO } from '../types/crm.types';
import type { CrmOportunidad } from '../types/crm.types';

interface MotivoGanadoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivoGanado: string) => Promise<void>;
  oportunidad: CrmOportunidad | null;
  etapaNombre: string;
}

export const MotivoGanadoModal = ({
  isOpen,
  onClose,
  onConfirm,
  oportunidad,
  etapaNombre,
}: MotivoGanadoModalProps) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [otroMotivo, setOtroMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !oportunidad) return null;

  const handleConfirm = async () => {
    const motivoFinal = motivoSeleccionado === 'OTRO' ? otroMotivo.trim() : motivoSeleccionado;

    if (!motivoFinal) {
      setError('Debes seleccionar el factor clave');
      return;
    }

    if (motivoSeleccionado === 'OTRO' && !otroMotivo.trim()) {
      setError('Debes especificar el motivo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onConfirm(motivoFinal);
      // Limpiar estado al cerrar
      setMotivoSeleccionado('');
      setOtroMotivo('');
    } catch (err: any) {
      setError(err.message || 'Error al mover la oportunidad');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMotivoSeleccionado('');
    setOtroMotivo('');
    setError(null);
    onClose();
  };

  const oportunidadNombre = oportunidad.titulo || oportunidad.contacto?.nombreCompleto || 'Oportunidad';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md mx-4">
        {/* Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-dark-border bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <HiSparkles className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                ¡Felicidades por la venta!
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                ¿Cuál fue el factor clave?
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">{oportunidadNombre}</span> se marca como ganada.
            {etapaNombre && (
              <> Etapa: <span className="font-medium text-emerald-600 dark:text-emerald-400">{etapaNombre}</span></>
            )}
          </p>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              ¿Por qué nos eligieron? *
            </label>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {MOTIVOS_GANADO.map((motivo) => (
                <label
                  key={motivo.value}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${motivoSeleccionado === motivo.value
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600'
                      : 'border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-hover'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="motivoGanado"
                    value={motivo.value}
                    checked={motivoSeleccionado === motivo.value}
                    onChange={(e) => setMotivoSeleccionado(e.target.value)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {motivo.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Campo para "Otro motivo" */}
            {motivoSeleccionado === 'OTRO' && (
              <div className="mt-3">
                <input
                  type="text"
                  value={otroMotivo}
                  onChange={(e) => setOtroMotivo(e.target.value)}
                  placeholder="Especifica el motivo..."
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-colors"
                  autoFocus
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !motivoSeleccionado}
            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {loading && <CgSpinner className="w-4 h-4 animate-spin" />}
            ¡Registrar Victoria!
          </button>
        </div>
      </div>
    </div>
  );
};
