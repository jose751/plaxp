import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPhone, FaEnvelope, FaWhatsapp, FaCalendarAlt, FaClipboard, FaStickyNote, FaEdit, FaTrash, FaUserPlus, FaUsers } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  obtenerLeadPorIdApi,
  obtenerTimelineApi,
  crearActividadApi,
  actualizarActividadApi,
  eliminarLeadApi,
  listarEtapasApi,
  moverLeadApi,
  asignarLeadApi
} from '../api/crmApi';
import { listarUsuariosApi } from '../../users/api/UsersApi';
import type { CrmLead, CrmActividad, CrmEtapa, TipoActividad, CrmLeadAsignacion } from '../types/crm.types';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

// Configuración de tipos de actividad
const TIPOS_ACTIVIDAD: { tipo: TipoActividad; label: string; icon: React.ReactNode; color: string; requiereFecha: boolean }[] = [
  { tipo: 'NOTA', label: 'Nota', icon: <FaStickyNote />, color: 'amber', requiereFecha: false },
  { tipo: 'LLAMADA', label: 'Llamada', icon: <FaPhone />, color: 'green', requiereFecha: false },
  { tipo: 'CORREO', label: 'Correo', icon: <FaEnvelope />, color: 'blue', requiereFecha: false },
  { tipo: 'WHATSAPP', label: 'WhatsApp', icon: <FaWhatsapp />, color: 'emerald', requiereFecha: false },
  { tipo: 'REUNION', label: 'Reunión', icon: <FaCalendarAlt />, color: 'purple', requiereFecha: true },
  { tipo: 'TAREA', label: 'Tarea', icon: <FaClipboard />, color: 'orange', requiereFecha: true },
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
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [showAsignarLeadModal, setShowAsignarLeadModal] = useState(false);
  const [actividadTipo, setActividadTipo] = useState<TipoActividad>('NOTA');
  const [actividadContenido, setActividadContenido] = useState('');
  const [actividadFechaInicio, setActividadFechaInicio] = useState('');
  const [actividadFechaFin, setActividadFechaFin] = useState('');
  const [actividadParticipantes, setActividadParticipantes] = useState<string[]>([]);
  const [creandoActividad, setCreandoActividad] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [asignandoLead, setAsignandoLead] = useState(false);
  const [selectedUsuariosLead, setSelectedUsuariosLead] = useState<string[]>([]);
  const [editandoActividadId, setEditandoActividadId] = useState<string | null>(null);

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
          // Inicializar usuarios asignados
          if (leadRes.data.asignaciones) {
            setSelectedUsuariosLead(leadRes.data.asignaciones.map((a: CrmLeadAsignacion) => a.usuarioId));
          }
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

  // Resetear formulario de actividad
  const resetActividadForm = () => {
    setActividadContenido('');
    setActividadFechaInicio('');
    setActividadFechaFin('');
    setActividadParticipantes([]);
    setEditandoActividadId(null);
  };

  // Convertir fecha ISO a formato datetime-local
  const toDatetimeLocal = (isoDate: string): string => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  // Abrir modal para editar actividad
  const handleEditarActividad = (actividad: CrmActividad) => {
    setEditandoActividadId(actividad.id);
    setActividadTipo(actividad.tipo);
    setActividadContenido(actividad.contenido);
    setActividadFechaInicio(actividad.fechaInicio ? toDatetimeLocal(actividad.fechaInicio) : '');
    setActividadFechaFin(actividad.fechaFin ? toDatetimeLocal(actividad.fechaFin) : '');
    setActividadParticipantes(actividad.participantes?.map(p => p.usuarioId) || []);
    setShowActividadModal(true);
  };

  // Convertir fecha local a ISO 8601 con Z (UTC)
  const toISOString = (localDateTime: string): string => {
    if (!localDateTime) return '';
    const date = new Date(localDateTime);
    return date.toISOString();
  };

  // Crear o actualizar actividad
  const handleGuardarActividad = async () => {
    if (!id || !actividadContenido.trim()) return;

    const tipoConfig = getTipoConfig(actividadTipo);

    // Validar fechas para tareas y reuniones
    if (tipoConfig.requiereFecha && (!actividadFechaInicio || !actividadFechaFin)) {
      alert('Las tareas y reuniones requieren fecha de inicio y fin');
      return;
    }

    // Validar que fecha fin sea posterior a fecha inicio
    if (tipoConfig.requiereFecha && actividadFechaInicio && actividadFechaFin) {
      if (new Date(actividadFechaFin) <= new Date(actividadFechaInicio)) {
        alert('La fecha de fin debe ser posterior a la fecha de inicio');
        return;
      }
    }

    setCreandoActividad(true);
    try {
      if (editandoActividadId) {
        // Actualizar actividad existente
        // Siempre enviar la lista de participantes para permitir agregar/quitar
        const response = await actualizarActividadApi(editandoActividadId, {
          tipo: actividadTipo,
          contenido: actividadContenido.trim(),
          fechaInicio: actividadFechaInicio ? toISOString(actividadFechaInicio) : undefined,
          fechaFin: actividadFechaFin ? toISOString(actividadFechaFin) : undefined,
          participantesUsuarioIds: actividadParticipantes, // Siempre enviar, incluso si está vacío
        });

        if (response.success) {
          // Actualizar la actividad en la lista
          setActividades(prev => prev.map(a => a.id === editandoActividadId ? response.data : a));
          resetActividadForm();
          setShowActividadModal(false);
        }
      } else {
        // Crear nueva actividad
        const response = await crearActividadApi(id, {
          tipo: actividadTipo,
          contenido: actividadContenido.trim(),
          fechaInicio: actividadFechaInicio ? toISOString(actividadFechaInicio) : undefined,
          fechaFin: actividadFechaFin ? toISOString(actividadFechaFin) : undefined,
          participantesUsuarioIds: actividadParticipantes.length > 0 ? actividadParticipantes : undefined,
        });

        if (response.success) {
          setActividades(prev => [response.data, ...prev]);
          resetActividadForm();
          setShowActividadModal(false);
        }
      }
    } catch (err) {
      console.error('Error guardando actividad:', err);
    } finally {
      setCreandoActividad(false);
    }
  };

  // Asignar lead a usuarios
  const handleAsignarLead = async () => {
    if (!id || selectedUsuariosLead.length === 0) return;

    setAsignandoLead(true);
    try {
      const response = await asignarLeadApi(id, {
        usuarioIds: selectedUsuariosLead,
        sobrescribir: true
      });

      if (response.success) {
        // Recargar lead para actualizar asignaciones
        const leadRes = await obtenerLeadPorIdApi(id);
        if (leadRes.success) {
          setLead(leadRes.data);
        }
        setShowAsignarLeadModal(false);
      }
    } catch (err) {
      console.error('Error asignando lead:', err);
    } finally {
      setAsignandoLead(false);
    }
  };

  // Eliminar lead
  const handleEliminarLead = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      const response = await eliminarLeadApi(id);
      if (response.success) {
        navigate('/crm/leads');
      }
    } catch (err) {
      console.error('Error eliminando lead:', err);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
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

  // Toggle participante en actividad
  const toggleParticipante = (usuarioId: string) => {
    setActividadParticipantes(prev =>
      prev.includes(usuarioId)
        ? prev.filter(id => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  // Toggle usuario asignado al lead
  const toggleUsuarioLead = (usuarioId: string) => {
    setSelectedUsuariosLead(prev =>
      prev.includes(usuarioId)
        ? prev.filter(id => id !== usuarioId)
        : [...prev, usuarioId]
    );
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
  const tipoActividadConfig = getTipoConfig(actividadTipo);

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
                    onClick={() => {
                      setActividadTipo(tipo);
                      resetActividadForm();
                      setShowActividadModal(true);
                    }}
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
                        onClick={() => setShowAsignarLeadModal(true)}
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
                            WHATSAPP: 'WhatsApp',
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
                  onClick={() => setShowDeleteConfirm(true)}
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
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border overflow-hidden">
            {/* Tabs de actividades */}
            <div className="border-b border-neutral-200 dark:border-dark-border">
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

            {/* Lista de actividades */}
            <div className="p-6">
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
                        className="flex gap-4 p-4 bg-neutral-50 dark:bg-dark-bg rounded-xl border border-neutral-100 dark:border-dark-border hover:shadow-md transition-shadow group"
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
                            onClick={() => handleEditarActividad(actividad)}
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

      {/* Modal de crear/editar actividad */}
      {showActividadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                {editandoActividadId ? 'Editar' : 'Agregar'} {tipoActividadConfig.label}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Selector de tipo */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Tipo de actividad
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_ACTIVIDAD.map(({ tipo, label, icon }) => (
                    <button
                      key={tipo}
                      onClick={() => setActividadTipo(tipo)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                        ${actividadTipo === tipo
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-neutral-300 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-primary/50'
                        }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Contenido
                </label>
                <textarea
                  value={actividadContenido}
                  onChange={(e) => setActividadContenido(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  placeholder="Escribe los detalles de la actividad..."
                />
              </div>

              {/* Campos de fecha para Tareas y Reuniones */}
              {tipoActividadConfig.requiereFecha && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Fecha/Hora inicio *
                    </label>
                    <input
                      type="datetime-local"
                      value={actividadFechaInicio}
                      onChange={(e) => setActividadFechaInicio(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Fecha/Hora fin *
                    </label>
                    <input
                      type="datetime-local"
                      value={actividadFechaFin}
                      onChange={(e) => setActividadFechaFin(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Asignar a usuarios */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Asignar a (opcional)
                </label>
                <div className="max-h-40 overflow-y-auto border border-neutral-300 dark:border-dark-border rounded-xl p-2 space-y-1">
                  {usuarios.map(usuario => (
                    <label
                      key={usuario.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={actividadParticipantes.includes(usuario.id)}
                        onChange={() => toggleParticipante(usuario.id)}
                        className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {usuario.nombre}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">{usuario.correo}</p>
                      </div>
                    </label>
                  ))}
                </div>
                {actividadParticipantes.length > 0 && (
                  <p className="text-xs text-neutral-500 mt-1">
                    {actividadParticipantes.length} usuario(s) seleccionado(s)
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-neutral-200 dark:border-dark-border flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowActividadModal(false);
                  resetActividadForm();
                }}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarActividad}
                disabled={!actividadContenido.trim() || creandoActividad || (tipoActividadConfig.requiereFecha && (!actividadFechaInicio || !actividadFechaFin))}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {creandoActividad && <CgSpinner className="animate-spin w-4 h-4" />}
                {editandoActividadId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de asignar lead */}
      {showAsignarLeadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <FaUserPlus className="w-5 h-5 text-primary" />
                Asignar Lead
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Selecciona los usuarios responsables de este lead
              </p>
            </div>

            <div className="p-6">
              <div className="max-h-64 overflow-y-auto border border-neutral-300 dark:border-dark-border rounded-xl p-2 space-y-1">
                {usuarios.map(usuario => (
                  <label
                    key={usuario.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsuariosLead.includes(usuario.id)}
                      onChange={() => toggleUsuarioLead(usuario.id)}
                      className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                        {usuario.nombre}
                      </p>
                      <p className="text-xs text-neutral-500 truncate">{usuario.correo}</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedUsuariosLead.length > 0 && (
                <p className="text-xs text-neutral-500 mt-2">
                  {selectedUsuariosLead.length} usuario(s) seleccionado(s)
                </p>
              )}
            </div>

            <div className="p-6 border-t border-neutral-200 dark:border-dark-border flex gap-3 justify-end">
              <button
                onClick={() => setShowAsignarLeadModal(false)}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAsignarLead}
                disabled={selectedUsuariosLead.length === 0 || asignandoLead}
                className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {asignandoLead && <CgSpinner className="animate-spin w-4 h-4" />}
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminar */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <FaTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2">
                ¿Eliminar este lead?
              </h3>
              <p className="text-sm text-center text-neutral-500 dark:text-neutral-400">
                Esta acción no se puede deshacer. El lead será marcado como inactivo.
              </p>
            </div>

            <div className="p-6 border-t border-neutral-200 dark:border-dark-border flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 font-medium hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminarLead}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {deleting && <CgSpinner className="animate-spin w-4 h-4" />}
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
