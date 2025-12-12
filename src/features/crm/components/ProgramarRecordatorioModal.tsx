import { useState } from 'react';
import { HiX } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { RecordatorioIntervalo } from '../types/crm.types';
import type { CrmLead, CrearSerieRecordatoriosData, CrearRecordatorioData } from '../types/crm.types';

interface ProgramarRecordatorioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSimple: (data: CrearRecordatorioData) => Promise<void>;
  onConfirmSerie: (data: CrearSerieRecordatoriosData) => Promise<void>;
  lead: CrmLead | null;
}

type TipoRecordatorio = 'simple' | 'serie';

// Opciones de inicio predefinidas
const OPCIONES_INICIO = [
  { value: 'hoy', label: 'Hoy' },
  { value: '1_dia', label: '1 día' },
  { value: '3_dias', label: '3 días' },
  { value: '1_semana', label: '1 sem' },
  { value: '2_semanas', label: '2 sem' },
  { value: '1_mes', label: '1 mes' },
] as const;

// Opciones de plazo predefinidas
const OPCIONES_PLAZO = [
  { cantidad: 1, unidad: RecordatorioIntervalo.SEMANAS, label: '1 sem' },
  { cantidad: 2, unidad: RecordatorioIntervalo.SEMANAS, label: '2 sem' },
  { cantidad: 1, unidad: RecordatorioIntervalo.MESES, label: '1 mes' },
  { cantidad: 3, unidad: RecordatorioIntervalo.MESES, label: '3 mes' },
  { cantidad: 6, unidad: RecordatorioIntervalo.MESES, label: '6 mes' },
  { cantidad: 12, unidad: RecordatorioIntervalo.MESES, label: '1 año' },
] as const;

// Opciones de intervalo predefinidas
const OPCIONES_INTERVALO = [
  { cantidad: 1, unidad: RecordatorioIntervalo.DIAS, label: 'Diario' },
  { cantidad: 2, unidad: RecordatorioIntervalo.DIAS, label: '2 días' },
  { cantidad: 3, unidad: RecordatorioIntervalo.DIAS, label: '3 días' },
  { cantidad: 1, unidad: RecordatorioIntervalo.SEMANAS, label: 'Semanal' },
  { cantidad: 2, unidad: RecordatorioIntervalo.SEMANAS, label: '2 sem' },
  { cantidad: 1, unidad: RecordatorioIntervalo.MESES, label: 'Mensual' },
] as const;

