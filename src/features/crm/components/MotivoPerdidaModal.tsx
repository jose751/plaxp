import { useState } from 'react';
import { HiExclamationCircle } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { MOTIVOS_PERDIDA } from '../types/crm.types';
import type { CrmOportunidad } from '../types/crm.types';

interface MotivoPerdidaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivoPerdida: string) => Promise<void>;
  oportunidad: CrmOportunidad | null;
  etapaNombre: string;
}

export const MotivoPerdidaModal = ({
  isOpen,
  onClose,
  onConfirm,
  oportunidad,
  etapaNombre,
}: MotivoPerdidaModalProps) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>('');
  const [otroMotivo, setOtroMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !oportunidad) return null;

  const handleConfirm = async () => {
    const motivoFinal = motivoSeleccionado === 'OTRO' ? otroMotivo.trim() : motivoSeleccionado;

    if (!motivoFinal) {
      setError('Debes seleccionar un motivo de pérdida');
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
        <div className="p-6 border-b border-neutral-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <HiExclamationCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Motivo de Pérdida
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                ¿Por qué se pierde esta oportunidad?
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            Estás moviendo <span className="font-medium text-neutral-900 dark:text-neutral-100">{oportunidadNombre}</span> a la etapa{' '}
            <span className="font-medium text-red-600 dark:text-red-400">{etapaNombre}</span>.
          </p>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Selecciona el motivo *
            </label>

            <div className="space-y-2">
              {MOTIVOS_PERDIDA.map((motivo) => (
                <label
                  key={motivo.value}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                    ${motivoSeleccionado === motivo.value
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-600'
                      : 'border-neutral-200 dark:border-dark-border hover:bg-neutral-50 dark:hover:bg-dark-hover'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name="motivoPerdida"
                    value={motivo.value}
                    checked={motivoSeleccionado === motivo.value}
                    onChange={(e) => setMotivoSeleccionado(e.target.value)}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
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
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-colors"
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
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {loading && <CgSpinner className="w-4 h-4 animate-spin" />}
            Confirmar Pérdida
          </button>
        </div>
      </div>
    </div>
  );
};
