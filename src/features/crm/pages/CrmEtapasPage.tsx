import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaGripVertical,
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaThumbsDown,
  FaArrowLeft,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { listarEtapasApi, eliminarEtapaApi, actualizarEtapaApi } from '../api/crmApi';
import type { CrmEtapa } from '../types/crm.types';
import { TipoSistema } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { EtapaModal } from '../components/EtapaModal';

export const CrmEtapasPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [etapas, setEtapas] = useState<CrmEtapa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [etapaToDelete, setEtapaToDelete] = useState<CrmEtapa | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [draggedItem, setDraggedItem] = useState<CrmEtapa | null>(null);

  // Modal de crear/editar
  const [etapaModalOpen, setEtapaModalOpen] = useState(false);
  const [editingEtapaId, setEditingEtapaId] = useState<string | null>(null);

  const fetchEtapas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listarEtapasApi();
      if (response.success && response.data) {
        const etapasData = Array.isArray(response.data) ? response.data : [];
        const sorted = [...etapasData].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        setEtapas(sorted);
      } else {
        setError('Error al cargar las etapas');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar las etapas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEtapas();
  }, [fetchEtapas]);

  const handleOpenCreateModal = () => {
    setEditingEtapaId(null);
    setEtapaModalOpen(true);
  };

  const handleOpenEditModal = (etapaId: string) => {
    setEditingEtapaId(etapaId);
    setEtapaModalOpen(true);
  };

  const handleModalSuccess = () => {
    fetchEtapas();
  };

  const handleDelete = async () => {
    if (!etapaToDelete) return;

    try {
      setDeleting(true);
      const response = await eliminarEtapaApi(etapaToDelete.id);
      if (response.success) {
        setEtapas(prev => prev.filter(e => e.id !== etapaToDelete.id));
        setDeleteModalOpen(false);
        setEtapaToDelete(null);
      } else {
        setError(response.message || 'Error al eliminar la etapa');
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la etapa');
    } finally {
      setDeleting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, etapa: CrmEtapa) => {
    setDraggedItem(etapa);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetEtapa: CrmEtapa) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetEtapa.id) {
      setDraggedItem(null);
      return;
    }

    if (draggedItem.tipoSistema !== targetEtapa.tipoSistema) {
      setDraggedItem(null);
      return;
    }

    const newEtapas = [...etapas];
    const dragIndex = newEtapas.findIndex(e => e.id === draggedItem.id);
    const targetIndex = newEtapas.findIndex(e => e.id === targetEtapa.id);

    // Guardar órdenes originales para comparar
    const originalOrders = new Map(newEtapas.map(e => [e.id, e.orden]));

    newEtapas.splice(dragIndex, 1);
    newEtapas.splice(targetIndex, 0, draggedItem);

    const reordered = newEtapas.map((etapa, index) => ({ ...etapa, orden: index + 1 }));
    setEtapas(reordered);
    setDraggedItem(null);

    // Encontrar las etapas que cambiaron de orden
    const etapasToUpdate = reordered.filter(
      etapa => etapa.orden !== originalOrders.get(etapa.id)
    );

    try {
      // Actualizar cada etapa que cambió de orden
      await Promise.all(
        etapasToUpdate.map(etapa =>
          actualizarEtapaApi(etapa.id, { orden: etapa.orden })
        )
      );
    } catch (err: any) {
      console.error('Error al reordenar:', err);
      fetchEtapas();
    }
  };

  const getTipoSistemaBadge = (tipo: TipoSistema) => {
    switch (tipo) {
      case TipoSistema.PROCESO:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
            En Proceso
          </span>
        );
      case TipoSistema.GANADO:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
            <FaTrophy className="w-3 h-3" />
            Ganado
          </span>
        );
      case TipoSistema.PERDIDO:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
            <FaThumbsDown className="w-3 h-3" />
            Perdido
          </span>
        );
    }
  };

  const getEstadoBadge = (activo: boolean) => {
    if (activo) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm">
          <FaCheckCircle className="w-3 h-3" />
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm">
        <FaTimesCircle className="w-3 h-3" />
        Inactivo
      </span>
    );
  };

  const etapasProceso = etapas.filter(e => e.tipoSistema === TipoSistema.PROCESO);
  const etapasGanado = etapas.filter(e => e.tipoSistema === TipoSistema.GANADO);
  const etapasPerdido = etapas.filter(e => e.tipoSistema === TipoSistema.PERDIDO);

  const renderEtapasList = (list: CrmEtapa[], title: string, bgColor: string) => (
    <div className="mb-6">
      <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${bgColor}`}>
        {title} ({list.length})
      </h3>
      <div className="space-y-2">
        {list.map((etapa) => (
          <div
            key={etapa.id}
            draggable
            onDragStart={(e) => handleDragStart(e, etapa)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, etapa)}
            className={`
              p-3 sm:p-4 bg-white dark:bg-dark-card rounded-lg border border-neutral-200 dark:border-dark-border
              shadow-sm hover:shadow-md transition-all cursor-move
              ${draggedItem?.id === etapa.id ? 'opacity-50' : ''}
            `}
          >
            {/* Fila principal */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-neutral-400 dark:text-neutral-500 cursor-grab active:cursor-grabbing">
                <FaGripVertical className="w-4 h-4" />
              </div>

              <div
                className="w-5 h-5 rounded-full flex-shrink-0 border-2 border-white dark:border-dark-card shadow-sm"
                style={{ backgroundColor: etapa.color }}
              />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                  {etapa.nombre}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 sm:hidden">
                  Orden: {etapa.orden}
                </p>
              </div>

              {/* Desktop: badges y acciones en línea */}
              <div className="hidden sm:flex items-center gap-3">
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Orden: {etapa.orden}
                </p>
                {getTipoSistemaBadge(etapa.tipoSistema)}
                {getEstadoBadge(etapa.activo)}

                <div className="flex items-center gap-1 ml-2">
                  {hasPermission('crm.editar') && (
                    <button
                      onClick={() => handleOpenEditModal(etapa.id)}
                      className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  )}
                  {hasPermission('crm.eliminar') && (
                    <button
                      onClick={() => {
                        setEtapaToDelete(etapa);
                        setDeleteModalOpen(true);
                      }}
                      className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Móvil: solo acciones */}
              <div className="flex sm:hidden items-center gap-1">
                {hasPermission('crm.editar') && (
                  <button
                    onClick={() => handleOpenEditModal(etapa.id)}
                    className="p-2 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                )}
                {hasPermission('crm.eliminar') && (
                  <button
                    onClick={() => {
                      setEtapaToDelete(etapa);
                      setDeleteModalOpen(true);
                    }}
                    className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Móvil: badges debajo */}
            <div className="flex sm:hidden items-center gap-2 mt-2 ml-12">
              {getTipoSistemaBadge(etapa.tipoSistema)}
              {getEstadoBadge(etapa.activo)}
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
            No hay etapas en esta categoría
          </p>
        )}
      </div>
    </div>
  );

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
          onClick={() => navigate('/crm')}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary mb-4"
        >
          <FaArrowLeft className="w-3 h-3" />
          Volver al tablero
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Etapas de Venta
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Configura las etapas por las que pasan tus prospectos. Arrastra para reordenar.
            </p>
          </div>
          {hasPermission('crm.crear') && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4" />
              Nueva Etapa
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Etapas agrupadas */}
      {renderEtapasList(etapasProceso, 'En Proceso', 'text-blue-600 dark:text-blue-400')}
      {renderEtapasList(etapasGanado, 'Ganado', 'text-green-600 dark:text-green-400')}
      {renderEtapasList(etapasPerdido, 'Perdido', 'text-red-600 dark:text-red-400')}

      {/* Modal de crear/editar etapa */}
      <EtapaModal
        isOpen={etapaModalOpen}
        onClose={() => setEtapaModalOpen(false)}
        onSuccess={handleModalSuccess}
        etapaId={editingEtapaId}
      />

      {/* Modal de confirmación de eliminación */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Eliminar etapa
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                ¿Estás seguro de que deseas eliminar la etapa{' '}
                <span className="font-medium">"{etapaToDelete?.nombre}"</span>?
                Esta acción no se puede deshacer.
              </p>
              {etapaToDelete?.tipoSistema !== TipoSistema.PROCESO && (
                <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-2">
                  <FaExclamationTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Esta es una etapa de sistema ({etapaToDelete?.tipoSistema}).
                    Los leads en esta etapa podrían verse afectados.
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEtapaToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting && <CgSpinner className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
