import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaCog,
  FaPhone,
  FaEnvelope,
  FaDollarSign,
  FaEllipsisV,
  FaEdit,
  FaTrash,
  FaTimes,
  FaUser,
  FaChild,
  FaHandshake,
  FaGraduationCap,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  obtenerTableroApi,
  moverLeadApi,
  crearLeadApi,
  actualizarLeadApi,
  eliminarLeadApi,
} from '../api/crmApi';
import { listarCursosApi } from '../../cursos/api/cursosApi';
import type { CrmTableroColumna, CrmLead, CrmEtapa } from '../types/crm.types';
import type { Curso } from '../../cursos/types/curso.types';
import { TipoSistema, RelacionContacto, MedioContactoPreferido } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

// Estado inicial del formulario
const initialLeadForm = {
  // Contacto (solo se usa si relación no es PROPIO)
  contactoNombre: '',
  contactoApellido: '',
  contactoTelefono: '',
  contactoEmail: '',
  contactoRelacion: RelacionContacto.PROPIO as string,
  medioContactoPreferido: '' as string,
  // Alumno
  alumnoNombre: '',
  alumnoApellido: '',
  alumnoFechaNacimiento: '',
  // Negociación
  cursoId: '',
  origen: '',
  montoEstimado: '',
};

// Opciones de origen
const ORIGENES = [
  'Facebook',
  'Instagram',
  'WhatsApp',
  'Referido',
  'Google',
  'Página web',
  'Presencial',
  'Otro',
];

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
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadForm, setLeadForm] = useState(initialLeadForm);

  // Dropdown de acciones
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Modal de eliminación
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<CrmLead | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cursos para selección
  const [cursos, setCursos] = useState<Curso[]>([]);

  const fetchTablero = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerTableroApi();
      if (response.success) {
        // Ordenar columnas por el campo orden de la etapa
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

  const fetchCursos = useCallback(async () => {
    try {
      const response = await listarCursosApi({ estado: 'activo' });
      if (response.success && response.data?.cursos) {
        setCursos(response.data.cursos);
      }
    } catch (err) {
      console.error('Error loading cursos:', err);
    }
  }, []);

  useEffect(() => {
    fetchTablero();
    fetchCursos();
  }, [fetchTablero, fetchCursos]);

  // Cerrar dropdowns al hacer clic fuera
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

    // Actualizar UI optimistamente
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
      // Revertir si falla
      fetchTablero();
    }

    setDraggedLead(null);
  };

  // Lead CRUD
  const openCreateLeadModal = (etapa: CrmEtapa) => {
    setSelectedEtapa(etapa);
    setSelectedLead(null);
    setLeadModalMode('create');
    setLeadForm({ ...initialLeadForm });
    setLeadModalOpen(true);
  };

  const openEditLeadModal = (lead: CrmLead, etapa: CrmEtapa) => {
    setSelectedEtapa(etapa);
    setSelectedLead(lead);
    setLeadModalMode('edit');
    setLeadForm({
      contactoNombre: lead.contacto.nombre || '',
      contactoApellido: lead.contacto.apellido || '',
      contactoTelefono: lead.contacto.telefono || '',
      contactoEmail: lead.contacto.email || '',
      contactoRelacion: lead.contacto.relacion || RelacionContacto.PROPIO,
      medioContactoPreferido: lead.contacto.medioPreferido || '',
      alumnoNombre: lead.alumno.nombre || '',
      alumnoApellido: lead.alumno.apellido || '',
      alumnoFechaNacimiento: lead.alumno.fechaNacimiento?.split('T')[0] || '',
      cursoId: lead.negociacion.cursoId || '',
      origen: lead.negociacion.origen || '',
      montoEstimado: lead.negociacion.montoEstimado?.toString() || '',
    });
    setLeadModalOpen(true);
    setActiveDropdown(null);
  };

  const handleSaveLead = async () => {
    // Siempre requerimos datos del contacto
    if (!leadForm.contactoNombre.trim() || !leadForm.contactoApellido.trim()) {
      return;
    }

    try {
      setLeadSaving(true);

      const esPropio = leadForm.contactoRelacion === RelacionContacto.PROPIO;

      // Si es PROPIO (estudiante contacta directamente), los datos del alumno = datos del contacto
      // Si NO es PROPIO (padre/madre/otro), los datos del alumno pueden estar vacíos o ser diferentes
      const alumnoNombre = esPropio
        ? leadForm.contactoNombre.trim()
        : (leadForm.alumnoNombre.trim() || 'Por definir');
      const alumnoApellido = esPropio
        ? leadForm.contactoApellido.trim()
        : (leadForm.alumnoApellido.trim() || 'Por definir');

      // Construir payload según estructura del API
      const payload = {
        contacto: {
          nombre: leadForm.contactoNombre.trim(),
          apellido: leadForm.contactoApellido.trim(),
          telefono: leadForm.contactoTelefono.trim() || undefined,
          email: leadForm.contactoEmail.trim() || undefined,
          relacion: leadForm.contactoRelacion as any,
          medioPreferido: leadForm.medioContactoPreferido || undefined,
        },
        alumno: {
          nombre: alumnoNombre,
          apellido: alumnoApellido,
          fechaNacimiento: leadForm.alumnoFechaNacimiento || undefined,
        },
        negociacion: {
          cursoId: leadForm.cursoId || undefined,
          origen: leadForm.origen || undefined,
          etapaId: selectedEtapa?.id || '',
          montoEstimado: leadForm.montoEstimado ? parseFloat(leadForm.montoEstimado) : undefined,
        },
      };

      if (leadModalMode === 'create' && selectedEtapa) {
        const response = await crearLeadApi(payload);
        if (response.success) {
          setLeadModalOpen(false);
          fetchTablero();
        }
      } else if (leadModalMode === 'edit' && selectedLead) {
        // Para actualizar, omitimos etapaId de negociacion
        const updatePayload = {
          contacto: payload.contacto,
          alumno: payload.alumno,
          negociacion: {
            cursoId: payload.negociacion.cursoId,
            origen: payload.negociacion.origen,
            montoEstimado: payload.negociacion.montoEstimado,
          },
        };
        const response = await actualizarLeadApi(selectedLead.id, updatePayload);
        if (response.success) {
          setLeadModalOpen(false);
          fetchTablero();
        }
      }
    } catch (err: any) {
      console.error('Error al guardar lead:', err);
    } finally {
      setLeadSaving(false);
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      setDeleting(true);
      const response = await eliminarLeadApi(leadToDelete.id);
      if (response.success) {
        setDeleteModalOpen(false);
        setLeadToDelete(null);
        fetchTablero();
      }
    } catch (err: any) {
      console.error('Error al eliminar lead:', err);
    } finally {
      setDeleting(false);
    }
  };

  const getColumnBgClass = (tipoSistema: TipoSistema) => {
    switch (tipoSistema) {
      case TipoSistema.GANADO:
        return 'bg-green-50/50 dark:bg-green-900/10';
      case TipoSistema.PERDIDO:
        return 'bg-red-50/50 dark:bg-red-900/10';
      default:
        return 'bg-neutral-50/50 dark:bg-neutral-900/20';
    }
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return `$${value.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const getLeadDisplayName = (lead: CrmLead) => {
    return `${lead.alumno.nombre} ${lead.alumno.apellido}`;
  };

  const getContactDisplayName = (lead: CrmLead) => {
    return `${lead.contacto.nombre} ${lead.contacto.apellido}`;
  };

  // Calcular valor total de una columna
  const getColumnTotal = (leads: CrmLead[]) => {
    return leads.reduce((sum, lead) => sum + (lead.negociacion.montoEstimado || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CgSpinner className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header en el body */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Etapas de Venta
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 hidden sm:block">
            Arrastra los prospectos entre las etapas para actualizar su estado
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {hasPermission('crm.crear') && (
            <button
              onClick={() => navigate('/crm/etapas')}
              className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-neutral-700 dark:text-neutral-300 bg-white dark:bg-dark-card hover:bg-neutral-50 dark:hover:bg-dark-hover border border-neutral-200 dark:border-dark-border rounded-lg transition-colors shadow-sm flex-1 sm:flex-none"
            >
              <FaCog className="w-4 h-4" />
              <span className="text-sm">Configurar Etapas</span>
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-2 sm:p-4">
        <div className="flex gap-2 sm:gap-4 h-full min-w-max pb-2">
          {columnas.map((columna) => {
            const valorTotal = getColumnTotal(columna.leads);
            return (
              <div
                key={columna.etapa.id}
                onDragOver={(e) => handleDragOver(e, columna.etapa.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, columna.etapa)}
                className={`
                  w-64 sm:w-72 md:w-80 flex-shrink-0 flex flex-col rounded-xl border-2 transition-colors
                  ${dragOverColumn === columna.etapa.id
                    ? 'border-primary border-dashed bg-primary/5'
                    : 'border-transparent'
                  }
                  ${getColumnBgClass(columna.etapa.tipoSistema)}
                `}
              >
                {/* Column Header */}
                <div className="p-2 sm:p-3 flex items-center gap-2 sm:gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: columna.etapa.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base text-neutral-900 dark:text-neutral-100 truncate">
                      {columna.etapa.nombre}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-white dark:bg-dark-card rounded-full text-neutral-600 dark:text-neutral-400 shadow-sm">
                    {columna.total}
                  </span>
                  {hasPermission('crm.crear') && (
                    <button
                      onClick={() => openCreateLeadModal(columna.etapa)}
                      className="p-1.5 text-neutral-500 hover:text-primary hover:bg-white dark:hover:bg-dark-card rounded-lg transition-colors"
                      title="Agregar prospecto"
                    >
                      <FaPlus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-2 sm:pb-3 space-y-2">
                  {columna.leads.map((lead) => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, lead)}
                      className={`
                        bg-white dark:bg-dark-card rounded-lg border border-neutral-200 dark:border-dark-border
                        p-2.5 sm:p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all
                        ${draggedLead?.id === lead.id ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 text-sm line-clamp-1">
                            {getLeadDisplayName(lead)}
                          </h4>
                          {lead.contacto.relacion !== RelacionContacto.PROPIO && (
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                              {getContactDisplayName(lead)} ({lead.contacto.relacion})
                            </p>
                          )}
                        </div>
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === lead.id ? null : lead.id);
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded"
                          >
                            <FaEllipsisV className="w-3.5 h-3.5" />
                          </button>
                          {activeDropdown === lead.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border py-1 z-10">
                              {hasPermission('crm.editar') && (
                                <button
                                  onClick={() => openEditLeadModal(lead, columna.etapa)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover"
                                >
                                  <FaEdit className="w-3.5 h-3.5" />
                                  Editar
                                </button>
                              )}
                              {hasPermission('crm.eliminar') && (
                                <button
                                  onClick={() => {
                                    setLeadToDelete(lead);
                                    setDeleteModalOpen(true);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                  <FaTrash className="w-3.5 h-3.5" />
                                  Eliminar
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {lead.contacto.email && (
                          <div className="flex items-center gap-1.5">
                            <FaEnvelope className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{lead.contacto.email}</span>
                          </div>
                        )}
                        {lead.contacto.telefono && (
                          <div className="flex items-center gap-1.5">
                            <FaPhone className="w-3 h-3 flex-shrink-0" />
                            <span>{lead.contacto.telefono}</span>
                          </div>
                        )}
                        {lead.negociacion.etapa && lead.negociacion.cursoId && (
                          <div className="flex items-center gap-1.5">
                            <FaGraduationCap className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">Curso interesado</span>
                          </div>
                        )}
                      </div>

                      {/* Value */}
                      {lead.negociacion.montoEstimado && (
                        <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-dark-border">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                            <FaDollarSign className="w-3 h-3" />
                            {formatCurrency(lead.negociacion.montoEstimado)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}

                  {columna.leads.length === 0 && (
                    <div className="text-center py-6 sm:py-8 text-neutral-400 dark:text-neutral-500">
                      <p className="text-xs sm:text-sm">Sin prospectos</p>
                    </div>
                  )}
                </div>

                {/* Column Footer - Total Value */}
                {valorTotal > 0 && (
                  <div className="p-2 sm:p-3 border-t border-neutral-200/50 dark:border-dark-border/50">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">Total</span>
                      <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                        ${valorTotal.toLocaleString('es-MX')}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {columnas.length === 0 && (
            <div className="flex-1 flex items-center justify-center min-w-[280px]">
              <div className="text-center px-4">
                <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-sm">
                  No hay etapas configuradas
                </p>
                {hasPermission('crm.crear') && (
                  <button
                    onClick={() => navigate('/crm/etapas')}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
                  >
                    <FaPlus className="w-4 h-4" />
                    Crear etapas
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lead Modal */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {leadModalMode === 'create' ? 'Nuevo Prospecto' : 'Editar Prospecto'}
              </h3>
              <button
                onClick={() => setLeadModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
              {/* Sección: Contacto (PRIMERO) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <FaUser className="w-4 h-4" />
                  <h4 className="text-sm font-semibold">Datos del Contacto</h4>
                </div>

                {/* Tipo de relación */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    ¿Quién realiza el contacto? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: RelacionContacto.PROPIO, label: 'Estudiante' },
                      { value: RelacionContacto.PADRE, label: 'Padre' },
                      { value: RelacionContacto.MADRE, label: 'Madre' },
                      { value: RelacionContacto.OTRO, label: 'Otro' },
                    ].map((opcion) => (
                      <button
                        key={opcion.value}
                        type="button"
                        onClick={() => setLeadForm(prev => ({ ...prev, contactoRelacion: opcion.value }))}
                        className={`
                          px-2 py-2 rounded-lg text-xs font-medium transition-all border
                          ${leadForm.contactoRelacion === opcion.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-dark-border hover:border-primary/50'
                          }
                        `}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre y Apellido del contacto */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leadForm.contactoNombre}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoNombre: e.target.value }))}
                      placeholder="Nombre"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leadForm.contactoApellido}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoApellido: e.target.value }))}
                      placeholder="Apellido"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Teléfono y email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={leadForm.contactoTelefono}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoTelefono: e.target.value }))}
                      placeholder="+506 8888-8888"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={leadForm.contactoEmail}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoEmail: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Medio de contacto preferido */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Medio de contacto preferido
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: MedioContactoPreferido.TELEFONO, label: 'Teléfono' },
                      { value: MedioContactoPreferido.WHATSAPP, label: 'WhatsApp' },
                      { value: MedioContactoPreferido.CORREO, label: 'Correo' },
                      { value: MedioContactoPreferido.PRESENCIAL, label: 'Presencial' },
                    ].map((opcion) => (
                      <button
                        key={opcion.value}
                        type="button"
                        onClick={() => setLeadForm(prev => ({
                          ...prev,
                          medioContactoPreferido: prev.medioContactoPreferido === opcion.value ? '' : opcion.value
                        }))}
                        className={`
                          px-2 py-2 rounded-lg text-xs font-medium transition-all border
                          ${leadForm.medioContactoPreferido === opcion.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-dark-border hover:border-primary/50'
                          }
                        `}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sección: Estudiante (solo si NO es el propio estudiante quien contacta) */}
              {leadForm.contactoRelacion !== RelacionContacto.PROPIO && (
                <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-dark-border">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <FaChild className="w-4 h-4" />
                    <h4 className="text-sm font-semibold">Datos del Estudiante</h4>
                    <span className="text-xs text-neutral-400">(opcional)</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Si aún no tienes los datos del estudiante, puedes dejarlos vacíos y completarlos después.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={leadForm.alumnoNombre}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, alumnoNombre: e.target.value }))}
                        placeholder="Nombre del estudiante"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={leadForm.alumnoApellido}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, alumnoApellido: e.target.value }))}
                        placeholder="Apellido del estudiante"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      value={leadForm.alumnoFechaNacimiento}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, alumnoFechaNacimiento: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Sección: Negociación */}
              <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-dark-border">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <FaHandshake className="w-4 h-4" />
                  <h4 className="text-sm font-semibold">Negociación</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Curso de interés
                    </label>
                    <select
                      value={leadForm.cursoId}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, cursoId: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Seleccionar...</option>
                      {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Origen
                    </label>
                    <select
                      value={leadForm.origen}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, origen: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Seleccionar...</option>
                      {ORIGENES.map((origen) => (
                        <option key={origen} value={origen}>
                          {origen}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Monto estimado
                  </label>
                  <input
                    type="number"
                    value={leadForm.montoEstimado}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, montoEstimado: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-200 dark:border-dark-border flex-shrink-0">
              <button
                onClick={() => setLeadModalOpen(false)}
                disabled={leadSaving}
                className="flex-1 px-3 sm:px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLead}
                disabled={
                  leadSaving ||
                  !leadForm.contactoNombre.trim() ||
                  !leadForm.contactoApellido.trim()
                }
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {leadSaving && <CgSpinner className="w-4 h-4 animate-spin" />}
                {leadModalMode === 'create' ? 'Crear' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
            <div className="p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Eliminar prospecto
              </h3>
              <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
                ¿Estás seguro de que deseas eliminar a{' '}
                <span className="font-medium">
                  "{leadToDelete ? getLeadDisplayName(leadToDelete) : ''}"
                </span>?
                Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="flex gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setLeadToDelete(null);
                }}
                disabled={deleting}
                className="flex-1 px-3 sm:px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteLead}
                disabled={deleting}
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
