import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPhone, FaEnvelope, FaWhatsapp, FaCalendarAlt, FaClipboard, FaStickyNote, FaEdit, FaTrash, FaUserPlus, FaUsers } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  obtenerLeadPorIdApi,
  obtenerTimelineApi,
  listarEtapasApi,
  moverLeadApi,
} from '../api/crmApi';
import { listarUsuariosApi } from '../../users/api/UsersApi';
import type { CrmLead, CrmActividad, CrmEtapa, TipoActividad, CrmLeadAsignacion } from '../types/crm.types';
import { ActividadFormModal } from '../components/ActividadFormModal';
import { ActividadDetallesModal } from '../components/ActividadDetallesModal';
import { AsignarLeadModal } from '../components/AsignarLeadModal';
import { DeleteLeadModal } from '../components/DeleteLeadModal';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

// Configuración de tipos de actividad
const TIPOS_ACTIVIDAD: { tipo: TipoActividad; label: string; icon: React.ReactNode; color: string }[] = [
  { tipo: 'NOTA', label: 'Nota', icon: <FaStickyNote />, color: 'amber' },
  { tipo: 'LLAMADA', label: 'Llamada', icon: <FaPhone />, color: 'green' },
  { tipo: 'CORREO', label: 'Correo', icon: <FaEnvelope />, color: 'blue' },
  { tipo: 'WHATSAPP', label: 'WhatsApp', icon: <FaWhatsapp />, color: 'emerald' },
  { tipo: 'REUNION', label: 'Reunión', icon: <FaCalendarAlt />, color: 'purple' },
  { tipo: 'TAREA', label: 'Tarea', icon: <FaClipboard />, color: 'orange' },
];

// Tabs de filtro de actividades
const TABS_ACTIVIDAD = [
  { key: 'todos', label: 'Actividad' },
  { key: 'NOTA', label: 'Notas' },
  { key: 'CORREO', label: 'Correos' },
  { key: 'LLAMADA', label: 'Llamadas' },
  { key: 'TAREA', label: 'Tareas' },
  { key: 'REUNION', label: 'Reuniones' },
];

