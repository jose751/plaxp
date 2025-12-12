import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../../shared/contexts/AuthContext';
import {
  HiArrowLeft,
  HiUser,
  HiPhone,
  HiMail,
  HiCalendar,
  HiPencil,
  HiCheckCircle,
  HiXCircle,
  HiX,
  HiClock,
  HiChat,
  HiDocumentText,
  HiVideoCamera,
  HiClipboardList,
  HiBell,
  HiSwitchHorizontal,
  HiTrash,
  HiDotsVertical,
  HiUserGroup,
  HiArchive,
} from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { FaTimes, FaWhatsapp, FaRegStickyNote } from 'react-icons/fa';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';
import {
  obtenerOportunidadPorIdApi,
  obtenerTimelineApi,
  crearActividadApi,
  actualizarOportunidadApi,
  crearReunionApi,
  crearTareaApi,
  completarTareaApi,
  eliminarActividadApi,
  actualizarActividadApi,
  archivarOportunidadApi,
} from '../api/crmApi';
import { listarUsuariosApi } from '../../users/api/UsersApi';
import type { Usuario } from '../../users/types/user.types';
import { DatePicker, TimePicker, DurationPicker } from '../../../shared/components/DateTimePicker';
import type {
  CrmOportunidad,
  CrmActividad,
  TipoActividad,
  CrearActividadData,
  CrearReunionData,
  CrearTareaData,
} from '../types/crm.types';
import { TipoActividad as TipoActividadEnum } from '../types/crm.types';

// Configuración de tipos de actividad para creación manual
const TIPOS_ACTIVIDAD_CREABLES = [
  { value: TipoActividadEnum.NOTA, label: 'Nota', icon: HiDocumentText, color: 'bg-gray-500' },
  { value: TipoActividadEnum.LLAMADA, label: 'Llamada', icon: HiPhone, color: 'bg-blue-500' },
  { value: TipoActividadEnum.CORREO, label: 'Correo', icon: HiMail, color: 'bg-purple-500' },
  { value: TipoActividadEnum.WHATSAPP, label: 'WhatsApp', icon: FaWhatsapp, color: 'bg-green-500' },
  { value: TipoActividadEnum.REUNION, label: 'Reunión', icon: HiVideoCamera, color: 'bg-orange-500' },
  { value: TipoActividadEnum.TAREA, label: 'Tarea', icon: HiClipboardList, color: 'bg-yellow-500' },
  { value: TipoActividadEnum.RECORDATORIO, label: 'Recordatorio', icon: HiBell, color: 'bg-pink-500' },
];

// Configuración completa de tipos (incluye automáticos) para mostrar en timeline
const TIPOS_ACTIVIDAD_CONFIG: Record<string, { label: string; icon: typeof HiDocumentText; color: string }> = {
  [TipoActividadEnum.NOTA]: { label: 'Nota', icon: HiDocumentText, color: 'bg-gray-500' },
  [TipoActividadEnum.LLAMADA]: { label: 'Llamada', icon: HiPhone, color: 'bg-blue-500' },
  [TipoActividadEnum.CORREO]: { label: 'Correo', icon: HiMail, color: 'bg-purple-500' },
  [TipoActividadEnum.WHATSAPP]: { label: 'WhatsApp', icon: FaWhatsapp, color: 'bg-green-500' },
  [TipoActividadEnum.REUNION]: { label: 'Reunión', icon: HiVideoCamera, color: 'bg-orange-500' },
  [TipoActividadEnum.TAREA]: { label: 'Tarea', icon: HiClipboardList, color: 'bg-yellow-500' },
  [TipoActividadEnum.RECORDATORIO]: { label: 'Recordatorio', icon: HiBell, color: 'bg-pink-500' },
  [TipoActividadEnum.CAMBIO_ETAPA]: { label: 'Cambio de Etapa', icon: HiSwitchHorizontal, color: 'bg-indigo-500' },
};

const getIconForTipo = (tipo: TipoActividad) => {
  return TIPOS_ACTIVIDAD_CONFIG[tipo] || TIPOS_ACTIVIDAD_CONFIG[TipoActividadEnum.NOTA];
};

const cleanPhoneForWhatsApp = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Zona horaria de Costa Rica
const TIMEZONE_CR = 'America/Costa_Rica';

// Función para obtener fecha local en Costa Rica (YYYY-MM-DD)
const obtenerFechaLocalCR = (fecha: Date | string): string => {
  const date = new Date(fecha);
  return date.toLocaleDateString('en-CA', { timeZone: TIMEZONE_CR }); // en-CA da formato YYYY-MM-DD
};

// Función para obtener la fecha de hoy en Costa Rica a medianoche
const obtenerHoyCR = (): Date => {
  const ahora = new Date();
  const fechaStrCR = ahora.toLocaleDateString('en-CA', { timeZone: TIMEZONE_CR });
  return new Date(fechaStrCR + 'T00:00:00');
};

// Función para formatear fecha/hora con zona horaria de Costa Rica
const formatearFechaCR = (fecha: Date | string, opciones: Intl.DateTimeFormatOptions): string => {
  const date = new Date(fecha);
  return date.toLocaleString('es-ES', { ...opciones, timeZone: TIMEZONE_CR });
};

// Función para agrupar actividades: Próximamente (futuras), Hoy, Ayer, etc.
const agruparPorDia = (actividades: CrmActividad[]): { fecha: string; label: string; actividades: CrmActividad[]; esFuturo?: boolean }[] => {
  const hoy = obtenerHoyCR();
  const hoyStr = obtenerFechaLocalCR(hoy);

  // Separar actividades futuras (reuniones/tareas programadas para después de hoy)
  const proximamente: CrmActividad[] = [];
  const pasadas: CrmActividad[] = [];

  actividades.forEach((act) => {
    // Para reuniones, usar fechaInicio; para tareas, usar fechaVencimiento
    let fechaRelevante: Date | null = null;

    if (act.tipo === TipoActividadEnum.REUNION && act.fechaInicio) {
      fechaRelevante = new Date(act.fechaInicio);
    } else if (act.tipo === TipoActividadEnum.TAREA && act.fechaVencimiento) {
      fechaRelevante = new Date(act.fechaVencimiento);
    }

    if (fechaRelevante) {
      const fechaStr = obtenerFechaLocalCR(fechaRelevante);
      if (fechaStr > hoyStr) {
        proximamente.push(act);
        return;
      }
    }

    pasadas.push(act);
  });

  // Agrupar actividades pasadas por día de creación
  const grupos: Record<string, CrmActividad[]> = {};
  pasadas.forEach((act) => {
    const fecha = obtenerFechaLocalCR(act.fechaCreacion);
    if (!grupos[fecha]) {
      grupos[fecha] = [];
    }
    grupos[fecha].push(act);
  });

  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const inicioSemana = new Date(hoy);
  inicioSemana.setDate(hoy.getDate() - hoy.getDay());

  const resultado: { fecha: string; label: string; actividades: CrmActividad[]; esFuturo?: boolean }[] = [];

  // Agregar "Próximamente" primero si hay actividades futuras
  if (proximamente.length > 0) {
    // Ordenar por fecha más cercana primero
    proximamente.sort((a, b) => {
      const fechaA = a.tipo === TipoActividadEnum.REUNION ? a.fechaInicio : a.fechaVencimiento;
      const fechaB = b.tipo === TipoActividadEnum.REUNION ? b.fechaInicio : b.fechaVencimiento;
      return new Date(fechaA!).getTime() - new Date(fechaB!).getTime();
    });
    resultado.push({ fecha: 'proximamente', label: 'Próximamente', actividades: proximamente, esFuturo: true });
  }

  // Agregar grupos de días pasados
  Object.entries(grupos)
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .forEach(([fecha, acts]) => {
      const fechaDate = new Date(fecha + 'T00:00:00');
      let label: string;

      if (fechaDate.getTime() === hoy.getTime()) {
        label = 'Hoy';
      } else if (fechaDate.getTime() === ayer.getTime()) {
        label = 'Ayer';
      } else if (fechaDate >= inicioSemana) {
        label = fechaDate.toLocaleDateString('es-ES', { weekday: 'long' });
        label = label.charAt(0).toUpperCase() + label.slice(1);
      } else {
        label = fechaDate.toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: fechaDate.getFullYear() !== hoy.getFullYear() ? 'numeric' : undefined
        });
        label = label.charAt(0).toUpperCase() + label.slice(1);
      }

      resultado.push({ fecha, label, actividades: acts });
    });

  return resultado;
};

