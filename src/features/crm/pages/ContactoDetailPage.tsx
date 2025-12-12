import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaStar,
  FaUser,
  FaUserTie,
  FaPlus,
  FaTimes,
} from 'react-icons/fa';
import {
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiTrendingUp,
} from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import {
  obtenerContactoPorIdApi,
  listarOportunidadesPorContactoApi,
  actualizarContactoApi,
  eliminarContactoApi,
  listarPipelinesApi,
  crearOportunidadApi,
} from '../api/crmApi';
import type {
  CrmContacto,
  CrmOportunidad,
  ActualizarContactoData,
  CrmPipeline,
  CrearOportunidadData,
} from '../types/crm.types';
import { MedioContactoPreferido, OportunidadEstado, RelacionResponsable } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

// URL del logo de WhatsApp
const WHATSAPP_LOGO = 'https://static.vecteezy.com/system/resources/previews/021/491/992/original/whatsapp-logo-tansparent-free-png.png';

const cleanPhoneForWhatsApp = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const ContactoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  // Estados principales
  const [contacto, setContacto] = useState<CrmContacto | null>(null);
  const [oportunidades, setOportunidades] = useState<CrmOportunidad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de edición
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<ActualizarContactoData>({});

  // Modal de eliminar
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Modal de nueva oportunidad
  const [oportunidadModalOpen, setOportunidadModalOpen] = useState(false);
  const [oportunidadSaving, setOportunidadSaving] = useState(false);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [oportunidadForm, setOportunidadForm] = useState({
    titulo: '',
    pipelineId: '',
    montoEstimado: '',
    probabilidad: 50,
    descripcion: '',
  });

  // Cargar datos
  const fetchContacto = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await obtenerContactoPorIdApi(id);
      if (response.success) {
        setContacto(response.data);
      } else {
        setError('No se pudo cargar el contacto');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el contacto');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchOportunidades = useCallback(async () => {
    if (!id) return;
    try {
      const response = await listarOportunidadesPorContactoApi(id);
      if (response.success) {
        setOportunidades(response.data);
      }
    } catch (err) {
      console.error('Error al cargar oportunidades:', err);
    }
  }, [id]);

  const fetchPipelines = useCallback(async () => {
    try {
      const response = await listarPipelinesApi();
      if (response.success) {
        const activos = response.data.filter(p => p.activo);
        setPipelines(activos);
        if (activos.length > 0) {
          const defaultPipeline = activos.find(p => p.esDefault) || activos[0];
          setOportunidadForm(prev => ({ ...prev, pipelineId: defaultPipeline.id }));
        }
      }
    } catch (err) {
      console.error('Error al cargar pipelines:', err);
    }
  }, []);

  useEffect(() => {
    fetchContacto();
    fetchOportunidades();
  }, [fetchContacto, fetchOportunidades]);

  useEffect(() => {
    if (oportunidadModalOpen && pipelines.length === 0) {
      fetchPipelines();
    }
  }, [oportunidadModalOpen, fetchPipelines, pipelines.length]);

  // Abrir modal de edición
  const handleOpenEdit = () => {
    if (!contacto) return;
    setEditForm({
      nombre: contacto.nombre,
      apellido: contacto.apellido,
      correo: contacto.correo || undefined,
      telefono: contacto.telefono || undefined,
      telefonoSecundario: contacto.telefonoSecundario || undefined,
      fechaNacimiento: contacto.fechaNacimiento?.split('T')[0] || undefined,
      medioContactoPreferido: contacto.medioContactoPreferido || undefined,
      fuente: contacto.fuente || undefined,
      notas: contacto.notas || undefined,
      responsable: contacto.responsable ? {
        nombre: contacto.responsable.nombre,
        apellido: contacto.responsable.apellido || undefined,
        telefono: contacto.responsable.telefono || undefined,
        correo: contacto.responsable.correo || undefined,
        relacion: contacto.responsable.relacion || undefined,
      } : undefined,
    });
    setEditModalOpen(true);
  };

  // Guardar edición
  const handleSaveEdit = async () => {
    if (!id) return;
    try {
      setEditSaving(true);
      const response = await actualizarContactoApi(id, editForm);
      if (response.success) {
        setContacto(response.data);
        setEditModalOpen(false);
      }
    } catch (err: any) {
      console.error('Error al actualizar:', err);
    } finally {
      setEditSaving(false);
    }
  };

  // Eliminar contacto
  const handleDelete = async () => {
    if (!id) return;
    try {
      setDeleting(true);
      const response = await eliminarContactoApi(id);
      if (response.success) {
        navigate('/crm/contactos');
      }
    } catch (err: any) {
      console.error('Error al eliminar:', err);
    } finally {
      setDeleting(false);
    }
  };

  // Crear oportunidad
  const handleCreateOportunidad = async () => {
    if (!id || !oportunidadForm.titulo.trim() || !oportunidadForm.pipelineId) return;
    try {
      setOportunidadSaving(true);
      const payload: CrearOportunidadData = {
        contactoId: id,
        pipelineId: oportunidadForm.pipelineId,
        titulo: oportunidadForm.titulo.trim(),
        montoEstimado: oportunidadForm.montoEstimado || undefined,
        probabilidad: oportunidadForm.probabilidad,
        descripcion: oportunidadForm.descripcion.trim() || undefined,
      };
      const response = await crearOportunidadApi(payload);
      if (response.success) {
        setOportunidadModalOpen(false);
        setOportunidadForm({
          titulo: '',
          pipelineId: pipelines[0]?.id || '',
          montoEstimado: '',
          probabilidad: 50,
          descripcion: '',
        });
        await fetchOportunidades();
      }
    } catch (err: any) {
      console.error('Error al crear oportunidad:', err);
    } finally {
      setOportunidadSaving(false);
    }
  };

  // Calcular estadísticas
  const stats = {
    total: oportunidades.length,
    abiertas: oportunidades.filter(o => o.estado === OportunidadEstado.ABIERTA).length,
    ganadas: oportunidades.filter(o => o.estado === OportunidadEstado.GANADA).length,
    perdidas: oportunidades.filter(o => o.estado === OportunidadEstado.PERDIDA).length,
    montoTotal: oportunidades.reduce((sum, o) => sum + parseFloat(o.montoEstimado || '0'), 0),
    montoGanado: oportunidades
      .filter(o => o.estado === OportunidadEstado.GANADA)
      .reduce((sum, o) => sum + parseFloat(o.montoEstimado || '0'), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <CgSpinner className="w-12 h-12 animate-spin text-primary" />
          <p className="text-neutral-500 dark:text-neutral-400">Cargando contacto...</p>
        </div>
      </div>
    );
  }

  if (error || !contacto) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Contacto no encontrado'}</p>
          <button
            onClick={() => navigate('/crm/contactos')}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Volver a Contactos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header con navegación */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/crm/contactos')}
          className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                contacto.esCliente ? 'bg-green-500' : 'bg-blue-500'
              }`}
            >
              {contacto.nombre.charAt(0)}
              {contacto.apellido.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {contacto.nombreCompleto}
              </h1>
              <div className="flex items-center gap-2">
                {contacto.esCliente ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <FaStar className="w-3 h-3" />
                    Cliente
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    <FaUser className="w-3 h-3" />
                    Prospecto
                  </span>
                )}
                {contacto.fuente && (
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Fuente: {contacto.fuente}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {hasPermission('crm.editar') && (
            <button
              onClick={handleOpenEdit}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all shadow-md"
            >
              <FaEdit className="w-4 h-4" />
              Editar
            </button>
          )}
          {hasPermission('crm.eliminar') && (
            <button
              onClick={() => setDeleteModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
            >
              <FaTrash className="w-4 h-4" />
              Eliminar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda: Info del contacto */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card de información */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-5">
            <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
              Información de Contacto
            </h3>

            <div className="space-y-3">
              {/* Teléfono */}
              {contacto.telefono && (
                <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-dark-border">
                  <div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Teléfono</p>
                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{contacto.telefono}</p>
                  </div>
                  <a
                    href={`https://wa.me/${cleanPhoneForWhatsApp(contacto.telefono)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                  >
                    <img src={WHATSAPP_LOGO} alt="WhatsApp" className="w-6 h-6" />
                  </a>
                </div>
              )}

              {/* Correo */}
              {contacto.correo && (
                <div className="py-2 border-b border-neutral-100 dark:border-dark-border">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Correo electrónico</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">{contacto.correo}</p>
                </div>
              )}

              {/* Fecha de nacimiento */}
              {contacto.fechaNacimiento && (
                <div className="py-2 border-b border-neutral-100 dark:border-dark-border">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Fecha de nacimiento</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {new Date(contacto.fechaNacimiento).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Medio preferido */}
              {contacto.medioContactoPreferido && (
                <div className="py-2">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Medio preferido</p>
                  <p className="font-medium text-neutral-900 dark:text-neutral-100">
                    {contacto.medioContactoPreferido}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card de responsable */}
          {contacto.responsable && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-5">
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
                Responsable
              </h3>
              <div className="space-y-2">
                <p className="font-medium text-neutral-900 dark:text-neutral-100">
                  {contacto.responsable.nombre} {contacto.responsable.apellido}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {contacto.responsable.relacion}
                </p>
                {contacto.responsable.telefono && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {contacto.responsable.telefono}
                  </p>
                )}
                {contacto.responsable.correo && (
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {contacto.responsable.correo}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Card de notas */}
          {contacto.notas && (
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-5">
              <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-4">
                Notas
              </h3>
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {contacto.notas}
              </p>
            </div>
          )}
        </div>

        {/* Columna derecha: Oportunidades */}
        <div className="lg:col-span-2 space-y-6">
          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Abiertas</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.abiertas}</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Ganadas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.ganadas}</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Perdidas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.perdidas}</p>
            </div>
            <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-4">
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Ganado</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${stats.montoGanado.toLocaleString()}</p>
            </div>
          </div>

          {/* Lista de oportunidades */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Oportunidades
              </h3>
              {hasPermission('crm.crear') && (
                <button
                  onClick={() => setOportunidadModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <FaPlus className="w-4 h-4" />
                  Nueva Oportunidad
                </button>
              )}
            </div>

            <div className="divide-y divide-neutral-200 dark:divide-dark-border">
              {oportunidades.length === 0 ? (
                <div className="text-center py-12">
                  <HiTrendingUp className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                  <p className="text-neutral-500 dark:text-neutral-400 mb-4">
                    No hay oportunidades para este contacto
                  </p>
                  {hasPermission('crm.crear') && (
                    <button
                      onClick={() => setOportunidadModalOpen(true)}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors text-sm"
                    >
                      Crear primera oportunidad
                    </button>
                  )}
                </div>
              ) : (
                oportunidades.map((oportunidad) => {
                  const estadoConfig = {
                    [OportunidadEstado.ABIERTA]: { color: 'blue', icon: HiClock, label: 'Abierta' },
                    [OportunidadEstado.GANADA]: { color: 'green', icon: HiCheckCircle, label: 'Ganada' },
                    [OportunidadEstado.PERDIDA]: { color: 'red', icon: HiXCircle, label: 'Perdida' },
                  }[oportunidad.estado];
                  const IconComponent = estadoConfig.icon;

                  return (
                    <div
                      key={oportunidad.id}
                      onClick={() => navigate(`/crm/oportunidades/${oportunidad.id}`)}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-50 dark:hover:bg-dark-hover cursor-pointer transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-full bg-${estadoConfig.color}-100 dark:bg-${estadoConfig.color}-900/30 flex items-center justify-center`}>
                        <IconComponent className={`w-5 h-5 text-${estadoConfig.color}-600 dark:text-${estadoConfig.color}-400`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {oportunidad.titulo}
                        </p>
                        <div className="flex items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                          {oportunidad.pipeline && (
                            <span>{oportunidad.pipeline.nombre}</span>
                          )}
                          {oportunidad.etapa && (
                            <span
                              className="px-2 py-0.5 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${oportunidad.etapa.color}15`,
                                color: oportunidad.etapa.color,
                              }}
                            >
                              {oportunidad.etapa.nombre}
                            </span>
                          )}
                        </div>
                      </div>
                      {oportunidad.montoEstimado && (
                        <div className="text-right">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                            ${parseFloat(oportunidad.montoEstimado).toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {oportunidad.probabilidad}% prob.
                          </p>
                        </div>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold bg-${estadoConfig.color}-100 text-${estadoConfig.color}-700 dark:bg-${estadoConfig.color}-900/30 dark:text-${estadoConfig.color}-400`}>
                        {estadoConfig.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Editar Contacto */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Editar Contacto
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Nombre y Apellido */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.nombre || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Apellido <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.apellido || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, apellido: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Teléfono y Correo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={editForm.telefono || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, telefono: e.target.value }))}
                    placeholder="Ej: +506 8888-8888"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={editForm.correo || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, correo: e.target.value }))}
                    placeholder="correo@ejemplo.com"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Teléfono secundario y Fecha de nacimiento */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Teléfono secundario
                  </label>
                  <input
                    type="tel"
                    value={editForm.telefonoSecundario || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, telefonoSecundario: e.target.value }))}
                    placeholder="Ej: +506 2222-2222"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={editForm.fechaNacimiento || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Medio preferido y Fuente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Medio de contacto preferido
                  </label>
                  <select
                    value={editForm.medioContactoPreferido || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, medioContactoPreferido: e.target.value as MedioContactoPreferido || undefined }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Seleccionar...</option>
                    <option value={MedioContactoPreferido.LLAMADA}>Llamada</option>
                    <option value={MedioContactoPreferido.WHATSAPP}>WhatsApp</option>
                    <option value={MedioContactoPreferido.CORREO}>Correo</option>
                    <option value={MedioContactoPreferido.SMS}>SMS</option>
                    <option value={MedioContactoPreferido.PRESENCIAL}>Presencial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Fuente
                  </label>
                  <input
                    type="text"
                    value={editForm.fuente || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, fuente: e.target.value }))}
                    placeholder="Ej: Facebook, Referido, Web"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Notas
                </label>
                <textarea
                  value={editForm.notas || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Notas adicionales sobre el contacto..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Sección Responsable */}
              <div className="border-t border-neutral-200 dark:border-dark-border pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                    <FaUserTie className="w-4 h-4" />
                    Responsable (opcional)
                  </h4>
                  {editForm.responsable && (
                    <button
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, responsable: undefined }))}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Eliminar responsable
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editForm.responsable?.nombre || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        responsable: { ...prev.responsable, nombre: e.target.value }
                      }))}
                      placeholder="Nombre del responsable"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={editForm.responsable?.apellido || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        responsable: { ...prev.responsable, apellido: e.target.value }
                      }))}
                      placeholder="Apellido"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={editForm.responsable?.telefono || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        responsable: { ...prev.responsable, telefono: e.target.value }
                      }))}
                      placeholder="Teléfono"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Correo
                    </label>
                    <input
                      type="email"
                      value={editForm.responsable?.correo || ''}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        responsable: { ...prev.responsable, correo: e.target.value }
                      }))}
                      placeholder="Correo"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Relación
                  </label>
                  <select
                    value={editForm.responsable?.relacion || ''}
                    onChange={(e) => setEditForm(prev => ({
                      ...prev,
                      responsable: { ...prev.responsable, relacion: e.target.value as RelacionResponsable || undefined }
                    }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Seleccionar relación...</option>
                    <option value={RelacionResponsable.PADRE}>Padre</option>
                    <option value={RelacionResponsable.MADRE}>Madre</option>
                    <option value={RelacionResponsable.TUTOR}>Tutor</option>
                    <option value={RelacionResponsable.CONYUGE}>Cónyuge</option>
                    <option value={RelacionResponsable.OTRO}>Otro</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={editSaving}
                className="flex-1 px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={editSaving || !editForm.nombre?.trim() || !editForm.apellido?.trim()}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {editSaving && <CgSpinner className="w-4 h-4 animate-spin" />}
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Eliminar */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Eliminar Contacto
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              ¿Estás seguro de que deseas eliminar el contacto <strong>{contacto.nombreCompleto}</strong>?
              {stats.abiertas > 0 && (
                <span className="block mt-2 text-red-600 dark:text-red-400">
                  Este contacto tiene {stats.abiertas} oportunidad(es) abierta(s). No se puede eliminar.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || stats.abiertas > 0}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {deleting && <CgSpinner className="w-4 h-4 animate-spin" />}
                <FaTrash className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva Oportunidad */}
      {oportunidadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Nueva Oportunidad para {contacto.nombre}
              </h3>
              <button
                onClick={() => setOportunidadModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={oportunidadForm.titulo}
                  onChange={(e) => setOportunidadForm(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Inscripción curso de inglés"
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Pipeline <span className="text-red-500">*</span>
                </label>
                <select
                  value={oportunidadForm.pipelineId}
                  onChange={(e) => setOportunidadForm(prev => ({ ...prev, pipelineId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {pipelines.map((pipeline) => (
                    <option key={pipeline.id} value={pipeline.id}>
                      {pipeline.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Monto estimado
                  </label>
                  <input
                    type="number"
                    value={oportunidadForm.montoEstimado}
                    onChange={(e) => setOportunidadForm(prev => ({ ...prev, montoEstimado: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Probabilidad (%)
                  </label>
                  <input
                    type="number"
                    value={oportunidadForm.probabilidad}
                    onChange={(e) => setOportunidadForm(prev => ({ ...prev, probabilidad: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={oportunidadForm.descripcion}
                  onChange={(e) => setOportunidadForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => setOportunidadModalOpen(false)}
                disabled={oportunidadSaving}
                className="flex-1 px-4 py-2.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateOportunidad}
                disabled={oportunidadSaving || !oportunidadForm.titulo.trim() || !oportunidadForm.pipelineId}
                className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {oportunidadSaving && <CgSpinner className="w-4 h-4 animate-spin" />}
                <FaPlus className="w-4 h-4" />
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