export const ProgramarRecordatorioModal = ({
  isOpen,
  onClose,
  onConfirmSimple,
  onConfirmSerie,
  lead,
}: ProgramarRecordatorioModalProps) => {
  const [tipo, setTipo] = useState<TipoRecordatorio>('serie');
  const [titulo, setTitulo] = useState('Seguimiento');
  const [descripcion, setDescripcion] = useState('');

  // Para recordatorio simple
  const [fechaSimple, setFechaSimple] = useState('');

  // Para serie de recordatorios
  const [inicioSeleccionado, setInicioSeleccionado] = useState('1_semana');
  const [plazoIndex, setPlazoIndex] = useState(2); // 1 mes por defecto
  const [intervaloIndex, setIntervaloIndex] = useState(3); // Semanal por defecto

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !lead) return null;

  const calcularFechaInicio = (): Date => {
    const hoy = new Date();
    hoy.setHours(9, 0, 0, 0);

    switch (inicioSeleccionado) {
      case 'hoy': return hoy;
      case '1_dia': hoy.setDate(hoy.getDate() + 1); return hoy;
      case '3_dias': hoy.setDate(hoy.getDate() + 3); return hoy;
      case '1_semana': hoy.setDate(hoy.getDate() + 7); return hoy;
      case '2_semanas': hoy.setDate(hoy.getDate() + 14); return hoy;
      case '1_mes': hoy.setMonth(hoy.getMonth() + 1); return hoy;
      default: return hoy;
    }
  };

  const calcularNumeroRecordatorios = (): number => {
    const plazo = OPCIONES_PLAZO[plazoIndex];
    const intervalo = OPCIONES_INTERVALO[intervaloIndex];

    const plazoDias = plazo.unidad === RecordatorioIntervalo.SEMANAS
      ? plazo.cantidad * 7
      : plazo.cantidad * 30;

    const intervaloDias = intervalo.unidad === RecordatorioIntervalo.DIAS
      ? intervalo.cantidad
      : intervalo.unidad === RecordatorioIntervalo.SEMANAS
        ? intervalo.cantidad * 7
        : intervalo.cantidad * 30;

    return Math.floor(plazoDias / intervaloDias) + 1;
  };

  const handleConfirm = async () => {
    if (!titulo.trim()) {
      setError('El título es requerido');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (tipo === 'simple') {
        if (!fechaSimple) {
          setError('Selecciona una fecha');
          return;
        }
        await onConfirmSimple({
          leadId: lead.id,
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || undefined,
          fechaProgramada: new Date(fechaSimple).toISOString(),
        });
      } else {
        const plazo = OPCIONES_PLAZO[plazoIndex];
        const intervalo = OPCIONES_INTERVALO[intervaloIndex];

        await onConfirmSerie({
          leadId: lead.id,
          titulo: titulo.trim(),
          descripcion: descripcion.trim() || undefined,
          fechaInicio: calcularFechaInicio().toISOString(),
          plazoCantidad: plazo.cantidad,
          plazoUnidad: plazo.unidad,
          intervaloCantidad: intervalo.cantidad,
          intervaloUnidad: intervalo.unidad,
        });
      }

      handleClose();
    } catch (err: any) {
      setError(err.message || 'Error al crear recordatorio');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTipo('serie');
    setTitulo('Seguimiento');
    setDescripcion('');
    setFechaSimple('');
    setInicioSeleccionado('1_semana');
    setPlazoIndex(2);
    setIntervaloIndex(3);
    setError(null);
    onClose();
  };

  const leadNombre = `${lead.alumno.nombre} ${lead.alumno.apellido}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200 dark:border-dark-border bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Programar Recordatorios
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{leadNombre}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-white/50 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Layout horizontal */}
        <div className="p-5 flex gap-5">
          {/* Columna izquierda - Datos básicos */}
          <div className="flex-1 space-y-4">
            {/* Tipo de recordatorio */}
            <div className="flex gap-2 p-1 bg-neutral-100 dark:bg-dark-bg rounded-lg">
              <button
                type="button"
                onClick={() => setTipo('serie')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tipo === 'serie'
                    ? 'bg-white dark:bg-dark-card text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Serie programada
              </button>
              <button
                type="button"
                onClick={() => setTipo('simple')}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  tipo === 'simple'
                    ? 'bg-white dark:bg-dark-card text-sky-600 dark:text-sky-400 shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'
                }`}
              >
                Único
              </button>
            </div>

            {/* Título */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                Título
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Seguimiento, Llamar..."
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-colors"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                Descripción (opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-colors resize-none"
              />
            </div>

            {tipo === 'simple' && (
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                  Fecha y hora
                </label>
                <input
                  type="datetime-local"
                  value={fechaSimple}
                  onChange={(e) => setFechaSimple(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-colors"
                />
              </div>
            )}
          </div>

          {/* Columna derecha - Configuración de serie (solo si es serie) */}
          {tipo === 'serie' && (
            <div className="w-56 space-y-4 border-l border-neutral-200 dark:border-dark-border pl-5">
              {/* Cuándo empezar */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                  Empezar en
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {OPCIONES_INICIO.map((opcion) => (
                    <button
                      key={opcion.value}
                      type="button"
                      onClick={() => setInicioSeleccionado(opcion.value)}
                      className={`px-2 py-1.5 text-[11px] rounded-lg border transition-colors ${
                        inicioSeleccionado === opcion.value
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                          : 'border-neutral-200 dark:border-dark-border text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      {opcion.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duración total */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                  Durante
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {OPCIONES_PLAZO.map((opcion, index) => (
                    <button
                      key={opcion.label}
                      type="button"
                      onClick={() => setPlazoIndex(index)}
                      className={`px-2 py-1.5 text-[11px] rounded-lg border transition-colors ${
                        plazoIndex === index
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                          : 'border-neutral-200 dark:border-dark-border text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      {opcion.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Frecuencia */}
              <div>
                <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 uppercase tracking-wide">
                  Frecuencia
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {OPCIONES_INTERVALO.map((opcion, index) => (
                    <button
                      key={opcion.label}
                      type="button"
                      onClick={() => setIntervaloIndex(index)}
                      className={`px-2 py-1.5 text-[11px] rounded-lg border transition-colors ${
                        intervaloIndex === index
                          ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                          : 'border-neutral-200 dark:border-dark-border text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      {opcion.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                <p className="text-xs text-sky-800 dark:text-sky-200 text-center">
                  <span className="font-bold text-lg block">{calcularNumeroRecordatorios()}</span>
                  recordatorios
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-5 pb-3">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex gap-3 px-5 py-3 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg">
          <button
            onClick={handleClose}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || !titulo.trim()}
            className="flex-1 px-4 py-2 text-sm bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {loading && <CgSpinner className="w-4 h-4 animate-spin" />}
            {tipo === 'serie' ? `Crear ${calcularNumeroRecordatorios()}` : 'Crear'}
          </button>
        </div>
      </div>
    </div>
  );
};
