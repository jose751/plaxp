import { useState, useEffect, useCallback } from 'react';
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
  HiAcademicCap,
  HiTrendingUp,
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiChevronRight,
} from 'react-icons/hi';
import {
  obtenerTableroApi,
  moverLeadApi,
} from '../api/crmApi';
import type { CrmTableroColumna, CrmLead, CrmEtapa } from '../types/crm.types';
import { TipoSistema, RelacionContacto } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import { LeadFormModal } from '../components/LeadFormModal';
import { DeleteLeadModal } from '../components/DeleteLeadModal';

export const CrmTableroPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [columnas, setColumnas] = useState<CrmTableroColumna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedLead, setDraggedLead] = useState<CrmLead | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modal de Lead
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadModalMode, setLeadModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEtapa, setSelectedEtapa] = useState<CrmEtapa | null>(null);
  const [selectedLead, setSelectedLead] = useState<CrmLead | null>(null);

  // Dropdown de acciones
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Modal de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<CrmLead | null>(null);

  const fetchTablero = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerTableroApi();
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

  useEffect(() => {
    fetchTablero();
  }, [fetchTablero]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, lead: CrmLead) => {
    setDraggedLead(lead);
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

  const handleDrop = async (e: React.DragEvent, targetEtapa: CrmEtapa) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedLead || draggedLead.negociacion.etapaId === targetEtapa.id) {
      setDraggedLead(null);
      return;
    }

    const updatedColumnas = columnas.map(col => {
      if (col.etapa.id === draggedLead.negociacion.etapaId) {
        return {
          ...col,
          leads: col.leads.filter(l => l.id !== draggedLead.id),
          total: col.total - 1,
        };
      }
      if (col.etapa.id === targetEtapa.id) {
        const updatedLead = {
          ...draggedLead,
          negociacion: { ...draggedLead.negociacion, etapaId: targetEtapa.id },
        };
        return {
          ...col,
          leads: [...col.leads, updatedLead],
          total: col.total + 1,
        };
      }
      return col;
    });
    setColumnas(updatedColumnas);

    try {
      await moverLeadApi(draggedLead.id, { etapaId: targetEtapa.id });
    } catch (err: any) {
      console.error('Error al mover lead:', err);
      fetchTablero();
    }

    setDraggedLead(null);
  };

  // Modal handlers
  const openCreateLeadModal = (etapa: CrmEtapa) => {
    setSelectedEtapa(etapa);
    setSelectedLead(null);
    setLeadModalMode('create');
    setLeadModalOpen(true);
  };

  const openEditLeadModal = (lead: CrmLead, etapa: CrmEtapa) => {
    setSelectedEtapa(etapa);
    setSelectedLead(lead);
    setLeadModalMode('edit');
    setLeadModalOpen(true);
    setActiveDropdown(null);
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

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getLeadDisplayName = (lead: CrmLead) => {
    return `${lead.alumno.nombre} ${lead.alumno.apellido}`;
  };

  const getContactDisplayName = (lead: CrmLead) => {
    return `${lead.contacto.nombre} ${lead.contacto.apellido}`;
  };

  const getColumnTotal = (leads: CrmLead[]) => {
    return leads.reduce((sum, lead) => sum + (lead.negociacion.montoEstimado || 0), 0);
  };

  const getInitials = (name: string, lastName: string) => {
    return `${name.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Calcular totales globales
  const totalLeads = columnas.reduce((sum, col) => sum + col.total, 0);
  const totalValor = columnas.reduce((sum, col) => sum + getColumnTotal(col.leads), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400 font-medium">Cargando proceso...</p>
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
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Etapa de Ventas</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {totalLeads} prospectos · {formatCurrency(totalValor)} en seguimiento
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasPermission('crm.crear') && (
              <button
                onClick={() => navigate('/crm/etapas')}
                className="flex items-center gap-2 px-4 py-2.5 text-neutral-600 dark:text-neutral-300 bg-white dark:bg-dark-card hover:bg-neutral-50 dark:hover:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-xl transition-all shadow-sm"
              >
                <HiCog className="w-4 h-4" />
                <span className="text-sm font-medium">Configurar</span>
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
        <div className="h-full overflow-x-auto p-4">
          <div className="flex gap-4 h-full min-w-max">
            {columnas.map((columna) => {
              const valorTotal = getColumnTotal(columna.leads);
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
                              onClick={() => openCreateLeadModal(columna.etapa)}
                              className="p-1.5 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Agregar prospecto"
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
                    {columna.leads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead)}
                        onClick={() => navigate(`/crm/leads/${lead.id}`)}
                        className={`
                          group relative bg-white dark:bg-dark-bg rounded-xl border border-neutral-200 dark:border-dark-border
                          p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-lg hover:border-neutral-300 dark:hover:border-dark-hover
                          transition-all duration-200
                          ${draggedLead?.id === lead.id ? 'opacity-40 scale-95' : ''}
                          ${isGanado ? 'border-l-4 border-l-emerald-500' : ''}
                          ${isPerdido ? 'border-l-4 border-l-red-400' : ''}
                        `}
                      >
                        {/* Lead Header */}
                        <div className="flex items-start gap-3 mb-3">
                          {/* Avatar */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0"
                            style={{ backgroundColor: columna.etapa.color }}
                          >
                            {getInitials(lead.alumno.nombre, lead.alumno.apellido)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm truncate group-hover:text-primary transition-colors">
                              {getLeadDisplayName(lead)}
                            </h4>
                            {lead.contacto.relacion !== RelacionContacto.PROPIO && (
                              <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate flex items-center gap-1">
                                <HiUser className="w-3 h-3" />
                                {getContactDisplayName(lead)}
                                <span className="opacity-60">({lead.contacto.relacion})</span>
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="relative flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === lead.id ? null : lead.id);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-all"
                            >
                              <HiDotsVertical className="w-4 h-4" />
                            </button>
                            {activeDropdown === lead.id && (
                              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border py-1.5 z-20">
                                {hasPermission('crm.editar') && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditLeadModal(lead, columna.etapa);
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
                                      setLeadToDelete(lead);
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
                          {lead.contacto.email && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="w-5 h-5 rounded-md bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <HiMail className="w-3 h-3 text-blue-500" />
                              </div>
                              <span className="truncate">{lead.contacto.email}</span>
                            </div>
                          )}
                          {lead.contacto.telefono && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="w-5 h-5 rounded-md bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                <HiPhone className="w-3 h-3 text-emerald-500" />
                              </div>
                              <span>{lead.contacto.telefono}</span>
                            </div>
                          )}
                          {lead.negociacion.cursoId && (
                            <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                              <div className="w-5 h-5 rounded-md bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                <HiAcademicCap className="w-3 h-3 text-violet-500" />
                              </div>
                              <span className="truncate">Curso interesado</span>
                            </div>
                          )}
                        </div>

                        {/* Value Badge */}
                        {lead.negociacion.montoEstimado && (
                          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-dark-border flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                              <HiCurrencyDollar className="w-3.5 h-3.5" />
                              {formatCurrency(lead.negociacion.montoEstimado)}
                            </span>
                            <HiChevronRight className="w-4 h-4 text-neutral-300 dark:text-neutral-600 group-hover:text-primary transition-colors" />
                          </div>
                        )}

                        {/* Hover indicator */}
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/20 pointer-events-none transition-colors" />
                      </div>
                    ))}

                    {columna.leads.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-dark-bg flex items-center justify-center mb-3">
                          <HiUsers className="w-6 h-6 text-neutral-400" />
                        </div>
                        <p className="text-sm text-neutral-400 dark:text-neutral-500 mb-1">Sin prospectos</p>
                        <p className="text-xs text-neutral-300 dark:text-neutral-600">Arrastra aquí o crea uno nuevo</p>
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

      {/* Modals */}
      <LeadFormModal
        isOpen={leadModalOpen}
        onClose={() => setLeadModalOpen(false)}
        onSuccess={fetchTablero}
        etapa={selectedEtapa}
        lead={selectedLead}
        mode={leadModalMode}
      />

      <DeleteLeadModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setLeadToDelete(null);
        }}
        onSuccess={fetchTablero}
        lead={leadToDelete}
      />
    </div>
  );
};
