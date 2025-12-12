import { useState } from 'react';
import { HiClock, HiCheck, HiX, HiBan, HiDotsVertical } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { RecordatorioEstado } from '../types/crm.types';
import type { CrmRecordatorio, ActualizarRecordatorioData } from '../types/crm.types';

interface RecordatoriosListProps {
  recordatorios: CrmRecordatorio[];
  loading: boolean;
  onActualizar: (id: string, data: ActualizarRecordatorioData) => Promise<void>;
  onCancelarSerie?: (serieId: string) => Promise<void>;
}

const ESTADO_CONFIG = {
  [RecordatorioEstado.PENDIENTE]: {
    label: 'Pendiente',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    icon: HiClock,
  },
  [RecordatorioEstado.COMPLETADO]: {
    label: 'Completado',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-300',
    icon: HiCheck,
  },
  [RecordatorioEstado.NO_REALIZADO]: {
    label: 'No realizado',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-300',
    icon: HiX,
  },
  [RecordatorioEstado.CANCELADO]: {
    label: 'Cancelado',
    bgColor: 'bg-neutral-100 dark:bg-neutral-800',
    textColor: 'text-neutral-500 dark:text-neutral-400',
    icon: HiBan,
  },
};

export const RecordatoriosList = ({
  recordatorios,
  loading,
  onActualizar,
  onCancelarSerie,
}: RecordatoriosListProps) => {
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const formatearFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    const esHoy = fecha.toDateString() === hoy.toDateString();
    const esManana = fecha.toDateString() === manana.toDateString();

    if (esHoy) return 'Hoy';
    if (esManana) return 'Mañana';

    return fecha.toLocaleDateString('es', {
      day: 'numeric',
      month: 'short',
      year: fecha.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleMarcarEstado = async (recordatorio: CrmRecordatorio, nuevoEstado: RecordatorioEstado) => {
    setActualizando(recordatorio.id);
    try {
      await onActualizar(recordatorio.id, { estado: nuevoEstado });
    } finally {
      setActualizando(null);
      setMenuAbierto(null);
    }
  };

  const estaVencido = (fechaStr: string) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <CgSpinner className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (recordatorios.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
        <HiClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No hay recordatorios programados</p>
      </div>
    );
  }

  // Agrupar por serie si tienen serieId
  const pendientes = recordatorios.filter(r => r.estado === RecordatorioEstado.PENDIENTE);
  const completados = recordatorios.filter(r => r.estado !== RecordatorioEstado.PENDIENTE);

  return (
    <div className="space-y-4">
      {/* Pendientes */}
      {pendientes.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Pendientes ({pendientes.length})
          </h4>
          <div className="space-y-2">
            {pendientes.map((recordatorio) => {
              const vencido = estaVencido(recordatorio.fechaProgramada);

              return (
                <div
                  key={recordatorio.id}
                  className={`
                    p-3 rounded-lg border transition-colors
                    ${vencido
                      ? 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
                      : 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-card'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full font-medium
                          ${vencido
                            ? 'bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                            : 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                          }
                        `}>
                          {formatearFecha(recordatorio.fechaProgramada)}
                        </span>
                        {recordatorio.serieId && (
                          <span className="text-xs text-neutral-400">
                            ({recordatorio.serieIndice} de serie)
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {recordatorio.titulo}
                      </p>
                      {recordatorio.descripcion && (
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                          {recordatorio.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      {actualizando === recordatorio.id ? (
                        <CgSpinner className="w-5 h-5 animate-spin text-blue-600" />
                      ) : (
                        <>
                          <button
                            onClick={() => handleMarcarEstado(recordatorio, RecordatorioEstado.COMPLETADO)}
                            className="p-1.5 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 transition-colors"
                            title="Marcar como completado"
                          >
                            <HiCheck className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleMarcarEstado(recordatorio, RecordatorioEstado.NO_REALIZADO)}
                            className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                            title="Marcar como no realizado"
                          >
                            <HiX className="w-5 h-5" />
                          </button>
                          <div className="relative">
                            <button
                              onClick={() => setMenuAbierto(menuAbierto === recordatorio.id ? null : recordatorio.id)}
                              className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover text-neutral-400 transition-colors"
                            >
                              <HiDotsVertical className="w-5 h-5" />
                            </button>
                            {menuAbierto === recordatorio.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border py-1 z-10 min-w-[160px]">
                                <button
                                  onClick={() => handleMarcarEstado(recordatorio, RecordatorioEstado.CANCELADO)}
                                  className="w-full px-4 py-2 text-left text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover"
                                >
                                  Cancelar este
                                </button>
                                {recordatorio.serieId && onCancelarSerie && (
                                  <button
                                    onClick={() => {
                                      onCancelarSerie(recordatorio.serieId!);
                                      setMenuAbierto(null);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    Cancelar toda la serie
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historial (completados, no realizados, cancelados) */}
      {completados.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Historial ({completados.length})
          </h4>
          <div className="space-y-2">
            {completados.map((recordatorio) => {
              const config = ESTADO_CONFIG[recordatorio.estado];
              const IconoEstado = config.icon;

              return (
                <div
                  key={recordatorio.id}
                  className="p-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg opacity-75"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${config.bgColor}`}>
                      <IconoEstado className={`w-4 h-4 ${config.textColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {recordatorio.titulo}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {formatearFecha(recordatorio.fechaProgramada)} - {config.label}
                      </p>
                    </div>
                  </div>
                  {recordatorio.notasResultado && (
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 pl-9">
                      {recordatorio.notasResultado}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