export const OportunidadDetallePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.user;

  // Estados principales
  const [oportunidad, setOportunidad] = useState<CrmOportunidad | null>(null);
  const [actividades, setActividades] = useState<CrmActividad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal de nueva actividad
  const [modalActividadOpen, setModalActividadOpen] = useState(false);
  const [tipoActividadSeleccionado, setTipoActividadSeleccionado] = useState<TipoActividad>(TipoActividadEnum.NOTA);
  const [contenidoActividad, setContenidoActividad] = useState('');
  const [fechaActividad, setFechaActividad] = useState('');
  const [savingActividad, setSavingActividad] = useState(false);

  // Modal de edición rápida
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    titulo: '',
    descripcion: '',
    montoEstimado: '',
    probabilidad: 0,
    fechaCierreEsperada: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Modal de nueva reunión
  const [modalReunionOpen, setModalReunionOpen] = useState(false);
  const [reunionForm, setReunionForm] = useState({
    asunto: '',
    contenido: '',
    fechaInicio: '',
    fechaFin: '',
    ubicacion: '',
    participantesIds: [] as string[],
  });
  const [savingReunion, setSavingReunion] = useState(false);

  // Modal de nueva tarea
  const [modalTareaOpen, setModalTareaOpen] = useState(false);
  const [tareaForm, setTareaForm] = useState({
    contenido: '',
    fechaVencimiento: '',
    asignadaA: '',
  });
  const [savingTarea, setSavingTarea] = useState(false);

  // Estados para lista de usuarios (para asignar)
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Estado para completar tareas
  const [completingTarea, setCompletingTarea] = useState<string | null>(null);

  // Estado para archivar oportunidad
  const [archiving, setArchiving] = useState(false);

  // Estado para filtro de actividades (tabs)
  const [filtroActividad, setFiltroActividad] = useState<'TODOS' | TipoActividad>('TODOS');

  // Estados para editar y eliminar actividades
  const [actividadAEditar, setActividadAEditar] = useState<CrmActividad | null>(null);
  const [actividadAEliminar, setActividadAEliminar] = useState<CrmActividad | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingActividad, setDeletingActividad] = useState(false);
  const [menuActividadOpen, setMenuActividadOpen] = useState<string | null>(null);

  // Estados para LoadingOverlay de actividades
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayMessage, setOverlayMessage] = useState('');
  const [overlaySuccess, setOverlaySuccess] = useState(false);
  const [overlaySuccessMessage, setOverlaySuccessMessage] = useState('');

  // Estado para modal de confirmación de completar actividad
  const [confirmCompletarOpen, setConfirmCompletarOpen] = useState(false);
  const [actividadACompletar, setActividadACompletar] = useState<CrmActividad | null>(null);

  // Cargar oportunidad
  const fetchOportunidad = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await obtenerOportunidadPorIdApi(id);
      if (response.success) {
        setOportunidad(response.data);
        setEditForm({
          titulo: response.data.titulo,
          descripcion: response.data.descripcion || '',
          montoEstimado: response.data.montoEstimado || '',
          probabilidad: response.data.probabilidad,
          fechaCierreEsperada: response.data.fechaCierreEsperada?.split('T')[0] || '',
        });
      } else {
        setError('No se pudo cargar la oportunidad');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar la oportunidad');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Cargar actividades
  const fetchActividades = useCallback(async () => {
    if (!id) return;
    try {
      setLoadingActividades(true);
      const response = await obtenerTimelineApi(id);
      if (response.success) {
        setActividades(response.data);
      }
    } catch (err) {
      console.error('Error al cargar actividades:', err);
    } finally {
      setLoadingActividades(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOportunidad();
    fetchActividades();
  }, [fetchOportunidad, fetchActividades]);

  // Cargar usuarios para asignación
  const fetchUsuarios = useCallback(async (busqueda?: string) => {
    try {
      setLoadingUsuarios(true);
      const response = await listarUsuariosApi({
        estado: 'activo',
        pageSize: 50,
        q: busqueda || undefined
      });
      if (response.success) {
        setUsuarios(response.data);
      }
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    } finally {
      setLoadingUsuarios(false);
    }
  }, []);

  // Cargar usuarios cuando se abre un modal de reunión o tarea
  useEffect(() => {
    if (modalReunionOpen || modalTareaOpen) {
      fetchUsuarios();
    }
  }, [modalReunionOpen, modalTareaOpen, fetchUsuarios]);

  // Cerrar dropdown de usuarios al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Crear actividad
  const handleCrearActividad = async () => {
    if (!id || !contenidoActividad.trim()) return;

    const tipoLabel = TIPOS_ACTIVIDAD_CONFIG[tipoActividadSeleccionado]?.label || 'Actividad';

    try {
      setSavingActividad(true);
      setModalActividadOpen(false);
      setOverlayMessage(`Guardando ${tipoLabel.toLowerCase()}...`);
      setOverlaySuccess(false);
      setShowOverlay(true);

      const payload: CrearActividadData = {
        tipo: tipoActividadSeleccionado,
        contenido: contenidoActividad.trim(),
        fechaInicio: fechaActividad || new Date().toISOString(),
      };

      const response = await crearActividadApi(id, payload);
      if (response.success) {
        setContenidoActividad('');
        setFechaActividad('');
        await fetchActividades();

        // Mostrar éxito
        setOverlaySuccessMessage(`${tipoLabel} guardada exitosamente`);
        setOverlaySuccess(true);
        setTimeout(() => setShowOverlay(false), 1500);
      } else {
        setShowOverlay(false);
      }
    } catch (err) {
      console.error('Error al crear actividad:', err);
      setShowOverlay(false);
    } finally {
      setSavingActividad(false);
    }
  };

  // Guardar edición
  const handleGuardarEdicion = async () => {
    if (!id) return;

    try {
      setSavingEdit(true);
      const response = await actualizarOportunidadApi(id, {
        titulo: editForm.titulo,
        descripcion: editForm.descripcion || undefined,
        montoEstimado: editForm.montoEstimado || undefined,
        probabilidad: editForm.probabilidad,
        fechaCierreEsperada: editForm.fechaCierreEsperada || undefined,
      });

      if (response.success) {
        setOportunidad(response.data);
        setEditModalOpen(false);
      }
    } catch (err) {
      console.error('Error al actualizar:', err);
    } finally {
      setSavingEdit(false);
    }
  };

  // Archivar/Desarchivar oportunidad
  const handleArchivar = async () => {
    if (!id || !oportunidad) return;

    try {
      setArchiving(true);
      const nuevoEstado = !oportunidad.archivado;
      const response = await archivarOportunidadApi(id, { archivar: nuevoEstado });

      if (response.success) {
        setOportunidad(response.data);
      }
    } catch (err) {
      console.error('Error al archivar:', err);
    } finally {
      setArchiving(false);
    }
  };

  // Crear/Editar reunión
  const handleCrearReunion = async () => {
    if (!id || !reunionForm.asunto.trim() || !reunionForm.fechaInicio || !reunionForm.fechaFin) return;

    const esEdicion = !!actividadAEditar;
    const mensajeCarga = esEdicion ? 'Actualizando reunión...' : 'Guardando reunión...';
    const mensajeExito = esEdicion ? 'Reunión actualizada exitosamente' : 'Reunión guardada exitosamente';

    try {
      setSavingReunion(true);
      setModalReunionOpen(false);
      setOverlayMessage(mensajeCarga);
      setOverlaySuccess(false);
      setShowOverlay(true);

      if (esEdicion) {
        // Modo edición
        const response = await actualizarActividadApi(actividadAEditar!.id, {
          contenido: reunionForm.contenido.trim() || undefined,
          fechaInicio: reunionForm.fechaInicio,
          fechaFin: reunionForm.fechaFin,
          participantesUsuarioIds: reunionForm.participantesIds,
        });
        if (response.success) {
          setReunionForm({ asunto: '', contenido: '', fechaInicio: '', fechaFin: '', ubicacion: '', participantesIds: [] });
          setActividadAEditar(null);
          await fetchActividades();

          setOverlaySuccessMessage(mensajeExito);
          setOverlaySuccess(true);
          setTimeout(() => setShowOverlay(false), 1500);
        } else {
          setShowOverlay(false);
        }
      } else {
        // Modo creación
        const payload: CrearReunionData = {
          asunto: reunionForm.asunto.trim(),
          contenido: reunionForm.contenido.trim() || undefined,
          fechaInicio: reunionForm.fechaInicio,
          fechaFin: reunionForm.fechaFin,
          ubicacion: reunionForm.ubicacion.trim() || undefined,
          participantesIds: reunionForm.participantesIds,
        };

        const response = await crearReunionApi(id, payload);
        if (response.success) {
          setReunionForm({ asunto: '', contenido: '', fechaInicio: '', fechaFin: '', ubicacion: '', participantesIds: [] });
          await fetchActividades();

          setOverlaySuccessMessage(mensajeExito);
          setOverlaySuccess(true);
          setTimeout(() => setShowOverlay(false), 1500);
        } else {
          setShowOverlay(false);
        }
      }
    } catch (err) {
      console.error('Error al guardar reunión:', err);
      setShowOverlay(false);
    } finally {
      setSavingReunion(false);
    }
  };

  // Crear/Editar tarea
  const handleCrearTarea = async () => {
    if (!id || !tareaForm.contenido.trim() || !tareaForm.fechaVencimiento) return;

    const esEdicion = !!actividadAEditar;
    const mensajeCarga = esEdicion ? 'Actualizando tarea...' : 'Guardando tarea...';
    const mensajeExito = esEdicion ? 'Tarea actualizada exitosamente' : 'Tarea guardada exitosamente';

    try {
      setSavingTarea(true);
      setModalTareaOpen(false);
      setOverlayMessage(mensajeCarga);
      setOverlaySuccess(false);
      setShowOverlay(true);

      if (esEdicion) {
        // Modo edición
        const response = await actualizarActividadApi(actividadAEditar!.id, {
          contenido: tareaForm.contenido.trim(),
        });
        if (response.success) {
          setTareaForm({ contenido: '', fechaVencimiento: '', asignadaA: '' });
          setActividadAEditar(null);
          await fetchActividades();

          setOverlaySuccessMessage(mensajeExito);
          setOverlaySuccess(true);
          setTimeout(() => setShowOverlay(false), 1500);
        } else {
          setShowOverlay(false);
        }
      } else {
        // Modo creación
        const payload: CrearTareaData = {
          contenido: tareaForm.contenido.trim(),
          fechaVencimiento: tareaForm.fechaVencimiento,
          asignadaA: tareaForm.asignadaA || undefined,
        };

        const response = await crearTareaApi(id, payload);
        if (response.success) {
          setTareaForm({ contenido: '', fechaVencimiento: '', asignadaA: '' });
          await fetchActividades();

          setOverlaySuccessMessage(mensajeExito);
          setOverlaySuccess(true);
          setTimeout(() => setShowOverlay(false), 1500);
        } else {
          setShowOverlay(false);
        }
      }
    } catch (err) {
      console.error('Error al guardar tarea:', err);
      setShowOverlay(false);
    } finally {
      setSavingTarea(false);
    }
  };

  // Abrir modal de confirmación para completar/descompletar actividad
  const handleAbrirConfirmCompletar = (actividad: CrmActividad) => {
    setActividadACompletar(actividad);
    setConfirmCompletarOpen(true);
  };

  // Completar/descompletar tarea o reunión (después de confirmación)
  const handleConfirmarCompletar = async () => {
    if (!actividadACompletar) return;

    try {
      setCompletingTarea(actividadACompletar.id);
      setConfirmCompletarOpen(false);
      const response = await completarTareaApi(actividadACompletar.id, !actividadACompletar.completada);
      if (response.success) {
        await fetchActividades();
      }
    } catch (err) {
      console.error('Error al actualizar actividad:', err);
    } finally {
      setCompletingTarea(null);
      setActividadACompletar(null);
    }
  };

  // Helper para obtener solo la fecha (sin hora) para comparaciones
  const obtenerSoloFecha = (fecha: Date | string) => {
    const d = new Date(fecha);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  // Helper para verificar si una tarea está vencida (fecha de vencimiento menor a hoy)
  const isTareaVencida = (actividad: CrmActividad) => {
    if (actividad.tipo !== TipoActividadEnum.TAREA || actividad.completada) return false;
    if (!actividad.fechaVencimiento) return false;
    const fechaVencimiento = obtenerSoloFecha(actividad.fechaVencimiento);
    const hoy = obtenerSoloFecha(new Date());
    return fechaVencimiento < hoy; // Vencida si la fecha es menor a hoy (no incluye hoy)
  };

  // Helper para verificar si una reunión está vencida (fecha de la reunión menor a hoy)
  const isReunionVencida = (actividad: CrmActividad) => {
    if (actividad.tipo !== TipoActividadEnum.REUNION) return false;
    const fechaReunion = obtenerSoloFecha(actividad.fechaFin);
    const hoy = obtenerSoloFecha(new Date());
    return fechaReunion < hoy; // Vencida si la fecha es menor a hoy (no incluye hoy)
  };

  // Helper para verificar si se puede cambiar el estado de una actividad
  // Solo se puede cambiar el mismo día de la fecha programada
  const puedeCambiarEstado = (actividad: CrmActividad) => {
    const hoy = obtenerSoloFecha(new Date());

    if (actividad.tipo === TipoActividadEnum.TAREA && actividad.fechaVencimiento) {
      const fechaVencimiento = obtenerSoloFecha(actividad.fechaVencimiento);
      return fechaVencimiento.getTime() === hoy.getTime();
    }

    if (actividad.tipo === TipoActividadEnum.REUNION && actividad.fechaFin) {
      const fechaReunion = obtenerSoloFecha(actividad.fechaFin);
      return fechaReunion.getTime() === hoy.getTime();
    }

    return false;
  };

  // Eliminar actividad
  const handleEliminarActividad = async () => {
    if (!actividadAEliminar) return;

    try {
      setDeletingActividad(true);
      const response = await eliminarActividadApi(actividadAEliminar.id);
      if (response.success) {
        setConfirmDeleteOpen(false);
        setActividadAEliminar(null);
        await fetchActividades();
      }
    } catch (err) {
      console.error('Error al eliminar actividad:', err);
    } finally {
      setDeletingActividad(false);
    }
  };

  // Abrir modal de edición para reunión
  const handleEditarReunion = (actividad: CrmActividad) => {
    setReunionForm({
      asunto: actividad.asunto || '',
      contenido: actividad.contenido || '',
      fechaInicio: actividad.fechaInicio?.slice(0, 16) || '',
      fechaFin: actividad.fechaFin?.slice(0, 16) || '',
      ubicacion: actividad.ubicacion || '',
      participantesIds: actividad.participantes?.map(p => p.usuarioId) || [],
    });
    setActividadAEditar(actividad);
    setModalReunionOpen(true);
    setMenuActividadOpen(null);
  };

  // Abrir modal de edición para tarea
  const handleEditarTarea = (actividad: CrmActividad) => {
    setTareaForm({
      contenido: actividad.contenido || '',
      fechaVencimiento: actividad.fechaVencimiento?.slice(0, 16) || '',
      asignadaA: actividad.asignadaA?.toString() || '',
    });
    setActividadAEditar(actividad);
    setModalTareaOpen(true);
    setMenuActividadOpen(null);
  };

  // Abrir modal de edición para actividad genérica
  const handleEditarActividad = (actividad: CrmActividad) => {
    setTipoActividadSeleccionado(actividad.tipo);
    setContenidoActividad(actividad.contenido || '');
    setFechaActividad(actividad.fechaInicio?.slice(0, 16) || '');
    setActividadAEditar(actividad);
    setModalActividadOpen(true);
    setMenuActividadOpen(null);
  };

  // Abrir confirmación de eliminación
  const handleConfirmarEliminar = (actividad: CrmActividad) => {
    setActividadAEliminar(actividad);
    setConfirmDeleteOpen(true);
    setMenuActividadOpen(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <CgSpinner className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !oportunidad) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
        <p className="text-red-500">{error || 'Oportunidad no encontrada'}</p>
        <button
          onClick={() => navigate('/crm/oportunidades')}
          className="px-4 py-2 bg-primary text-white rounded-lg"
        >
          Volver al tablero
        </button>
      </div>
    );
  }

  const monto = oportunidad.montoEstimado ? parseFloat(oportunidad.montoEstimado) : 0;
  const montoPonderado = monto * oportunidad.probabilidad / 100;

  // Filtrar actividades según el tab seleccionado
  const actividadesFiltradas = filtroActividad === 'TODOS'
    ? actividades
    : actividades.filter(a => a.tipo === filtroActividad);

  // Tabs de filtro
  const TABS_ACTIVIDAD = [
    { value: 'TODOS', label: 'Actividad', icon: HiChat },
    { value: TipoActividadEnum.NOTA, label: 'Notas', icon: FaRegStickyNote },
    { value: TipoActividadEnum.CORREO, label: 'Correos', icon: HiMail },
    { value: TipoActividadEnum.LLAMADA, label: 'Llamadas', icon: HiPhone },
    { value: TipoActividadEnum.TAREA, label: 'Tareas', icon: HiClipboardList },
    { value: TipoActividadEnum.REUNION, label: 'Reuniones', icon: HiVideoCamera },
  ];

  return (
    <div className="h-[calc(100vh-120px)]">
      {/* LoadingOverlay para actividades */}
      <LoadingOverlay
        isVisible={showOverlay}
        message={overlayMessage}
        isSuccess={overlaySuccess}
        successMessage={overlaySuccessMessage}
      />

      {/* Header con botón volver */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate('/crm/oportunidades')}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
        >
          <HiArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
        </button>
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {oportunidad.titulo}
        </h1>
        <span
          className={`
            px-2 py-0.5 rounded-full text-xs font-medium
            ${oportunidad.estado === 'GANADA'
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
              : oportunidad.estado === 'PERDIDA'
                ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400'
            }
          `}
        >
          {oportunidad.estado}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-60px)]">
        {/* PANEL IZQUIERDO */}
        <div className="lg:col-span-1 space-y-4 overflow-y-auto pr-2">
          {/* Card unificada: Contacto + Oportunidad */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border p-5">
            {/* Header con contacto */}
            {oportunidad.contacto && (
              <>
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => navigate(`/crm/contactos/view/${oportunidad.contactoId}`)}
                  >
                    {oportunidad.contacto.nombre.charAt(0)}
                    {oportunidad.contacto.apellido?.charAt(0) || ''}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2
                      className="font-semibold text-neutral-900 dark:text-neutral-100 truncate cursor-pointer hover:text-primary transition-colors"
                      onClick={() => navigate(`/crm/contactos/view/${oportunidad.contactoId}`)}
                    >
                      {oportunidad.contacto.nombreCompleto}
                    </h2>
                    <div className="flex flex-col text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {oportunidad.contacto.telefono && <span>{oportunidad.contacto.telefono}</span>}
                      {oportunidad.contacto.correo && <span className="truncate">{oportunidad.contacto.correo}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditModalOpen(true)}
                      className="p-1.5 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar oportunidad"
                    >
                      <HiPencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleArchivar}
                      disabled={archiving}
                      className={`p-1.5 rounded-lg transition-colors ${
                        oportunidad.archivado
                          ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          : 'text-neutral-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                      }`}
                      title={oportunidad.archivado ? 'Desarchivar oportunidad' : 'Archivar oportunidad'}
                    >
                      {archiving ? <CgSpinner className="w-4 h-4 animate-spin" /> : <HiArchive className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Indicador de archivado */}
                {oportunidad.archivado && (
                  <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <HiArchive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">Oportunidad archivada</span>
                    <button
                      onClick={handleArchivar}
                      disabled={archiving}
                      className="ml-auto text-xs text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      Desarchivar
                    </button>
                  </div>
                )}

                {/* Acciones rápidas compactas */}
                <div className="flex items-center gap-1 mb-4 pb-4 border-b border-neutral-100 dark:border-dark-border">
                  <button
                    onClick={() => { setTipoActividadSeleccionado(TipoActividadEnum.NOTA); setModalActividadOpen(true); }}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-neutral-100 dark:bg-dark-bg hover:bg-neutral-200 dark:hover:bg-dark-hover transition-colors text-neutral-600 dark:text-neutral-400"
                    title="Nota"
                  >
                    <HiDocumentText className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setTipoActividadSeleccionado(TipoActividadEnum.LLAMADA); setModalActividadOpen(true); }}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-blue-600 dark:text-blue-400"
                    title="Llamada"
                  >
                    <HiPhone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setTipoActividadSeleccionado(TipoActividadEnum.CORREO); setModalActividadOpen(true); }}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-purple-600 dark:text-purple-400"
                    title="Correo"
                  >
                    <HiMail className="w-4 h-4" />
                  </button>
                  {oportunidad.contacto.telefono && (
                    <a
                      href={`https://wa.me/${cleanPhoneForWhatsApp(oportunidad.contacto.telefono)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center py-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-green-600 dark:text-green-400"
                      title="WhatsApp"
                    >
                      <FaWhatsapp className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => setModalReunionOpen(true)}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-orange-600 dark:text-orange-400"
                    title="Reunión"
                  >
                    <HiVideoCamera className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setModalTareaOpen(true)}
                    className="flex-1 flex items-center justify-center py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors text-yellow-600 dark:text-yellow-400"
                    title="Tarea"
                  >
                    <HiClipboardList className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}

            {/* Métricas de la oportunidad */}
            <div className="space-y-3">
              {/* Etapa */}
              {oportunidad.etapa && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Etapa</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: oportunidad.etapa.color || '#6366f1' }}
                    />
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {oportunidad.etapa.nombre}
                    </span>
                  </div>
                </div>
              )}

              {/* Valor */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Valor</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  ${monto.toLocaleString()}
                </span>
              </div>

              {/* Probabilidad */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Probabilidad</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-neutral-200 dark:bg-dark-border rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        oportunidad.probabilidad >= 70 ? 'bg-green-500' :
                        oportunidad.probabilidad >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${oportunidad.probabilidad}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${
                    oportunidad.probabilidad >= 70 ? 'text-green-600' :
                    oportunidad.probabilidad >= 40 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {oportunidad.probabilidad}%
                  </span>
                </div>
              </div>

              {/* Ponderado */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Ponderado</span>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  ${montoPonderado.toLocaleString()}
                </span>
              </div>

              {/* Fecha de cierre */}
              {oportunidad.fechaCierreEsperada && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Cierre</span>
                  <span className="text-sm text-neutral-800 dark:text-neutral-200">
                    {formatearFechaCR(oportunidad.fechaCierreEsperada, {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}

              {/* Descripción */}
              {oportunidad.descripcion && (
                <div className="pt-2 border-t border-neutral-100 dark:border-dark-border">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Descripción</p>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                    {oportunidad.descripcion}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PANEL DERECHO - Timeline de actividades */}
        <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border flex flex-col overflow-hidden">
          {/* Tabs de filtro + botón de filtros avanzados */}
          <div className="border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center">
              <div className="flex-1 flex overflow-x-auto scrollbar-hide">
                {TABS_ACTIVIDAD.map((tab) => {
                  const count = tab.value === 'TODOS'
                    ? actividades.length
                    : actividades.filter(a => a.tipo === tab.value).length;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setFiltroActividad(tab.value as 'TODOS' | TipoActividad)}
                      className={`
                        flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                        ${filtroActividad === tab.value
                          ? 'border-primary text-primary'
                          : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
                        }
                      `}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {count > 0 && (
                        <span className={`
                          px-1.5 py-0.5 text-xs rounded-full
                          ${filtroActividad === tab.value
                            ? 'bg-primary/10 text-primary'
                            : 'bg-neutral-100 dark:bg-dark-hover text-neutral-500'
                          }
                        `}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

          {/* Lista de actividades */}
          <div className="flex-1 overflow-y-auto p-4 bg-neutral-50/50 dark:bg-dark-bg/50">
            {loadingActividades ? (
              <div className="flex justify-center py-12">
                <CgSpinner className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : actividadesFiltradas.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-dark-hover flex items-center justify-center">
                  <HiChat className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                  {filtroActividad === 'TODOS' ? 'No hay actividades' : `No hay ${TABS_ACTIVIDAD.find(t => t.value === filtroActividad)?.label.toLowerCase()}`}
                </p>
                <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                  Registra tu primera actividad usando los botones de arriba
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {agruparPorDia(actividadesFiltradas).map((grupo) => (
                  <div key={grupo.fecha} className="relative">
                    {/* Header del día - Card estilo sticky note */}
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-3 bg-white dark:bg-dark-card px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-dark-border shadow-sm">
                        <div className={`
                          w-10 h-10 rounded-xl flex items-center justify-center
                          ${grupo.label === 'Hoy'
                            ? 'bg-gradient-to-br from-primary to-primary-dark text-white'
                            : grupo.label === 'Ayer'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                              : 'bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-800 text-neutral-600 dark:text-neutral-300'
                          }
                        `}>
                          <HiCalendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className={`
                            text-sm font-bold
                            ${grupo.label === 'Hoy'
                              ? 'text-primary'
                              : grupo.label === 'Ayer'
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-neutral-800 dark:text-neutral-200'
                            }
                          `}>
                            {grupo.label}
                          </h4>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {grupo.actividades.length} {grupo.actividades.length === 1 ? 'actividad' : 'actividades'}
                          </p>
                        </div>
                        {grupo.label === 'Hoy' && (
                          <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      {/* Línea conectora */}
                      <div className="absolute left-7 top-14 bottom-0 w-0.5 bg-gradient-to-b from-neutral-300 dark:from-neutral-600 to-transparent" style={{ height: 'calc(100% - 3.5rem)' }} />
                    </div>

                    {/* Actividades del día */}
                    <div className="space-y-3 ml-14 relative">
                      {grupo.actividades.map((actividad) => {
                        const tipoConfig = getIconForTipo(actividad.tipo);
                        const IconComponent = tipoConfig.icon;
                        const esReunion = actividad.tipo === TipoActividadEnum.REUNION;
                        const esTarea = actividad.tipo === TipoActividadEnum.TAREA;
                        const tareaVencida = isTareaVencida(actividad);
                        const reunionVencida = isReunionVencida(actividad);
                        const actividadVencida = tareaVencida || reunionVencida;

                        return (
                          <div
                            key={actividad.id}
                            className={`
                              p-4 rounded-xl border transition-all hover:shadow-md group cursor-pointer relative
                              ${actividadVencida
                                ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800/50'
                                : 'bg-white dark:bg-dark-card border-neutral-100 dark:border-dark-border hover:border-neutral-200 dark:hover:border-neutral-600'
                              }
                            `}
                          >
                            <div className="flex gap-3">
                        {/* Icono del tipo de actividad (siempre visible) */}
                        <div className={`w-8 h-8 rounded-lg ${tipoConfig.color} flex items-center justify-center text-white flex-shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Header de la actividad */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                {esReunion && actividad.asunto ? (
                                  <span className={`font-medium text-sm ${actividad.completada ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                    {actividad.asunto}
                                  </span>
                                ) : (
                                  <span className={`font-medium text-sm ${(esTarea || esReunion) && actividad.completada ? 'text-neutral-400 line-through' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                    {tipoConfig.label}
                                  </span>
                                )}
                                {actividadVencida && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-full">
                                    Vencida
                                  </span>
                                )}
                                {(esTarea || esReunion) && actividad.completada && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 rounded-full">
                                    {esReunion ? 'Realizada' : 'Completada'}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                {actividad.creadoPorNombre && (
                                  <span className="text-xs text-primary font-medium">
                                    {actividad.creadoPorNombre}
                                  </span>
                                )}
                                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                  {formatearFechaCR(actividad.fechaCreacion, {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            </div>

                            {/* Checkbox para completar tareas/reuniones (lado derecho) */}
                            {(esTarea || esReunion) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const puedeCompletar = puedeCambiarEstado(actividad);
                                  if (puedeCompletar) {
                                    handleAbrirConfirmCompletar(actividad);
                                  }
                                }}
                                disabled={completingTarea === actividad.id || !puedeCambiarEstado(actividad)}
                                title={
                                  actividadVencida
                                    ? `${esTarea ? 'Tarea' : 'Reunión'} vencida - no se puede cambiar estado`
                                    : !puedeCambiarEstado(actividad)
                                      ? `Solo se puede ${actividad.completada ? 'desmarcar' : 'completar'} el día programado`
                                      : (actividad.completada ? `Desmarcar como ${esTarea ? 'completada' : 'realizada'}` : `Marcar como ${esTarea ? 'completada' : 'realizada'}`)
                                }
                                className={`
                                  w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all
                                  ${actividad.completada
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : actividadVencida
                                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20 cursor-not-allowed opacity-50'
                                      : !puedeCambiarEstado(actividad)
                                        ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 cursor-not-allowed opacity-50'
                                        : 'border-neutral-300 dark:border-neutral-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  }
                                `}
                              >
                                {completingTarea === actividad.id ? (
                                  <CgSpinner className="w-3 h-3 animate-spin" />
                                ) : actividad.completada ? (
                                  <HiCheckCircle className="w-3.5 h-3.5" />
                                ) : actividadVencida ? (
                                  <HiX className="w-3 h-3 text-red-400" />
                                ) : null}
                              </button>
                            )}

                            {/* Menú de acciones - Solo mostrar si NO está vencida y no es cambio de etapa */}
                            {actividad.tipo !== TipoActividadEnum.CAMBIO_ETAPA && !actividadVencida && (
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuActividadOpen(menuActividadOpen === actividad.id ? null : actividad.id);
                                  }}
                                  className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <HiDotsVertical className="w-4 h-4" />
                                </button>

                                {menuActividadOpen === actividad.id && (
                                  <div className="absolute right-0 top-8 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border py-1 z-10 min-w-[120px]">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (esReunion) handleEditarReunion(actividad);
                                        else if (esTarea) handleEditarTarea(actividad);
                                        else handleEditarActividad(actividad);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                                    >
                                      <HiPencil className="w-4 h-4" />
                                      Editar
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleConfirmarEliminar(actividad);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                      <HiTrash className="w-4 h-4" />
                                      Eliminar
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Contenido */}
                          {actividad.contenido && (
                            <p className={`
                              text-sm mt-2
                              ${esTarea && actividad.completada
                                ? 'text-neutral-400 dark:text-neutral-500 line-through'
                                : 'text-neutral-700 dark:text-neutral-300'
                              }
                            `}>
                              {actividad.contenido}
                            </p>
                          )}

                          {/* Info adicional para reuniones */}
                          {esReunion && (
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                              <span className="flex items-center gap-1">
                                <HiClock className="w-3.5 h-3.5" />
                                {formatearFechaCR(actividad.fechaInicio, {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                                {' - '}
                                {formatearFechaCR(actividad.fechaFin, {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true,
                                })}
                              </span>
                              {actividad.ubicacion && (
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">@</span> {actividad.ubicacion}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Info adicional para tareas */}
                          {esTarea && (
                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                              {actividad.fechaVencimiento && (
                                <span className={`flex items-center gap-1 ${tareaVencida ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                  <HiCalendar className="w-3.5 h-3.5" />
                                  Vence: {formatearFechaCR(actividad.fechaVencimiento, {
                                    day: '2-digit',
                                    month: 'short',
                                  })}
                                </span>
                              )}
                              {actividad.asignadaANombre && !actividad.completada && (
                                <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                                  <HiUser className="w-3.5 h-3.5" />
                                  {actividad.asignadaANombre}
                                </span>
                              )}
                              {actividad.completada && actividad.completadaPorNombre && (
                                <span className="text-green-600 dark:text-green-400">
                                  Completada por {actividad.completadaPorNombre}
                                </span>
                              )}
                            </div>
                          )}

                              {actividad.resultado && (
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 italic border-l-2 border-neutral-300 dark:border-neutral-600 pl-2">
                                  {actividad.resultado}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Modal de Nueva Actividad */}
      {modalActividadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Nueva Actividad
              </h3>
              <button
                onClick={() => setModalActividadOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Tipo de actividad */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Tipo de actividad
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {TIPOS_ACTIVIDAD_CREABLES.map((tipo) => (
                    <button
                      key={tipo.value}
                      onClick={() => setTipoActividadSeleccionado(tipo.value)}
                      className={`
                        flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                        ${tipoActividadSeleccionado === tipo.value
                          ? 'border-primary bg-primary/10'
                          : 'border-neutral-200 dark:border-dark-border hover:border-primary/50'
                        }
                      `}
                    >
                      <tipo.icon className={`w-5 h-5 ${tipoActividadSeleccionado === tipo.value ? 'text-primary' : 'text-neutral-500'}`} />
                      <span className={`text-xs ${tipoActividadSeleccionado === tipo.value ? 'text-primary font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                        {tipo.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contenido */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={contenidoActividad}
                  onChange={(e) => setContenidoActividad(e.target.value)}
                  placeholder="Describe la actividad..."
                  rows={4}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Fecha (para reuniones y tareas) */}
              {(tipoActividadSeleccionado === TipoActividadEnum.REUNION ||
                tipoActividadSeleccionado === TipoActividadEnum.TAREA ||
                tipoActividadSeleccionado === TipoActividadEnum.RECORDATORIO) && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Fecha y hora
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaActividad}
                    onChange={(e) => setFechaActividad(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => setModalActividadOpen(false)}
                disabled={savingActividad}
                className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearActividad}
                disabled={savingActividad || !contenidoActividad.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {savingActividad && <CgSpinner className="w-4 h-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Editar Oportunidad
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.titulo}
                  onChange={(e) => setEditForm(prev => ({ ...prev, titulo: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Monto y Probabilidad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Monto estimado
                  </label>
                  <input
                    type="number"
                    value={editForm.montoEstimado}
                    onChange={(e) => setEditForm(prev => ({ ...prev, montoEstimado: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Probabilidad (%)
                  </label>
                  <input
                    type="number"
                    value={editForm.probabilidad}
                    onChange={(e) => setEditForm(prev => ({ ...prev, probabilidad: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Fecha de cierre */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Fecha de cierre esperada
                </label>
                <input
                  type="date"
                  value={editForm.fechaCierreEsperada}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fechaCierreEsperada: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => setEditModalOpen(false)}
                disabled={savingEdit}
                className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarEdicion}
                disabled={savingEdit || !editForm.titulo.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {savingEdit && <CgSpinner className="w-4 h-4 animate-spin" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva/Editar Reunión */}
      {modalReunionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                  <HiVideoCamera className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {actividadAEditar ? 'Editar Reunión' : 'Nueva Reunión'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setModalReunionOpen(false);
                  setActividadAEditar(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Asunto */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Asunto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reunionForm.asunto}
                  onChange={(e) => setReunionForm(prev => ({ ...prev, asunto: e.target.value }))}
                  placeholder="Ej: Reunión de seguimiento"
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  <HiCalendar className="inline w-4 h-4 mr-1" />
                  Fecha <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  value={reunionForm.fechaInicio.split('T')[0] || ''}
                  onChange={(dateStr: string) => {
                    const currentTime = reunionForm.fechaInicio.split('T')[1] || '09:00';
                    const currentEndTime = reunionForm.fechaFin.split('T')[1] || '10:00';
                    setReunionForm(prev => ({
                      ...prev,
                      fechaInicio: `${dateStr}T${currentTime}`,
                      fechaFin: `${dateStr}T${currentEndTime}`
                    }));
                  }}
                  placeholder="Seleccionar fecha"
                  accentColor="orange"
                />
              </div>

              {/* Hora inicio y duración */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    <HiClock className="inline w-4 h-4 mr-1" />
                    Hora inicio <span className="text-red-500">*</span>
                  </label>
                  <TimePicker
                    value={reunionForm.fechaInicio.split('T')[1] || ''}
                    onChange={(timeStr: string) => {
                      const dateStr = reunionForm.fechaInicio.split('T')[0] || new Date().toISOString().split('T')[0];
                      setReunionForm(prev => ({ ...prev, fechaInicio: `${dateStr}T${timeStr}` }));
                    }}
                    placeholder="Hora inicio"
                    accentColor="orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Duración
                  </label>
                  <DurationPicker
                    value={(() => {
                      const startTime = reunionForm.fechaInicio.split('T')[1];
                      const endTime = reunionForm.fechaFin.split('T')[1];
                      if (!startTime || !endTime) return 60;
                      const [sh, sm] = startTime.split(':').map(Number);
                      const [eh, em] = endTime.split(':').map(Number);
                      return (eh * 60 + em) - (sh * 60 + sm);
                    })()}
                    onChange={(minutes: number) => {
                      const dateStr = reunionForm.fechaInicio.split('T')[0] || new Date().toISOString().split('T')[0];
                      const startTime = reunionForm.fechaInicio.split('T')[1] || '09:00';
                      const [hours, mins] = startTime.split(':').map(Number);
                      const endMinutes = hours * 60 + mins + minutes;
                      const endHours = Math.floor(endMinutes / 60);
                      const endMins = endMinutes % 60;
                      const endTimeStr = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
                      setReunionForm(prev => ({ ...prev, fechaFin: `${dateStr}T${endTimeStr}` }));
                    }}
                    accentColor="orange"
                  />
                </div>
              </div>

              {/* Ubicación */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Ubicación
                </label>
                <input
                  type="text"
                  value={reunionForm.ubicacion}
                  onChange={(e) => setReunionForm(prev => ({ ...prev, ubicacion: e.target.value }))}
                  placeholder="Ej: Oficina central, Zoom, Google Meet..."
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Organizador (usuario actual - no se puede quitar) */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <HiUser className="inline w-4 h-4 mr-1" />
                  Organizador
                </label>
                <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-orange-500 flex items-center justify-center text-white text-sm font-bold">
                    {currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {currentUser?.nombre || 'Usuario actual'}
                    </p>
                    <p className="text-xs text-neutral-500">{currentUser?.correo}</p>
                  </div>
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-full">
                    Tú
                  </span>
                </div>
              </div>

              {/* Invitados */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <HiUserGroup className="inline w-4 h-4 mr-1" />
                  Invitados <span className="text-neutral-400 font-normal">(opcional)</span>
                </label>
                <div ref={userDropdownRef} className="relative">
                  <div className="flex flex-wrap gap-2 p-2 min-h-[42px] border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg">
                    {reunionForm.participantesIds.map(userId => {
                      const user = usuarios.find(u => u.id === userId);
                      return user ? (
                        <span
                          key={userId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs rounded-full"
                        >
                          {user.nombre}
                          <button
                            type="button"
                            onClick={() => setReunionForm(prev => ({
                              ...prev,
                              participantesIds: prev.participantesIds.filter(id => id !== userId)
                            }))}
                            className="hover:text-red-600 dark:hover:text-red-400"
                          >
                            <FaTimes className="w-3 h-3" />
                          </button>
                        </span>
                      ) : null;
                    })}
                    <input
                      type="text"
                      value={busquedaUsuario}
                      onChange={(e) => {
                        setBusquedaUsuario(e.target.value);
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      placeholder="Buscar usuarios para invitar..."
                      className="flex-1 min-w-[120px] text-sm bg-transparent outline-none text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
                    />
                  </div>
                  {showUserDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {loadingUsuarios ? (
                        <div className="flex items-center justify-center py-4">
                          <CgSpinner className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      ) : usuarios.filter(u =>
                        u.id !== currentUser?.id &&
                        !reunionForm.participantesIds.includes(u.id) &&
                        u.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase())
                      ).length === 0 ? (
                        <p className="text-sm text-neutral-500 py-3 px-4">No hay usuarios disponibles</p>
                      ) : (
                        usuarios
                          .filter(u =>
                            u.id !== currentUser?.id &&
                            !reunionForm.participantesIds.includes(u.id) &&
                            u.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase())
                          )
                          .map(user => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => {
                                setReunionForm(prev => ({
                                  ...prev,
                                  participantesIds: [...prev.participantesIds, user.id]
                                }));
                                setBusquedaUsuario('');
                                setShowUserDropdown(false);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 dark:hover:bg-dark-hover text-left transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-medium">
                                {user.nombre.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user.nombre}</p>
                                <p className="text-xs text-neutral-500">{user.correo}</p>
                              </div>
                            </button>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Notas/Descripción */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Notas
                </label>
                <textarea
                  value={reunionForm.contenido}
                  onChange={(e) => setReunionForm(prev => ({ ...prev, contenido: e.target.value }))}
                  placeholder="Agenda o notas adicionales..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setModalReunionOpen(false);
                  setActividadAEditar(null);
                }}
                disabled={savingReunion}
                className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearReunion}
                disabled={savingReunion || !reunionForm.asunto.trim() || !reunionForm.fechaInicio || !reunionForm.fechaFin}
                className="flex-1 px-4 py-2.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {savingReunion && <CgSpinner className="w-4 h-4 animate-spin" />}
                {actividadAEditar ? 'Guardar Cambios' : 'Agendar Reunión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nueva/Editar Tarea */}
      {modalTareaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <HiClipboardList className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {actividadAEditar ? 'Editar Tarea' : 'Nueva Tarea'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setModalTareaOpen(false);
                  setActividadAEditar(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Descripción de la tarea */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={tareaForm.contenido}
                  onChange={(e) => setTareaForm(prev => ({ ...prev, contenido: e.target.value }))}
                  placeholder="¿Qué necesitas hacer?"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>

              {/* Fecha de vencimiento */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  <HiCalendar className="inline w-4 h-4 mr-1" />
                  Fecha de vencimiento <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <DatePicker
                    value={tareaForm.fechaVencimiento.split('T')[0] || ''}
                    onChange={(dateStr: string) => {
                      const currentTime = tareaForm.fechaVencimiento.split('T')[1] || '17:00';
                      setTareaForm(prev => ({
                        ...prev,
                        fechaVencimiento: `${dateStr}T${currentTime}`
                      }));
                    }}
                    placeholder="Fecha"
                    accentColor="yellow"
                  />
                  <TimePicker
                    value={tareaForm.fechaVencimiento.split('T')[1] || ''}
                    onChange={(timeStr: string) => {
                      const dateStr = tareaForm.fechaVencimiento.split('T')[0] || new Date().toISOString().split('T')[0];
                      setTareaForm(prev => ({
                        ...prev,
                        fechaVencimiento: `${dateStr}T${timeStr}`
                      }));
                    }}
                    placeholder="Hora"
                    accentColor="yellow"
                  />
                </div>
              </div>

              {/* Creador de la tarea */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <HiUser className="inline w-4 h-4 mr-1" />
                  Creada por
                </label>
                <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-white text-sm font-bold">
                    {currentUser?.nombre?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {currentUser?.nombre || 'Usuario actual'}
                    </p>
                    <p className="text-xs text-neutral-500">{currentUser?.correo}</p>
                  </div>
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded-full">
                    Tú
                  </span>
                </div>
              </div>

              {/* Asignar a usuario */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <HiUserGroup className="inline w-4 h-4 mr-1" />
                  Asignar a
                </label>
                <select
                  value={tareaForm.asignadaA}
                  onChange={(e) => setTareaForm(prev => ({ ...prev, asignadaA: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Yo mismo ({currentUser?.nombre})</option>
                  {usuarios.filter(u => u.id !== currentUser?.id).map(user => (
                    <option key={user.id} value={user.id}>
                      {user.nombre} ({user.correo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setModalTareaOpen(false);
                  setActividadAEditar(null);
                }}
                disabled={savingTarea}
                className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrearTarea}
                disabled={savingTarea || !tareaForm.contenido.trim() || !tareaForm.fechaVencimiento}
                className="flex-1 px-4 py-2.5 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {savingTarea && <CgSpinner className="w-4 h-4 animate-spin" />}
                {actividadAEditar ? 'Guardar Cambios' : 'Crear Tarea'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Completar/Descompletar */}
      {confirmCompletarOpen && actividadACompletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                actividadACompletar.completada
                  ? 'bg-yellow-100 dark:bg-yellow-900/30'
                  : 'bg-green-100 dark:bg-green-900/30'
              }`}>
                {actividadACompletar.completada ? (
                  <HiXCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <HiCheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                {actividadACompletar.completada
                  ? `¿Desmarcar ${actividadACompletar.tipo === TipoActividadEnum.REUNION ? 'reunión' : 'tarea'}?`
                  : `¿Marcar ${actividadACompletar.tipo === TipoActividadEnum.REUNION ? 'reunión como realizada' : 'tarea como completada'}?`
                }
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                {actividadACompletar.completada
                  ? `La ${actividadACompletar.tipo === TipoActividadEnum.REUNION ? 'reunión' : 'tarea'} volverá a estar pendiente.`
                  : actividadACompletar.tipo === TipoActividadEnum.REUNION
                    ? 'Se marcará la reunión como realizada.'
                    : 'Se marcará la tarea como completada.'
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmCompletarOpen(false);
                    setActividadACompletar(null);
                  }}
                  disabled={completingTarea === actividadACompletar.id}
                  className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarCompletar}
                  disabled={completingTarea === actividadACompletar.id}
                  className={`flex-1 px-4 py-2.5 text-sm text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium ${
                    actividadACompletar.completada
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {completingTarea === actividadACompletar.id && <CgSpinner className="w-4 h-4 animate-spin" />}
                  {actividadACompletar.completada ? 'Desmarcar' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {confirmDeleteOpen && actividadAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <HiTrash className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                ¿Eliminar actividad?
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
                Esta acción no se puede deshacer. Se eliminará permanentemente esta{' '}
                <span className="font-medium">
                  {TIPOS_ACTIVIDAD_CONFIG[actividadAEliminar.tipo]?.label.toLowerCase() || 'actividad'}
                </span>
                .
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmDeleteOpen(false);
                    setActividadAEliminar(null);
                  }}
                  disabled={deletingActividad}
                  className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarActividad}
                  disabled={deletingActividad}
                  className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                >
                  {deletingActividad && <CgSpinner className="w-4 h-4 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
