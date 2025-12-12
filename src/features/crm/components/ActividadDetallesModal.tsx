import { Link } from 'react-router-dom';
import {
  HiX,
  HiPhone,
  HiMail,
  HiCalendar,
  HiClipboardList,
  HiClock,
  HiUsers,
  HiExternalLink,
  HiPencil,
} from 'react-icons/hi';
import { FaWhatsapp, FaStickyNote, FaBell } from 'react-icons/fa';
import type { CrmActividad, TipoActividad } from '../types/crm.types';

interface ActividadDetallesModalProps {
  isOpen: boolean;
  onClose: () => void;
  actividad: CrmActividad | null;
  onEdit?: (actividad: CrmActividad) => void;
  showLeadLink?: boolean;
  leadNombre?: string;
}

const TIPO_CONFIG: Record<TipoActividad, { label: string; icon: React.ReactNode; bgColor: string; textColor: string }> = {
  NOTA: {
    label: 'Nota',
    icon: <FaStickyNote className="w-5 h-5" />,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  LLAMADA: {
    label: 'Llamada',
    icon: <HiPhone className="w-5 h-5" />,
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
  },
  CORREO: {
    label: 'Correo',
    icon: <HiMail className="w-5 h-5" />,
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
  WHATSAPP: {
    label: 'WhatsApp',
    icon: <FaWhatsapp className="w-5 h-5" />,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  REUNION: {
    label: 'Reunión',
    icon: <HiCalendar className="w-5 h-5" />,
    bgColor: 'bg-violet-100 dark:bg-violet-900/30',
    textColor: 'text-violet-600 dark:text-violet-400',
  },
  TAREA: {
    label: 'Tarea',
    icon: <HiClipboardList className="w-5 h-5" />,
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
  },
  RECORDATORIO: {
    label: 'Recordatorio',
    icon: <FaBell className="w-5 h-5" />,
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    textColor: 'text-sky-600 dark:text-sky-400',
  },
  CAMBIO_ETAPA: {
    label: 'Cambio de Etapa',
    icon: <HiClipboardList className="w-5 h-5" />,
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    textColor: 'text-slate-600 dark:text-slate-400',
  },
};

const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const ActividadDetallesModal = ({
  isOpen,
  onClose,
  actividad,
  onEdit,
  showLeadLink = false,
  leadNombre,
}: ActividadDetallesModalProps) => {
  if (!isOpen || !actividad) return null;

  const tipoConfig = TIPO_CONFIG[actividad.tipo] || TIPO_CONFIG.NOTA;
  const tienesFecha = actividad.tipo === 'TAREA' || actividad.tipo === 'REUNION' || actividad.tipo === 'RECORDATORIO';
  const esTareaPendiente = tienesFecha && new Date(actividad.fechaFin) > new Date();
  const esTareaVencida = tienesFecha && new Date(actividad.fechaFin) < new Date();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-neutral-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${tipoConfig.bgColor}`}>
              <span className={tipoConfig.textColor}>{tipoConfig.icon}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {tipoConfig.label}
              </h3>
              {esTareaPendiente && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  Pendiente
                </span>
              )}
              {esTareaVencida && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  Vencida
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && actividad.tipo !== 'CAMBIO_ETAPA' && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(actividad);
                }}
                className="p-2 text-neutral-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
                title="Editar actividad"
              >
                <HiPencil className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
            >
              <HiX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Contenido */}
          <div>
            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              Contenido
            </p>
            <div className="p-3 bg-neutral-50 dark:bg-dark-bg rounded-xl">
              <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                {actividad.contenido}
              </p>
            </div>
          </div>

          {/* Fechas para tareas/reuniones/recordatorios */}
          {tienesFecha && (
            <div className="bg-neutral-50 dark:bg-dark-bg rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <HiClock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Inicio</p>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {formatDateTime(actividad.fechaInicio)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <HiClock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Fin</p>
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                    {formatDateTime(actividad.fechaFin)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Participantes */}
          {actividad.participantes && actividad.participantes.length > 0 && (
            <div className="bg-neutral-50 dark:bg-dark-bg rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <HiUsers className="w-4 h-4 text-neutral-400" />
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Asignado a
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {actividad.participantes.map((p) => (
                  <span
                    key={p.usuarioId}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary"
                  >
                    {p.usuarioNombre || `Usuario ${p.usuarioId}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Link al lead (solo en calendario) */}
          {showLeadLink && actividad.leadId && (
            <Link
              to={`/crm/leads/${actividad.leadId}`}
              className="flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 border border-primary/20 rounded-xl transition-colors group"
            >
              <div>
                <p className="text-xs text-primary/70 uppercase tracking-wider font-medium">
                  Lead asociado
                </p>
                <p className="text-sm font-semibold text-primary">
                  {leadNombre || 'Ver detalle del lead'}
                </p>
              </div>
              <HiExternalLink className="w-5 h-5 text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}

          {/* Resultado (si existe) */}
          {actividad.resultado && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wider mb-1">
                Resultado
              </p>
              <p className="text-sm text-green-800 dark:text-green-200">
                {actividad.resultado}
              </p>
            </div>
          )}

          {/* Fecha de creación */}
          <div className="text-xs text-neutral-400 dark:text-neutral-500 text-center pt-2">
            Creada el {formatDateTime(actividad.fechaCreacion)}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
