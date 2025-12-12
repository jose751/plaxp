import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiArrowLeft,
  HiCheckCircle,
  HiXCircle,
  HiViewBoards,
  HiStar,
  HiExclamation,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi';
import {
  FaGripVertical,
  FaTrophy,
  FaThumbsDown,
  FaUndo,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  listarPipelinesApi,
  eliminarPipelineApi,
  actualizarPipelineApi,
  listarEtapasApi,
  eliminarEtapaApi,
  actualizarEtapaApi,
} from '../api/crmApi';
import type { CrmPipeline, CrmEtapa } from '../types/crm.types';
import { TipoSistema } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { PipelineModal } from '../components/PipelineModal';
import { EtapaModal } from '../components/EtapaModal';

export const CrmPipelinesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pipelineToDelete, setPipelineToDelete] = useState<CrmPipeline | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal de crear/editar pipeline
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false);
  const [editingPipeline, setEditingPipeline] = useState<CrmPipeline | null>(null);

  // Filtro de inactivos
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  // Estados para gestión de etapas
  const [expandedPipeline, setExpandedPipeline] = useState<string | null>(null);
  const [etapasPorPipeline, setEtapasPorPipeline] = useState<Record<string, CrmEtapa[]>>({});
  const [loadingEtapas, setLoadingEtapas] = useState<string | null>(null);
  const [etapaModalOpen, setEtapaModalOpen] = useState(false);
  const [editingEtapaId, setEditingEtapaId] = useState<string | null>(null);
  const [currentPipelineId, setCurrentPipelineId] = useState<string | null>(null);
  const [deleteEtapaModalOpen, setDeleteEtapaModalOpen] = useState(false);
  const [etapaToDelete, setEtapaToDelete] = useState<CrmEtapa | null>(null);
  const [deletingEtapa, setDeletingEtapa] = useState(false);
  const [draggedEtapa, setDraggedEtapa] = useState<CrmEtapa | null>(null);

  const fetchPipelines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listarPipelinesApi(mostrarInactivos);
      if (response.success && response.data) {
        setPipelines(response.data);
      } else {
        setError('Error al cargar los pipelines');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los pipelines');
    } finally {
      setLoading(false);
    }
  }, [mostrarInactivos]);

  useEffect(() => {
    fetchPipelines();
    // Limpiar cache de etapas y recargar si hay un pipeline expandido
    setEtapasPorPipeline({});
    if (expandedPipeline) {
      fetchEtapas(expandedPipeline);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mostrarInactivos]);

  const fetchEtapas = async (pipelineId: string) => {
    try {
      setLoadingEtapas(pipelineId);
      const response = await listarEtapasApi(pipelineId, mostrarInactivos);
      if (response.success && response.data) {
        const etapasData = Array.isArray(response.data) ? response.data : [];
        const sorted = [...etapasData].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        setEtapasPorPipeline(prev => ({ ...prev, [pipelineId]: sorted }));
      }
    } catch (err: any) {
      console.error('Error al cargar etapas:', err);
    } finally {
      setLoadingEtapas(null);
    }
  };

  const handleToggleExpand = async (pipelineId: string) => {
    if (expandedPipeline === pipelineId) {
      setExpandedPipeline(null);
    } else {
      setExpandedPipeline(pipelineId);
      // Siempre recargar etapas al expandir para tener datos actualizados
      await fetchEtapas(pipelineId);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingPipeline(null);
    setPipelineModalOpen(true);
  };

  const handleOpenEditModal = (pipeline: CrmPipeline) => {
    setEditingPipeline(pipeline);
    setPipelineModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchPipelines();
  };

  const handleSetDefault = async (pipeline: CrmPipeline) => {
    if (pipeline.esDefault) return;

    try {
      const response = await actualizarPipelineApi(pipeline.id, { esDefault: true });
      if (response.success) {
        fetchPipelines();
      } else {
        setError('Error al establecer como predeterminado');
      }
    } catch (err: any) {
      setError(err.message || 'Error al establecer como predeterminado');
    }
  };

  const handleToggleActivo = async (pipeline: CrmPipeline) => {
    try {
      const response = await actualizarPipelineApi(pipeline.id, { activo: !pipeline.activo });
      if (response.success) {
        fetchPipelines();
      } else {
        setError('Error al cambiar el estado');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cambiar el estado');
    }
  };

  const handleDelete = async () => {
    if (!pipelineToDelete) return;

    try {
      setDeleting(true);
      const response = await eliminarPipelineApi(pipelineToDelete.id);
      if (response.success) {
        setDeleteModalOpen(false);
        setPipelineToDelete(null);
        fetchPipelines();
      } else {
        setError(response.data?.mensaje || 'Error al eliminar el pipeline');
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar el pipeline');
    } finally {
      setDeleting(false);
    }
  };

  // Funciones para etapas
  const handleOpenCreateEtapaModal = (pipelineId: string) => {
    setCurrentPipelineId(pipelineId);
    setEditingEtapaId(null);
    setEtapaModalOpen(true);
  };

  const handleOpenEditEtapaModal = (etapaId: string, pipelineId: string) => {
    setCurrentPipelineId(pipelineId);
    setEditingEtapaId(etapaId);
    setEtapaModalOpen(true);
  };

  const handleEtapaModalSuccess = () => {
    if (currentPipelineId) {
      fetchEtapas(currentPipelineId);
    }
  };

  const handleReactivarEtapa = async (etapa: CrmEtapa, pipelineId: string) => {
    try {
      const response = await actualizarEtapaApi(etapa.id, { activo: true });
      if (response.success) {
        fetchEtapas(pipelineId);
      } else {
        setError('Error al reactivar la etapa');
      }
    } catch (err: any) {
      setError(err.message || 'Error al reactivar la etapa');
    }
  };

  const handleDeleteEtapa = async () => {
    if (!etapaToDelete || !currentPipelineId) return;

    try {
      setDeletingEtapa(true);
      const response = await eliminarEtapaApi(etapaToDelete.id);
      if (response.success) {
        setDeleteEtapaModalOpen(false);
        setEtapaToDelete(null);
        fetchEtapas(currentPipelineId);
      } else {
        setError(response.message || 'Error al eliminar la etapa');
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la etapa');
    } finally {
      setDeletingEtapa(false);
    }
  };

  // Drag and drop para etapas
  const handleDragStart = (e: React.DragEvent, etapa: CrmEtapa) => {
    setDraggedEtapa(etapa);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetEtapa: CrmEtapa, pipelineId: string) => {
    e.preventDefault();
    if (!draggedEtapa || draggedEtapa.id === targetEtapa.id) {
      setDraggedEtapa(null);
      return;
    }

    if (draggedEtapa.tipoSistema !== targetEtapa.tipoSistema) {
      setDraggedEtapa(null);
      return;
    }

    const etapas = etapasPorPipeline[pipelineId] || [];
    const newEtapas = [...etapas];
    const dragIndex = newEtapas.findIndex(e => e.id === draggedEtapa.id);
    const targetIndex = newEtapas.findIndex(e => e.id === targetEtapa.id);

    const originalOrders = new Map(newEtapas.map(e => [e.id, e.orden]));

    newEtapas.splice(dragIndex, 1);
    newEtapas.splice(targetIndex, 0, draggedEtapa);

    const reordered = newEtapas.map((etapa, index) => ({ ...etapa, orden: index + 1 }));
    setEtapasPorPipeline(prev => ({ ...prev, [pipelineId]: reordered }));
    setDraggedEtapa(null);

    const etapasToUpdate = reordered.filter(
      etapa => etapa.orden !== originalOrders.get(etapa.id)
    );

    try {
      await Promise.all(
        etapasToUpdate.map(etapa =>
          actualizarEtapaApi(etapa.id, { orden: etapa.orden })
        )
      );
    } catch (err: any) {
      console.error('Error al reordenar:', err);
      fetchEtapas(pipelineId);
    }
  };

  const getEstadoBadge = (activo: boolean) => {
    if (activo) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm">
          <HiCheckCircle className="w-3 h-3" />
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm">
        <HiXCircle className="w-3 h-3" />
        Inactivo
      </span>
    );
  };

  const getTipoSistemaBadge = (tipo: TipoSistema) => {
    switch (tipo) {
      case TipoSistema.PROCESO:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
            Proceso
          </span>
        );
      case TipoSistema.GANADO:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <FaTrophy className="w-2.5 h-2.5" />
            Ganado
          </span>
        );
      case TipoSistema.PERDIDO:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
            <FaThumbsDown className="w-2.5 h-2.5" />
            Perdido
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CgSpinner className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/crm/oportunidades')}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary mb-4"
        >
          <HiArrowLeft className="w-4 h-4" />
          Volver a Oportunidades
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                <HiViewBoards className="w-6 h-6 text-white" />
              </div>
              Pipelines de Venta
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Gestiona tus pipelines y sus etapas. Haz clic en un pipeline para ver y editar sus etapas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Toggle mostrar inactivos */}
            <button
              onClick={() => setMostrarInactivos(!mostrarInactivos)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors w-full sm:w-auto ${
                mostrarInactivos
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                  : 'bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-dark-border'
              }`}
            >
              {mostrarInactivos ? 'Ver solo activos' : 'Ver inactivos'}
            </button>
            {hasPermission('crm.crear') && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/25 w-full sm:w-auto"
              >
                <HiPlus className="w-4 h-4" />
                Nuevo Pipeline
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Lista de Pipelines */}
      <div className="space-y-4">
        {pipelines.map((pipeline) => {
          const isExpanded = expandedPipeline === pipeline.id;
          const etapas = etapasPorPipeline[pipeline.id] || [];
          const isLoadingEtapas = loadingEtapas === pipeline.id;

          return (
            <div
              key={pipeline.id}
              className={`
                relative rounded-2xl border shadow-sm transition-all
                ${pipeline.activo
                  ? 'bg-white dark:bg-dark-card border-neutral-200 dark:border-dark-border'
                  : 'bg-neutral-50 dark:bg-dark-card/50 border-neutral-300 dark:border-dark-border/50 opacity-70'
                }
              `}
            >
              {/* Color bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
                style={{ backgroundColor: pipeline.color }}
              />

              {/* Pipeline Header */}
              <div className="p-5 mt-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: pipeline.color }}
                      onClick={() => pipeline.activo && handleToggleExpand(pipeline.id)}
                    >
                      <HiViewBoards className="w-5 h-5" />
                    </div>
                    <div>
                      <h3
                        className={`font-semibold cursor-pointer hover:text-primary transition-colors ${pipeline.activo ? 'text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-neutral-400'}`}
                        onClick={() => pipeline.activo && handleToggleExpand(pipeline.id)}
                      >
                        {pipeline.nombre}
                      </h3>
                      {pipeline.descripcion && (
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-1">
                          {pipeline.descripcion}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Badge Default */}
                    {pipeline.esDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700">
                        <HiStar className="w-3 h-3" />
                        Default
                      </span>
                    )}
                    {getEstadoBadge(pipeline.activo)}
                  </div>
                </div>

                {/* Acciones del Pipeline */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-2">
                    {pipeline.activo && (
                      <button
                        onClick={() => handleToggleExpand(pipeline.id)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                      >
                        {isExpanded ? <HiChevronUp className="w-4 h-4" /> : <HiChevronDown className="w-4 h-4" />}
                        {isExpanded ? 'Ocultar etapas' : 'Ver etapas'}
                        {etapas.length > 0 && <span className="text-xs bg-neutral-200 dark:bg-dark-hover px-1.5 py-0.5 rounded">{etapas.length}</span>}
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!pipeline.esDefault && pipeline.activo && (
                      <button
                        onClick={() => handleSetDefault(pipeline)}
                        className="p-2 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        title="Establecer como predeterminado"
                      >
                        <HiStar className="w-4 h-4" />
                      </button>
                    )}
                    {pipeline.activo && (
                      <button
                        onClick={() => handleOpenEditModal(pipeline)}
                        className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <HiPencil className="w-4 h-4" />
                      </button>
                    )}
                    {!pipeline.esDefault && (
                      <>
                        <button
                          onClick={() => handleToggleActivo(pipeline)}
                          className={`p-2 rounded-lg transition-colors ${
                            pipeline.activo
                              ? 'text-neutral-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                              : 'text-neutral-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                          }`}
                          title={pipeline.activo ? 'Desactivar' : 'Activar'}
                        >
                          {pipeline.activo ? <HiXCircle className="w-4 h-4" /> : <HiCheckCircle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setPipelineToDelete(pipeline);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <HiTrash className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Etapas Expandidas */}
              {isExpanded && pipeline.activo && (
                <div className="border-t border-neutral-200 dark:border-dark-border bg-neutral-50/50 dark:bg-dark-bg/50 rounded-b-2xl">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                        Etapas del Pipeline
                      </h4>
                      {hasPermission('crm.crear') && (
                        <button
                          onClick={() => handleOpenCreateEtapaModal(pipeline.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                        >
                          <HiPlus className="w-3.5 h-3.5" />
                          Nueva Etapa
                        </button>
                      )}
                    </div>

                    {isLoadingEtapas ? (
                      <div className="flex items-center justify-center py-8">
                        <CgSpinner className="w-6 h-6 text-primary animate-spin" />
                      </div>
                    ) : etapas.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                          Este pipeline no tiene etapas configuradas
                        </p>
                        {hasPermission('crm.crear') && (
                          <button
                            onClick={() => handleOpenCreateEtapaModal(pipeline.id)}
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                          >
                            <HiPlus className="w-4 h-4" />
                            Crear primera etapa
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {etapas.map((etapa) => {
                          const probabilidad = etapa.probabilidadDefault;
                          const isGanado = etapa.tipoSistema === TipoSistema.GANADO;
                          const isPerdido = etapa.tipoSistema === TipoSistema.PERDIDO;

                          // Colores según probabilidad
                          const getProbabilidadColor = () => {
                            if (probabilidad >= 70) return { bg: 'bg-green-500', text: 'text-green-600 dark:text-green-400' };
                            if (probabilidad >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' };
                            return { bg: 'bg-red-500', text: 'text-red-600 dark:text-red-400' };
                          };

                          const probColor = getProbabilidadColor();

                          return (
                            <div
                              key={etapa.id}
                              draggable={etapa.activo}
                              onDragStart={(e) => etapa.activo && handleDragStart(e, etapa)}
                              onDragOver={etapa.activo ? handleDragOver : undefined}
                              onDrop={(e) => etapa.activo && handleDrop(e, etapa, pipeline.id)}
                              className={`
                                relative flex items-center gap-4 p-3 rounded-xl border transition-all group
                                ${etapa.activo
                                  ? 'bg-white dark:bg-dark-card border-neutral-200 dark:border-dark-border hover:shadow-md cursor-move'
                                  : 'bg-neutral-100 dark:bg-dark-card/50 border-neutral-200 dark:border-dark-border/50 opacity-60'
                                }
                                ${draggedEtapa?.id === etapa.id ? 'opacity-50 scale-[0.98]' : ''}
                                ${isGanado ? 'border-l-4 border-l-green-500' : ''}
                                ${isPerdido ? 'border-l-4 border-l-red-500' : ''}
                              `}
                            >
                              {/* Grip para arrastrar */}
                              <div className={`${etapa.activo ? 'text-neutral-400 cursor-grab active:cursor-grabbing' : 'text-neutral-300'}`}>
                                <FaGripVertical className="w-3.5 h-3.5" />
                              </div>

                              {/* Icono de etapa */}
                              <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm flex-shrink-0"
                                style={{ backgroundColor: etapa.color }}
                              >
                                {isGanado ? (
                                  <FaTrophy className="w-4 h-4" />
                                ) : isPerdido ? (
                                  <FaThumbsDown className="w-4 h-4" />
                                ) : (
                                  <span className="text-xs font-bold">#{etapa.orden}</span>
                                )}
                              </div>

                              {/* Nombre de la etapa */}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${etapa.activo ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>
                                  {etapa.nombre}
                                </p>
                              </div>

                              {/* Barra de probabilidad */}
                              <div className="hidden sm:flex items-center gap-3 w-48">
                                <div className="flex-1 h-2 bg-neutral-200 dark:bg-dark-hover rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${probColor.bg} rounded-full transition-all duration-300`}
                                    style={{ width: `${probabilidad}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-bold min-w-[3rem] text-right ${probColor.text}`}>
                                  {probabilidad}%
                                </span>
                              </div>

                              {/* Probabilidad en móvil */}
                              <div className="sm:hidden">
                                <span className={`text-sm font-bold ${probColor.text}`}>
                                  {probabilidad}%
                                </span>
                              </div>

                              {/* Badge de tipo */}
                              <div className="hidden md:block">
                                {getTipoSistemaBadge(etapa.tipoSistema)}
                              </div>

                              {/* Acciones */}
                              <div className="flex items-center gap-1">
                                {!etapa.activo && (
                                  <button
                                    onClick={() => handleReactivarEtapa(etapa, pipeline.id)}
                                    className="p-1.5 text-neutral-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    title="Reactivar"
                                  >
                                    <FaUndo className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {etapa.activo && (
                                  <>
                                    <button
                                      onClick={() => handleOpenEditEtapaModal(etapa.id, pipeline.id)}
                                      className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                                      title="Editar"
                                    >
                                      <HiPencil className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setCurrentPipelineId(pipeline.id);
                                        setEtapaToDelete(etapa);
                                        setDeleteEtapaModalOpen(true);
                                      }}
                                      className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                                      title="Eliminar"
                                    >
                                      <HiTrash className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {pipelines.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-dark-hover flex items-center justify-center mb-4">
              <HiViewBoards className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-2">
              No hay pipelines configurados
            </p>
            <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-4">
              Crea tu primer pipeline para organizar tus ventas
            </p>
            {hasPermission('crm.crear') && (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/25 font-medium"
              >
                <HiPlus className="w-4 h-4" />
                Crear Pipeline
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de crear/editar pipeline */}
      <PipelineModal
        isOpen={pipelineModalOpen}
        onClose={() => setPipelineModalOpen(false)}
        onSuccess={handleModalSuccess}
        pipeline={editingPipeline}
      />

      {/* Modal de crear/editar etapa */}
      <EtapaModal
        isOpen={etapaModalOpen}
        onClose={() => {
          setEtapaModalOpen(false);
          setCurrentPipelineId(null);
        }}
        onSuccess={handleEtapaModalSuccess}
        etapaId={editingEtapaId}
        pipelineId={currentPipelineId}
      />

      {/* Modal de confirmación de eliminación de pipeline */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <HiExclamation className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Eliminar pipeline
                  </h3>
                </div>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                ¿Estás seguro de que deseas eliminar el pipeline{' '}
                <span className="font-medium">"{pipelineToDelete?.nombre}"</span>?
              </p>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Si el pipeline tiene oportunidades asociadas, será desactivado en lugar de eliminado permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setPipelineToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {deleting && <CgSpinner className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación de etapa */}
      {deleteEtapaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-md mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <HiExclamation className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Eliminar etapa
                  </h3>
                </div>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400">
                ¿Estás seguro de que deseas eliminar la etapa{' '}
                <span className="font-medium">"{etapaToDelete?.nombre}"</span>?
              </p>
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  Si la etapa tiene oportunidades asociadas, será desactivada en lugar de eliminada permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setDeleteEtapaModalOpen(false);
                  setEtapaToDelete(null);
                }}
                disabled={deletingEtapa}
                className="flex-1 px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteEtapa}
                disabled={deletingEtapa}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {deletingEtapa && <CgSpinner className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