export const LeadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados
  const [lead, setLead] = useState<CrmLead | null>(null);
  const [actividades, setActividades] = useState<CrmActividad[]>([]);
  const [etapas, setEtapas] = useState<CrmEtapa[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de UI
  const [activeTab, setActiveTab] = useState<string>('todos');

  // Estados de modales
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [showActividadDetalles, setShowActividadDetalles] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actividadTipo, setActividadTipo] = useState<TipoActividad>('NOTA');
  const [actividadEditar, setActividadEditar] = useState<CrmActividad | null>(null);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<CrmActividad | null>(null);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      try {
        const [leadRes, timelineRes, etapasRes, usuariosRes] = await Promise.all([
          obtenerLeadPorIdApi(id),
          obtenerTimelineApi(id),
          listarEtapasApi(),
          listarUsuariosApi({ estado: 'activo', pageSize: 100 })
        ]);

        if (leadRes.success) {
          setLead(leadRes.data);
        } else {
          setError('No se pudo cargar el lead');
        }

        if (timelineRes.success) {
          setActividades(timelineRes.data);
        }

        if (etapasRes.success) {
          setEtapas(etapasRes.data);
        }

        if (usuariosRes.success) {
          setUsuarios(usuariosRes.data.map((u: any) => ({
            id: u.id,
            nombre: u.nombre,
            correo: u.correo
          })));
        }
      } catch (err: any) {
        console.error('Error cargando lead:', err);
        setError(err.message || 'Error al cargar el lead');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Filtrar actividades por tab
  const actividadesFiltradas = activeTab === 'todos'
    ? actividades
    : actividades.filter(a => a.tipo === activeTab);

  // Obtener config de tipo de actividad
  const getTipoConfig = (tipo: TipoActividad) => {
    return TIPOS_ACTIVIDAD.find(t => t.tipo === tipo) || TIPOS_ACTIVIDAD[0];
  };

  // Abrir modal para nueva actividad
  const handleNuevaActividad = (tipo: TipoActividad) => {
    setActividadTipo(tipo);
    setActividadEditar(null);
    setShowActividadModal(true);
  };

  // Ver detalles de actividad
  const handleVerActividad = (actividad: CrmActividad) => {
    setActividadSeleccionada(actividad);
    setShowActividadDetalles(true);
  };

  // Abrir modal para editar actividad (desde detalles o directamente)
  const handleEditarActividad = (actividad: CrmActividad) => {
    setActividadSeleccionada(null);
    setShowActividadDetalles(false);
    setActividadEditar(actividad);
    setActividadTipo(actividad.tipo);
    setShowActividadModal(true);
  };

  // Callback cuando se guarda actividad
  const handleActividadSuccess = (actividad: CrmActividad, isEdit: boolean) => {
    if (isEdit) {
      setActividades(prev => prev.map(a => a.id === actividad.id ? actividad : a));
    } else {
      setActividades(prev => [actividad, ...prev]);
    }
  };

  // Callback cuando se asigna el lead
  const handleAsignarSuccess = async () => {
    if (!id) return;
    const leadRes = await obtenerLeadPorIdApi(id);
    if (leadRes.success) {
      setLead(leadRes.data);
    }
  };

  // Callback cuando se elimina el lead
  const handleDeleteSuccess = () => {
    navigate('/crm/leads');
  };

  // Cambiar etapa
  const handleCambiarEtapa = async (nuevaEtapaId: string) => {
    if (!id || !lead) return;

    try {
      const response = await moverLeadApi(id, { etapaId: nuevaEtapaId });
      if (response.success) {
        const [leadRes, timelineRes] = await Promise.all([
          obtenerLeadPorIdApi(id),
          obtenerTimelineApi(id)
        ]);
        if (leadRes.success) setLead(leadRes.data);
        if (timelineRes.success) setActividades(timelineRes.data);
      }
    } catch (err) {
      console.error('Error cambiando etapa:', err);
    }
  };

  // Formatear fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3">
        <CgSpinner className="animate-spin text-5xl text-primary" />
        <p className="text-lg text-neutral-700 dark:text-neutral-300 font-semibold">Cargando lead...</p>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400 font-medium">{error || 'Lead no encontrado'}</p>
          <button
            onClick={() => navigate('/crm/leads')}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver a Leads
          </button>
        </div>
      </div>
    );
  }

  const etapaActual = lead.negociacion.etapa;
  const etapaColor = etapaActual?.color || '#6366F1';
  const usuariosAsignados = lead.asignaciones?.map((a: CrmLeadAsignacion) => a.usuarioId) || [];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/crm/leads')}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors mb-4"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="font-medium">Volver a Leads</span>
        </button>
      </div>

      {/* Layout Principal - 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo - Información del Lead */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de Contacto */}
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border overflow-hidden">
            {/* Header con color de etapa */}
            <div className="h-2" style={{ backgroundColor: etapaColor }} />

            <div className="p-6">
              {/* Avatar y nombre */}
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                  style={{ backgroundColor: etapaColor }}
                >
                  {lead.contacto.nombre.charAt(0).toUpperCase()}
                  {lead.contacto.apellido.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                    {lead.contacto.nombre} {lead.contacto.apellido}
                  </h1>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {lead.contacto.email || 'Sin correo'}
                  </p>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex flex-wrap gap-2 mb-6">
                {TIPOS_ACTIVIDAD.map(({ tipo, label, icon }) => (
                  <button
                    key={tipo}
                    onClick={() => handleNuevaActividad(tipo)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-primary hover:text-primary transition-all text-sm font-medium"
                    title={`Agregar ${label}`}
                  >
                    {icon}
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              {/* Información clave */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Información clave</span>
                  <button
                    onClick={() => navigate(`/crm/leads/edit/${id}`)}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded transition-colors"
                  >
                    <FaEdit className="w-3.5 h-3.5" />
                  </button>
                </h3>

                <div className="space-y-3">
                  {/* Correo */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Correo</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {lead.contacto.email || '--'}
                    </p>
                  </div>

                  {/* Teléfono */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Teléfono</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {lead.contacto.telefono || '--'}
                    </p>
                  </div>

                  {/* Etapa */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Etapa del lead</p>
                    <select
                      value={lead.negociacion.etapaId}
                      onChange={(e) => handleCambiarEtapa(e.target.value)}
                      className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                      style={{ borderColor: etapaColor }}
                    >
                      {etapas.map(etapa => (
                        <option key={etapa.id} value={etapa.id}>
                          {etapa.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Propietario / Asignados */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">Asignado a</p>
                      <button
                        onClick={() => setShowAsignarModal(true)}
                        className="p-1 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded transition-colors text-primary"
                        title="Asignar lead"
                      >
                        <FaUserPlus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {lead.asignaciones && lead.asignaciones.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.asignaciones.map((asignacion: CrmLeadAsignacion) => (
                          <span
                            key={asignacion.usuarioId}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                          >
                            {asignacion.usuarioNombre || `Usuario ${asignacion.usuarioId}`}
                            {asignacion.rol === 'PRINCIPAL' && (
                              <span className="ml-1 text-[10px] opacity-70">(Principal)</span>
                            )}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-medium text-neutral-500">Sin asignar</p>
                    )}
                  </div>

                  {/* Relación */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Relación con alumno</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {lead.contacto.relacion === 'PROPIO' ? 'Es el propio alumno' : lead.contacto.relacion}
                    </p>
                  </div>

                  {/* Medio de contacto preferido */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Medio de contacto preferido</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {lead.contacto.medioPreferido
                        ? {
                            TELEFONO: 'Teléfono',
                            LLAMADA: 'Llamada',
                            WHATSAPP: 'WhatsApp',
                            SMS: 'SMS',
                            CORREO: 'Correo',
                            PRESENCIAL: 'Presencial'
                          }[lead.contacto.medioPreferido] || lead.contacto.medioPreferido
                        : 'No especificado'}
                    </p>
                  </div>

                  {/* Alumno */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Alumno</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {lead.alumno.nombre} {lead.alumno.apellido}
                    </p>
                  </div>

                  {/* Origen */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Origen</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {lead.negociacion.origen || 'Manual'}
                    </p>
                  </div>

                  {/* Monto estimado */}
                  {lead.negociacion.montoEstimado && (
                    <div>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Monto estimado</p>
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                        ${Number(lead.negociacion.montoEstimado).toLocaleString('es-ES')}
                      </p>
                    </div>
                  )}

                  {/* Fecha de creación */}
                  <div>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mb-1">Fecha de creación</p>
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {formatDate(lead.fechaCreacion)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Botón eliminar */}
              <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-dark-border">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center gap-2 text-red-600 dark:text-red-400 hover:text-red-700 text-sm font-medium"
                >
                  <FaTrash className="w-3.5 h-3.5" />
                  Eliminar lead
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho - Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
            {/* Tabs de actividades */}
            <div className="border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
              <div className="flex overflow-x-auto">
                {TABS_ACTIVIDAD.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                      ${activeTab === tab.key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de actividades - con scroll interno */}
            <div className="p-6 overflow-y-auto flex-1">
              {actividadesFiltradas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-dark-hover rounded-full flex items-center justify-center">
                    <FaClipboard className="w-8 h-8 text-neutral-400" />
                  </div>
                  <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                    No hay actividades registradas
                  </p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                    Usa los botones de acciones para agregar una
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {actividadesFiltradas.map(actividad => {
                    const tipoConfig = getTipoConfig(actividad.tipo);
                    const esTareaPendiente = (actividad.tipo === 'TAREA' || actividad.tipo === 'REUNION') &&
                      new Date(actividad.fechaFin) > new Date();

                    return (
                      <div
                        key={actividad.id}
                        onClick={() => handleVerActividad(actividad)}
                        className="flex gap-4 p-4 bg-neutral-50 dark:bg-dark-bg rounded-xl border border-neutral-100 dark:border-dark-border hover:shadow-md transition-shadow group cursor-pointer"
                      >
                        {/* Icono */}
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-neutral-200 dark:bg-dark-border text-neutral-600 dark:text-neutral-400">
                          {tipoConfig.icon}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                              {tipoConfig.label}
                            </span>
                            {actividad.tipo === 'CAMBIO_ETAPA' && (
                              <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                                Automático
                              </span>
                            )}
                            {esTareaPendiente && (
                              <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-full">
                                Pendiente: {formatDate(actividad.fechaFin)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                            {actividad.contenido}
                          </p>
                          {/* Participantes */}
                          {actividad.participantes && actividad.participantes.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              <FaUsers className="w-3 h-3 text-neutral-400" />
                              <span className="text-xs text-neutral-500">
                                {actividad.participantes.map(p => p.usuarioNombre || `Usuario ${p.usuarioId}`).join(', ')}
                              </span>
                            </div>
                          )}
                          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
                            {formatDate(actividad.fechaCreacion)}
                          </p>
                        </div>

                        {/* Botón editar (visible on hover, oculto para CAMBIO_ETAPA) */}
                        {actividad.tipo !== 'CAMBIO_ETAPA' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditarActividad(actividad);
                            }}
                            className="self-start p-2 text-neutral-400 hover:text-primary hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Editar actividad"
                          >
                            <FaEdit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modales */}
      <ActividadFormModal
        isOpen={showActividadModal}
        onClose={() => {
          setShowActividadModal(false);
          setActividadEditar(null);
        }}
        onSuccess={handleActividadSuccess}
        leadId={id || ''}
        usuarios={usuarios}
        actividad={actividadEditar}
        tipoInicial={actividadTipo}
      />

      <AsignarLeadModal
        isOpen={showAsignarModal}
        onClose={() => setShowAsignarModal(false)}
        onSuccess={handleAsignarSuccess}
        leadId={id || ''}
        usuarios={usuarios}
        usuariosAsignados={usuariosAsignados}
      />

      <DeleteLeadModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
        lead={lead}
      />

      <ActividadDetallesModal
        isOpen={showActividadDetalles}
        onClose={() => {
          setShowActividadDetalles(false);
          setActividadSeleccionada(null);
        }}
        actividad={actividadSeleccionada}
        onEdit={handleEditarActividad}
      />
    </div>
  );
};
