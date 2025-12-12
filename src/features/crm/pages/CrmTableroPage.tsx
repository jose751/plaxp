import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiCog,
  HiPhone,
  HiMail,
  HiCurrencyDollar,
  HiDotsVertical,
  HiPencil,
  HiTrash,
  HiUser,
  HiUsers,
  HiTrendingUp,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiChevronRight,
  HiChevronDown,
  HiLink,
  HiViewBoards,
} from 'react-icons/hi';
import {
  obtenerTableroOportunidadesApi,
  moverOportunidadApi,
  listarPipelinesApi,
  eliminarOportunidadApi,
} from '../api/crmApi';
import type { CrmOportunidad, CrmEtapa, CrmPipeline, ObtenerTableroOportunidadesResponse } from '../types/crm.types';
import { TipoSistema } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { MotivoPerdidaModal } from '../components/MotivoPerdidaModal';
import { MotivoGanadoModal } from '../components/MotivoGanadoModal';

interface ColumnaTablero {
  etapa: CrmEtapa;
  oportunidades: CrmOportunidad[];
  total: number;
}

export const CrmTableroPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [columnas, setColumnas] = useState<ColumnaTablero[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pipelines
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [loadingPipelines, setLoadingPipelines] = useState(true);
  const [draggedOportunidad, setDraggedOportunidad] = useState<CrmOportunidad | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Dropdown de acciones
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Modal de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [oportunidadToDelete, setOportunidadToDelete] = useState<CrmOportunidad | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal de motivo de pérdida
  const [motivoPerdidaModalOpen, setMotivoPerdidaModalOpen] = useState(false);
  const [oportunidadParaPerdida, setOportunidadParaPerdida] = useState<CrmOportunidad | null>(null);
  const [etapaPerdida, setEtapaPerdida] = useState<CrmEtapa | null>(null);

  // Modal de motivo de victoria (ganado)
  const [motivoGanadoModalOpen, setMotivoGanadoModalOpen] = useState(false);
  const [oportunidadParaGanado, setOportunidadParaGanado] = useState<CrmOportunidad | null>(null);
  const [etapaGanado, setEtapaGanado] = useState<CrmEtapa | null>(null);

  // Ref para el contenedor del tablero (auto-scroll)
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  // Cargar pipelines al inicio
  const fetchPipelines = useCallback(async () => {
    try {
      setLoadingPipelines(true);
      const response = await listarPipelinesApi();
      if (response.success && response.data) {
        setPipelines(response.data);
        // Seleccionar el pipeline default o el primero disponible
        const defaultPipeline = response.data.find(p => p.esDefault) || response.data[0];
        if (defaultPipeline && !selectedPipelineId) {
          setSelectedPipelineId(defaultPipeline.id);
        } else if (response.data.length === 0) {
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar pipelines:', err);
    } finally {
      setLoadingPipelines(false);
    }
  }, [selectedPipelineId]);

  const fetchTablero = useCallback(async (pipelineId?: string | null) => {
    if (!pipelineId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response: ObtenerTableroOportunidadesResponse = await obtenerTableroOportunidadesApi(pipelineId);
      if (response.success) {
        const columnasOrdenadas = (response.data || []).sort(
          (a, b) => a.etapa.orden - b.etapa.orden
        );
        setColumnas(columnasOrdenadas);
      } else {
        setError('Error al cargar el tablero');
        setColumnas([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el tablero');
      setColumnas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar pipelines al montar
  useEffect(() => {
    fetchPipelines();
  }, []);

  // Cargar tablero cuando cambia el pipeline seleccionado
  useEffect(() => {
    if (selectedPipelineId) {
      fetchTablero(selectedPipelineId);
    }
  }, [selectedPipelineId, fetchTablero]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Auto-scroll durante el drag
  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback((direction: 'left' | 'right') => {
    // Si ya está scrolleando en esa dirección, no hacer nada
    if (scrollIntervalRef.current) {
      stopAutoScroll();
    }

    const scrollSpeed = direction === 'left' ? -20 : 20;

    scrollIntervalRef.current = window.setInterval(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft += scrollSpeed;
      }
    }, 16); // ~60fps
  }, [stopAutoScroll]);

  // Listener global para detectar posición del mouse durante el drag
  useEffect(() => {
    if (!draggedOportunidad) {
      stopAutoScroll();
      return;
    }

    const handleGlobalDrag = (e: DragEvent) => {
      if (!scrollContainerRef.current || !draggedOportunidad) return;

      const container = scrollContainerRef.current;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX;

      const edgeThreshold = 120; // Zona de activación (120px desde el borde)

      if (mouseX > 0) { // Solo si el mouse está en la ventana
        if (mouseX < rect.left + edgeThreshold && mouseX >= rect.left) {
          // Cerca del borde izquierdo del contenedor
          startAutoScroll('left');
        } else if (mouseX > rect.right - edgeThreshold && mouseX <= rect.right) {
          // Cerca del borde derecho del contenedor
          startAutoScroll('right');
        } else {
          stopAutoScroll();
        }
      }
    };

    // Agregar listener global
    document.addEventListener('drag', handleGlobalDrag);
    document.addEventListener('dragend', stopAutoScroll);

    return () => {
      document.removeEventListener('drag', handleGlobalDrag);
      document.removeEventListener('dragend', stopAutoScroll);
      stopAutoScroll();
    };
  }, [draggedOportunidad, startAutoScroll, stopAutoScroll]);

  // Limpiar el intervalo de scroll al desmontar el componente
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, oportunidad: CrmOportunidad) => {
    setDraggedOportunidad(oportunidad);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, etapaId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(etapaId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    stopAutoScroll();
    setDraggedOportunidad(null);
  };

  const handleDrop = async (e: React.DragEvent, targetEtapa: CrmEtapa) => {
    e.preventDefault();
    setDragOverColumn(null);
    stopAutoScroll();

    if (!draggedOportunidad || draggedOportunidad.etapaId === targetEtapa.id) {
      setDraggedOportunidad(null);
      return;
    }

    // Si la etapa destino es de tipo PERDIDO, abrir modal para pedir motivo
    if (targetEtapa.tipoSistema === TipoSistema.PERDIDO) {
      setOportunidadParaPerdida(draggedOportunidad);
      setEtapaPerdida(targetEtapa);
      setMotivoPerdidaModalOpen(true);
      setDraggedOportunidad(null);
      return;
    }

    // Si la etapa destino es de tipo GANADO, abrir modal para pedir factor clave
    if (targetEtapa.tipoSistema === TipoSistema.GANADO) {
      setOportunidadParaGanado(draggedOportunidad);
      setEtapaGanado(targetEtapa);
      setMotivoGanadoModalOpen(true);
      setDraggedOportunidad(null);
      return;
    }

    // Mover normalmente
    await ejecutarMovimiento(draggedOportunidad, targetEtapa);
  };

  // Función auxiliar para ejecutar el movimiento
  const ejecutarMovimiento = async (
    oportunidad: CrmOportunidad,
    targetEtapa: CrmEtapa,
    options?: { motivoPerdida?: string; motivoGanado?: string }
  ) => {
    const updatedColumnas = columnas.map(col => {
      if (col.etapa.id === oportunidad.etapaId) {
        return {
          ...col,
          oportunidades: col.oportunidades.filter(o => o.id !== oportunidad.id),
          total: col.total - 1,
        };
      }
      if (col.etapa.id === targetEtapa.id) {
        const updatedOportunidad = {
          ...oportunidad,
          etapaId: targetEtapa.id,
        };
        return {
          ...col,
          oportunidades: [...col.oportunidades, updatedOportunidad],
          total: col.total + 1,
        };
      }
      return col;
    });
    setColumnas(updatedColumnas);

    try {
      await moverOportunidadApi(oportunidad.id, {
        etapaId: targetEtapa.id,
        motivoPerdida: options?.motivoPerdida,
        motivoGanado: options?.motivoGanado,
      });
    } catch (err: any) {
      console.error('Error al mover oportunidad:', err);
      fetchTablero(selectedPipelineId);
    }

    setDraggedOportunidad(null);
  };

  // Handler para confirmar pérdida desde el modal
  const handleConfirmarPerdida = async (motivoPerdida: string) => {
    if (!oportunidadParaPerdida || !etapaPerdida) return;

    await ejecutarMovimiento(oportunidadParaPerdida, etapaPerdida, { motivoPerdida });

    setMotivoPerdidaModalOpen(false);
    setOportunidadParaPerdida(null);
    setEtapaPerdida(null);
  };

  // Handler para confirmar victoria desde el modal
  const handleConfirmarGanado = async (motivoGanado: string) => {
    if (!oportunidadParaGanado || !etapaGanado) return;

    await ejecutarMovimiento(oportunidadParaGanado, etapaGanado, { motivoGanado });

    setMotivoGanadoModalOpen(false);
    setOportunidadParaGanado(null);
    setEtapaGanado(null);
  };

  // Función para refrescar el tablero
  const refreshTablero = useCallback(() => {
    fetchTablero(selectedPipelineId);
  }, [fetchTablero, selectedPipelineId]);

  // Handler para cambiar el pipeline seleccionado
  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
  };

  // Handler para eliminar oportunidad
  const handleDeleteOportunidad = async () => {
    if (!oportunidadToDelete) return;

    try {
      setDeleting(true);
      await eliminarOportunidadApi(oportunidadToDelete.id);
      refreshTablero();
      setDeleteModalOpen(false);
      setOportunidadToDelete(null);
    } catch (err: any) {
      console.error('Error al eliminar:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Helpers
  const getColumnIcon = (tipoSistema: TipoSistema) => {
    switch (tipoSistema) {
      case TipoSistema.GANADO:
        return <HiCheckCircle className="w-4 h-4" />;
      case TipoSistema.PERDIDO:
        return <HiXCircle className="w-4 h-4" />;
      default:
        return <HiClock className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return null;
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getColumnTotal = (oportunidades: CrmOportunidad[]) => {
    return oportunidades.reduce((sum, op) => sum + (parseFloat(op.montoEstimado || '0') || 0), 0);
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Calcular totales globales
  const totalOportunidades = columnas.reduce((sum, col) => sum + col.total, 0);
  const totalValor = columnas.reduce((sum, col) => sum + getColumnTotal(col.oportunidades), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Cargando tablero...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
              <HiTrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Pipeline de Ventas</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {totalOportunidades} oportunidades · {formatCurrency(totalValor)} en seguimiento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Selector de Pipeline */}
            {pipelines.length > 0 && (
              <div className="relative">
                <select
                  value={selectedPipelineId || ''}
                  onChange={(e) => handlePipelineChange(e.target.value)}
                  disabled={loadingPipelines}
                  className="appearance-none pl-10 pr-10 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-xl transition-all shadow-sm cursor-pointer hover:bg-neutral-50 dark:hover:bg-dark-hover focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  style={{ minWidth: '180px' }}
                >
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.nombre}
                    </option>
                  ))}
                </select>
                <HiViewBoards className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              </div>
            )}

            {/* Botón para gestionar pipelines */}
            {hasPermission('crm.crear') && (
              <button
                onClick={() => navigate('/crm/pipelines')}
                className="flex items-center gap-2 px-4 py-2.5 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-dark-card hover:bg-neutral-50 dark:hover:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl transition-all shadow-sm"
                title="Gestionar Pipelines"
              >
                <HiViewBoards className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Pipelines</span>
              </button>
            )}

            <button
              onClick={() => navigate('/crm/integraciones')}
              className="flex items-center gap-2 px-4 py-2.5 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-dark-card hover:bg-neutral-50 dark:hover:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl transition-all shadow-sm"
            >
              <HiLink className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Integraciones</span>
            </button>
            {hasPermission('crm.crear') && (
              <button
                onClick={() => navigate('/crm/etapas')}
                className="flex items-center gap-2 px-4 py-2.5 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-dark-card hover:bg-neutral-50 dark:hover:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl transition-all shadow-sm"
              >
                <HiCog className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">Configurar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex-shrink-0 mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden rounded-2xl border border-neutral-200 dark:border-dark-border bg-gradient-to-br from-neutral-50 to-neutral-100/50 dark:from-dark-bg dark:to-dark-card/50">
        <div
          ref={scrollContainerRef}
          className="h-full overflow-x-auto p-4"
        >
          <div className="flex gap-4 h-full min-w-max">
            {columnas.map((columna) => {
              const valorTotal = getColumnTotal(columna.oportunidades);
              const isGanado = columna.etapa.tipoSistema === TipoSistema.GANADO;
              const isPerdido = columna.etapa.tipoSistema === TipoSistema.PERDIDO;

              return (
                <div
                  key={columna.etapa.id}
                  onDragOver={(e) => handleDragOver(e, columna.etapa.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, columna.etapa)}
                  className={`
                    w-80 flex-shrink-0 flex flex-col rounded-2xl transition-all duration-200 overflow-hidden
                    ${dragOverColumn === columna.etapa.id
                      ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-dark-bg scale-[1.02]'
                      : ''
                    }
                    bg-white dark:bg-dark-card shadow-sm border border-neutral-200/50 dark:border-dark-border/50
                  `}
                >
                  {/* Column Header */}
                  <div className="flex-shrink-0">
                    {/* Color bar */}
                    <div
                      className="h-1.5"
                      style={{ backgroundColor: columna.etapa.color }}
                    />

                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md"
                            style={{ backgroundColor: columna.etapa.color }}
                          >
                            {getColumnIcon(columna.etapa.tipoSistema)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-neutral-900 dark:text-white text-sm">
                              {columna.etapa.nombre}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="px-2.5 py-1 text-xs font-bold rounded-lg text-white shadow-sm"
                            style={{ backgroundColor: columna.etapa.color }}
                          >
                            {columna.total}
                          </span>
                          {hasPermission('crm.crear') && (
                            <button
                              onClick={() => navigate('/crm/oportunidades?crear=true&etapaId=' + columna.etapa.id)}
                              className="p-1.5 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Agregar oportunidad"
                            >
                              <HiPlus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Value indicator */}
                      {valorTotal > 0 && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <HiCurrencyDollar className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(valorTotal)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column Content */}
                  <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2.5">
                    {columna.oportunidades.map((oportunidad) => (
                      <div
                        key={oportunidad.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, oportunidad)}
                        onDragEnd={handleDragEnd}
                        onClick={() => navigate(`/crm/contactos/view/${oportunidad.contactoId}`)}
                        className={`
                          group relative bg-white dark:bg-dark-bg rounded-xl border border-neutral-200 dark:border-dark-border
                          p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg hover:border-neutral-300 dark:hover:border-dark-hover
                          transition-all duration-200
                          ${draggedOportunidad?.id === oportunidad.id ? 'opacity-40 scale-95' : ''}
                          ${isGanado ? 'border-l-4 border-l-emerald-500' : ''}
                          ${isPerdido ? 'border-l-4 border-l-red-400' : ''}
                        `}
                      >
                        {/* Oportunidad Header */}
                        <div className="flex items-start gap-3 mb-3">
                          {/* Avatar */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"
                            style={{ backgroundColor: columna.etapa.color }}
                          >
                            {oportunidad.contacto ? getInitials(oportunidad.contacto.nombreCompleto) : 'OP'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors">
                              {oportunidad.titulo}
                            </h4>
                            {oportunidad.contacto && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1">
                                <HiUser className="w-3 h-3" />
                                {oportunidad.contacto.nombreCompleto}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === oportunidad.id ? null : oportunidad.id);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-all"
                            >
                              <HiDotsVertical className="w-4 h-4" />
                            </button>
                            {activeDropdown === oportunidad.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border py-1.5 z-20">
                                {hasPermission('crm.editar') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/crm/oportunidades?editar=${oportunidad.id}`);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-hover transition-colors"
                                  >
                                    <HiPencil className="w-4 h-4" />
                                    Editar
                                  </button>
                                )}
                                {hasPermission('crm.eliminar') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOportunidadToDelete(oportunidad);
                                      setDeleteModalOpen(true);
                                      setActiveDropdown(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  >
                                    <HiTrash className="w-4 h-4" />
                                    Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1.5">
                          {oportunidad.contacto?.correo && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <HiMail className="w-3 h-3 text-blue-500" />
                              </div>
                              <span className="truncate">{oportunidad.contacto.correo}</span>
                            </div>
                          )}
                          {oportunidad.contacto?.telefono && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                <HiPhone className="w-3 h-3 text-emerald-500" />
                              </div>
                              <span>{oportunidad.contacto.telefono}</span>
                            </div>
                          )}
                        </div>

                        {/* Value Badge */}
                        {oportunidad.montoEstimado && (
                          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-dark-border flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                              <HiCurrencyDollar className="w-3.5 h-3.5" />
                              {formatCurrency(parseInt(oportunidad.montoEstimado))}
                            </span>
                            <HiChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-primary transition-colors" />
                          </div>
                        )}

                        {/* Hover indicator */}
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors" />
                      </div>
                    ))}

                    {columna.oportunidades.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-dark-bg flex items-center justify-center mb-3">
                          <HiUsers className="w-6 h-6 text-neutral-400" />
                        </div>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-1">Sin oportunidades</p>
                        <p className="text-xs text-neutral-300 dark:text-neutral-600">Arrastra aquí o crea una nueva</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {columnas.length === 0 && (
              <div className="flex-1 flex items-center justify-center min-w-[300px]">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-dark-card flex items-center justify-center mx-auto mb-4">
                    <HiCog className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-2">
                    No hay etapas configuradas
                  </p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">
                    Configura las etapas de tu proceso de ventas
                  </p>
                  {hasPermission('crm.crear') && (
                    <button
                      onClick={() => navigate('/crm/etapas')}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
                    >
                      <HiPlus className="w-4 h-4" />
                      Crear etapas
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && oportunidadToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-card rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              Eliminar Oportunidad
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              ¿Estás seguro de eliminar la oportunidad "{oportunidadToDelete.titulo}"? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setOportunidadToDelete(null);
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteOportunidad}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Motivo Pérdida Modal */}
      <MotivoPerdidaModal
        isOpen={motivoPerdidaModalOpen}
        onClose={() => {
          setMotivoPerdidaModalOpen(false);
          setOportunidadParaPerdida(null);
          setEtapaPerdida(null);
        }}
        onConfirm={handleConfirmarPerdida}
        oportunidad={oportunidadParaPerdida}
        etapaNombre={etapaPerdida?.nombre || 'Perdido'}
      />

      {/* Motivo Ganado Modal */}
      <MotivoGanadoModal
        isOpen={motivoGanadoModalOpen}
        onClose={() => {
          setMotivoGanadoModalOpen(false);
          setOportunidadParaGanado(null);
          setEtapaGanado(null);
        }}
        onConfirm={handleConfirmarGanado}
        oportunidad={oportunidadParaGanado}
        etapaNombre={etapaGanado?.nombre || 'Ganado'}
      />
    </div>
  );
};
