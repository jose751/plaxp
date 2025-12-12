import { useState, useEffect, useRef } from 'react';
import { FaPhone, FaEnvelope, FaWhatsapp, FaCalendarAlt, FaClipboard, FaStickyNote, FaBell, FaClock, FaSearch } from 'react-icons/fa';
import { HiX, HiChevronLeft, HiChevronRight, HiCheck, HiChevronDown } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { crearActividadApi, actualizarActividadApi, crearRecordatorioApi } from '../api/crmApi';
import type { CrmActividad, TipoActividad } from '../types/crm.types';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

// Opciones de recordatorio integrado (estilo HubSpot/Salesforce)
const OPCIONES_RECORDATORIO = [
  { value: 'none', label: 'Sin recordatorio', minutos: null },
  { value: 'at_time', label: 'Al momento', minutos: 0 },
  { value: '15min', label: '15 minutos antes', minutos: 15 },
  { value: '30min', label: '30 minutos antes', minutos: 30 },
  { value: '1hour', label: '1 hora antes', minutos: 60 },
  { value: '1day', label: '1 día antes', minutos: 1440 },
  { value: '1week', label: '1 semana antes', minutos: 10080 },
];

interface ActividadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (actividad: CrmActividad, isEdit: boolean, crearSeguimiento?: { fecha: string; hora: string }) => void;
  leadId: string;
  usuarios: Usuario[];
  actividad?: CrmActividad | null;
  tipoInicial?: TipoActividad;
}

const TIPOS_ACTIVIDAD: { tipo: TipoActividad; label: string; icon: React.ReactNode; requiereFecha: boolean }[] = [
  { tipo: 'NOTA', label: 'Nota', icon: <FaStickyNote />, requiereFecha: false },
  { tipo: 'LLAMADA', label: 'Llamada', icon: <FaPhone />, requiereFecha: false },
  { tipo: 'CORREO', label: 'Correo', icon: <FaEnvelope />, requiereFecha: false },
  { tipo: 'WHATSAPP', label: 'WhatsApp', icon: <FaWhatsapp />, requiereFecha: false },
  { tipo: 'REUNION', label: 'Reunión', icon: <FaCalendarAlt />, requiereFecha: true },
  { tipo: 'TAREA', label: 'Tarea', icon: <FaClipboard />, requiereFecha: true },
];

// Helpers para convertir hora 24h <-> 12h
const convertir24a12 = (hora24: string): { hora: string; minutos: string; periodo: 'AM' | 'PM' } => {
  const [h, m] = hora24.split(':');
  let hora = parseInt(h);
  const periodo: 'AM' | 'PM' = hora >= 12 ? 'PM' : 'AM';
  if (hora === 0) hora = 12;
  else if (hora > 12) hora -= 12;
  return { hora: String(hora), minutos: m, periodo };
};

const convertir12a24 = (hora: string, minutos: string, periodo: 'AM' | 'PM'): string => {
  let h = parseInt(hora) || 0;
  if (periodo === 'AM' && h === 12) h = 0;
  else if (periodo === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${String(parseInt(minutos) || 0).padStart(2, '0')}`;
};


// Opciones de duración
const DURACIONES = [
  { label: '15m', minutos: 15 },
  { label: '30m', minutos: 30 },
  { label: '1h', minutos: 60 },
  { label: '2h', minutos: 120 },
];

const DIAS_SEMANA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Helpers
const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const toISOString = (fecha: string, hora: string): string => {
  if (!fecha || !hora) return '';
  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = hora.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return date.toISOString();
};

const fromISOString = (isoDate: string): { fecha: string; hora: string } => {
  if (!isoDate) return { fecha: '', hora: '' };
  const date = new Date(isoDate);
  return {
    fecha: formatDateKey(date),
    hora: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  };
};

const addMinutes = (fecha: string, hora: string, minutos: number): { fecha: string; hora: string } => {
  if (!fecha || !hora) return { fecha: '', hora: '' };
  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = hora.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes + minutos);
  return {
    fecha: formatDateKey(date),
    hora: `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  };
};

export const ActividadFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  usuarios,
  actividad,
  tipoInicial = 'NOTA',
}: ActividadFormModalProps) => {
  const [tipo, setTipo] = useState<TipoActividad>(tipoInicial);
  const [contenido, setContenido] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [duracion, setDuracion] = useState(30);
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mesActual, setMesActual] = useState(new Date());

  // Estado para recordatorio integrado (solo para tareas/reuniones)
  const [recordatorioOpcion, setRecordatorioOpcion] = useState<string>('none');
  const [showRecordatorioDropdown, setShowRecordatorioDropdown] = useState(false);
  const recordatorioRef = useRef<HTMLDivElement>(null);

  // Estado para buscador de usuarios
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const usuariosRef = useRef<HTMLDivElement>(null);

  // Estado para crear seguimiento (después de guardar)
  const [crearSeguimiento, setCrearSeguimiento] = useState(false);
  const [seguimientoFecha, setSeguimientoFecha] = useState('');
  const [mesSeguimiento, setMesSeguimiento] = useState(new Date());

  // Estados para inputs de hora (texto libre)
  const [horaInputs, setHoraInputs] = useState({ hora: '9', minutos: '00', periodo: 'AM' as 'AM' | 'PM' });
  const [seguimientoHoraInputs, setSeguimientoHoraInputs] = useState({ hora: '9', minutos: '00', periodo: 'AM' as 'AM' | 'PM' });

  const isEditing = !!actividad;
  const tipoConfig = TIPOS_ACTIVIDAD.find(t => t.tipo === tipo) || TIPOS_ACTIVIDAD[0];

  const hoy = new Date();
  const hoyKey = formatDateKey(hoy);

  // Cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (recordatorioRef.current && !recordatorioRef.current.contains(event.target as Node)) {
        setShowRecordatorioDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar usuarios por búsqueda
  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
    u.correo.toLowerCase().includes(busquedaUsuario.toLowerCase())
  );

  // Obtener usuarios seleccionados
  const usuariosSeleccionados = usuarios.filter(u => participantes.includes(u.id));

  useEffect(() => {
    if (isOpen) {
      if (actividad) {
        setTipo(actividad.tipo);
        setContenido(actividad.contenido);
        const inicio = fromISOString(actividad.fechaInicio);
        setFechaInicio(inicio.fecha);
        setHoraInicio(inicio.hora);
        // Convertir hora 24h a inputs 12h
        const horaData = convertir24a12(inicio.hora);
        setHoraInputs({ hora: horaData.hora, minutos: horaData.minutos, periodo: horaData.periodo });
        if (actividad.fechaInicio && actividad.fechaFin) {
          const diff = (new Date(actividad.fechaFin).getTime() - new Date(actividad.fechaInicio).getTime()) / 60000;
          setDuracion(diff > 0 ? diff : 60);
        }
        setParticipantes(actividad.participantes?.map(p => p.usuarioId) || []);
      } else {
        setTipo(tipoInicial);
        setContenido('');
        setFechaInicio(hoyKey);
        setHoraInicio('09:00');
        setHoraInputs({ hora: '9', minutos: '00', periodo: 'AM' });
        setDuracion(30);
        setParticipantes([]);
      }
      setMesActual(new Date());
      // Reset estados de recordatorio, seguimiento y búsqueda
      setRecordatorioOpcion('none');
      setCrearSeguimiento(false);
      setBusquedaUsuario('');
      // Fecha de seguimiento por defecto: mañana
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      setSeguimientoFecha(formatDateKey(manana));
      setSeguimientoHoraInputs({ hora: '9', minutos: '00', periodo: 'AM' });
      setMesSeguimiento(new Date());
    }
  }, [isOpen, actividad, tipoInicial, hoyKey]);

  const toggleParticipante = (usuarioId: string) => {
    setParticipantes(prev =>
      prev.includes(usuarioId)
        ? prev.filter(id => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  const handleSave = async () => {
    if (!contenido.trim()) return;

    // Validar y convertir hora de los inputs
    let horaFinal = horaInicio;
    if (tipoConfig.requiereFecha) {
      const h = parseInt(horaInputs.hora) || 12;
      const m = parseInt(horaInputs.minutos) || 0;
      const horaValidada = h < 1 ? 1 : h > 12 ? 12 : h;
      const minutosValidados = m < 0 ? 0 : m > 59 ? 59 : m;
      horaFinal = convertir12a24(String(horaValidada), String(minutosValidados).padStart(2, '0'), horaInputs.periodo);

      if (!fechaInicio) {
        alert('Las tareas y reuniones requieren fecha');
        return;
      }
    }

    // Validar hora de seguimiento si está activo
    let seguimientoHoraFinal = '';
    if (crearSeguimiento && seguimientoFecha) {
      const h = parseInt(seguimientoHoraInputs.hora) || 9;
      const m = parseInt(seguimientoHoraInputs.minutos) || 0;
      const horaValidada = h < 1 ? 1 : h > 12 ? 12 : h;
      const minutosValidados = m < 0 ? 0 : m > 59 ? 59 : m;
      seguimientoHoraFinal = convertir12a24(String(horaValidada), String(minutosValidados).padStart(2, '0'), seguimientoHoraInputs.periodo);
    }

    setSaving(true);
    try {
      const fechaInicioISO = toISOString(fechaInicio, horaFinal);
      const fin = addMinutes(fechaInicio, horaFinal, duracion);
      const fechaFinISO = toISOString(fin.fecha, fin.hora);

      let actividadGuardada: CrmActividad | null = null;

      if (isEditing && actividad) {
        const response = await actualizarActividadApi(actividad.id, {
          tipo,
          contenido: contenido.trim(),
          fechaInicio: fechaInicioISO || undefined,
          fechaFin: fechaFinISO || undefined,
          participantesUsuarioIds: participantes,
        });

        if (response.success) {
          actividadGuardada = response.data;
        }
      } else {
        const response = await crearActividadApi(leadId, {
          tipo,
          contenido: contenido.trim(),
          fechaInicio: fechaInicioISO || undefined,
          fechaFin: fechaFinISO || undefined,
          participantesUsuarioIds: participantes.length > 0 ? participantes : undefined,
        });

        if (response.success) {
          actividadGuardada = response.data;
        }
      }

      // Si se guardó la actividad exitosamente
      if (actividadGuardada) {
        // Crear recordatorio integrado si se seleccionó uno (solo para tareas/reuniones)
        if (tipoConfig.requiereFecha && recordatorioOpcion !== 'none') {
          const opcion = OPCIONES_RECORDATORIO.find(o => o.value === recordatorioOpcion);
          if (opcion && opcion.minutos !== null) {
            // Calcular fecha/hora del recordatorio restando los minutos
            const fechaTarea = new Date(fechaInicioISO);
            const fechaRecordatorio = new Date(fechaTarea.getTime() - opcion.minutos * 60 * 1000);

            try {
              await crearRecordatorioApi({
                leadId,
                titulo: `Recordatorio: ${tipoConfig.label}`,
                descripcion: contenido.trim().substring(0, 100),
                fechaProgramada: fechaRecordatorio.toISOString(),
              });
            } catch (err) {
              console.error('Error creando recordatorio:', err);
              // No bloqueamos el guardado si falla el recordatorio
            }
          }
        }

        // Pasar información de seguimiento si se marcó
        const seguimientoData = crearSeguimiento && seguimientoFecha
          ? { fecha: seguimientoFecha, hora: seguimientoHoraFinal }
          : undefined;

        onSuccess(actividadGuardada, isEditing, seguimientoData);
        onClose();
      }
    } catch (err) {
      console.error('Error guardando actividad:', err);
    } finally {
      setSaving(false);
    }
  };

  // Obtener label de la opción de recordatorio seleccionada
  const getRecordatorioLabel = () => {
    const opcion = OPCIONES_RECORDATORIO.find(o => o.value === recordatorioOpcion);
    return opcion?.label || 'Sin recordatorio';
  };

  // Generar días del calendario (solo 35 días para hacerlo más compacto)
  const generarDiasCalendario = () => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias: { fecha: string; dia: number; esOtroMes: boolean; esHoy: boolean; esPasado: boolean }[] = [];

    const mesAnterior = new Date(year, month, 0);
    const diasMesAnterior = mesAnterior.getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const fecha = formatDateKey(new Date(year, month - 1, dia));
      dias.push({ fecha, dia, esOtroMes: true, esHoy: false, esPasado: true });
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = formatDateKey(new Date(year, month, dia));
      const esHoy = fecha === hoyKey;
      const esPasado = new Date(year, month, dia) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      dias.push({ fecha, dia, esOtroMes: false, esHoy, esPasado });
    }

    const diasRestantes = 35 - dias.length;
    for (let dia = 1; dia <= diasRestantes && dia <= 7; dia++) {
      const fecha = formatDateKey(new Date(year, month + 1, dia));
      dias.push({ fecha, dia, esOtroMes: true, esHoy: false, esPasado: false });
    }

    return dias.slice(0, 35);
  };

  // Generar días del calendario de seguimiento
  const generarDiasSeguimiento = () => {
    const year = mesSeguimiento.getFullYear();
    const month = mesSeguimiento.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias: { fecha: string; dia: number; esOtroMes: boolean; esHoy: boolean; esPasado: boolean }[] = [];

    const mesAnterior = new Date(year, month, 0);
    const diasMesAnterior = mesAnterior.getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const fecha = formatDateKey(new Date(year, month - 1, dia));
      dias.push({ fecha, dia, esOtroMes: true, esHoy: false, esPasado: true });
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = formatDateKey(new Date(year, month, dia));
      const esHoy = fecha === hoyKey;
      const esPasado = new Date(year, month, dia) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      dias.push({ fecha, dia, esOtroMes: false, esHoy, esPasado });
    }

    const diasRestantes = 35 - dias.length;
    for (let dia = 1; dia <= diasRestantes && dia <= 7; dia++) {
      const fecha = formatDateKey(new Date(year, month + 1, dia));
      dias.push({ fecha, dia, esOtroMes: true, esHoy: false, esPasado: false });
    }

    return dias.slice(0, 35);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border overflow-hidden flex flex-col w-full ${tipoConfig.requiereFecha ? 'max-w-4xl' : 'max-w-2xl'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {isEditing ? 'Editar' : 'Agregar'} {tipoConfig.label}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className={`p-6 ${tipoConfig.requiereFecha ? 'flex gap-6' : ''}`}>
          {/* Columna izquierda - Contenido principal */}
          <div className={`space-y-5 ${tipoConfig.requiereFecha ? 'flex-1' : ''}`}>
            {/* Fila superior: Tipo + Asignar a (horizontal) */}
            <div className="flex gap-6">
              {/* Selector de tipo */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2.5">
                  Tipo
                </label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_ACTIVIDAD.map(({ tipo: t, label, icon }) => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                        ${tipo === t
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-neutral-200 dark:border-dark-border text-neutral-500 dark:text-neutral-400 hover:border-primary/50 hover:bg-neutral-50 dark:hover:bg-dark-hover'
                        }`}
                    >
                      {icon}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Asignar a usuarios - Estilo Slack con checkboxes */}
              <div className="w-80" ref={usuariosRef}>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2.5">
                  Asignar a
                  {usuariosSeleccionados.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      {usuariosSeleccionados.length} seleccionado{usuariosSeleccionados.length > 1 ? 's' : ''}
                    </span>
                  )}
                </label>

                <div className="border border-neutral-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-card">
                  {/* Input de búsqueda */}
                  <div className="p-2 border-b border-neutral-200 dark:border-dark-border">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="text"
                        value={busquedaUsuario}
                        onChange={(e) => setBusquedaUsuario(e.target.value)}
                        placeholder="Buscar usuarios..."
                        className="w-full pl-9 pr-3 py-2 rounded-md border-0 bg-neutral-100 dark:bg-dark-bg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-neutral-400"
                      />
                    </div>
                  </div>

                  {/* Lista de todos los usuarios con checkboxes */}
                  <div className="max-h-44 overflow-y-auto">
                    {usuariosFiltrados.length > 0 ? (
                      usuariosFiltrados.map(usuario => {
                        const isSelected = participantes.includes(usuario.id);
                        return (
                          <label
                            key={usuario.id}
                            className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors border-b border-neutral-100 dark:border-dark-border last:border-b-0 ${
                              isSelected
                                ? 'bg-primary/5 dark:bg-primary/10'
                                : 'hover:bg-neutral-50 dark:hover:bg-dark-hover'
                            }`}
                          >
                            {/* Checkbox personalizado */}
                            <div className="relative flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleParticipante(usuario.id)}
                                className="sr-only"
                              />
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-neutral-300 dark:border-neutral-600'
                              }`}>
                                {isSelected && (
                                  <HiCheck className="w-3.5 h-3.5 text-white" />
                                )}
                              </div>
                            </div>

                            {/* Avatar */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                              isSelected
                                ? 'bg-primary text-white'
                                : 'bg-neutral-200 dark:bg-dark-hover text-neutral-600 dark:text-neutral-400'
                            }`}>
                              {usuario.nombre.charAt(0).toUpperCase()}
                            </div>

                            {/* Info del usuario */}
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium truncate ${
                                isSelected ? 'text-primary' : 'text-neutral-800 dark:text-neutral-200'
                              }`}>
                                {usuario.nombre}
                              </div>
                              <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                {usuario.correo}
                              </div>
                            </div>

                            {/* Indicador de estado */}
                            {isSelected && (
                              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary"></span>
                            )}
                          </label>
                        );
                      })
                    ) : (
                      <div className="px-3 py-6 text-sm text-neutral-400 text-center">
                        No se encontraron usuarios
                      </div>
                    )}
                  </div>

                  {/* Footer con seleccionados */}
                  {usuariosSeleccionados.length > 0 && (
                    <div className="px-3 py-2 bg-neutral-50 dark:bg-dark-bg border-t border-neutral-200 dark:border-dark-border">
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {usuariosSeleccionados.slice(0, 4).map(usuario => (
                            <div
                              key={usuario.id}
                              className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-semibold ring-2 ring-white dark:ring-dark-bg"
                              title={usuario.nombre}
                            >
                              {usuario.nombre.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {usuariosSeleccionados.length > 4 && (
                            <div className="w-6 h-6 rounded-full bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 flex items-center justify-center text-[10px] font-semibold ring-2 ring-white dark:ring-dark-bg">
                              +{usuariosSeleccionados.length - 4}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setParticipantes([])}
                          className="text-xs text-neutral-500 hover:text-red-500 transition-colors"
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fila inferior: Contenido + Seguimiento (horizontal) */}
            <div className="flex gap-6 items-stretch">
              {/* Contenido - se adapta a la altura del seguimiento */}
              <div className="flex-1 flex flex-col">
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2.5">
                  Contenido
                </label>
                <textarea
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  className={`w-full flex-1 min-h-[120px] px-4 py-3 rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-sm text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none placeholder:text-neutral-400`}
                  placeholder="Escribe los detalles de la actividad aquí..."
                />
              </div>

              {/* Tarea de seguimiento - columna derecha */}
              {!isEditing && (
                <div className="w-56 flex-shrink-0">
                  <label className="flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={crearSeguimiento}
                      onChange={(e) => setCrearSeguimiento(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 dark:border-dark-border text-primary focus:ring-primary/30"
                    />
                    <span className="group-hover:text-primary transition-colors">Seguimiento</span>
                  </label>

                  {crearSeguimiento ? (
                    <div className="border border-neutral-200 dark:border-dark-border rounded-lg overflow-hidden bg-white dark:bg-dark-card">
                      {/* Mini calendario */}
                      <div className="p-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <button
                            type="button"
                            onClick={() => setMesSeguimiento(new Date(mesSeguimiento.getFullYear(), mesSeguimiento.getMonth() - 1))}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                          >
                            <HiChevronLeft className="w-3.5 h-3.5 text-neutral-400" />
                          </button>
                          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                            {MESES[mesSeguimiento.getMonth()].slice(0, 3)} {mesSeguimiento.getFullYear()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setMesSeguimiento(new Date(mesSeguimiento.getFullYear(), mesSeguimiento.getMonth() + 1))}
                            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                          >
                            <HiChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-0.5">
                          {DIAS_SEMANA.map(d => (
                            <div key={d} className="w-6 h-5 flex items-center justify-center text-[9px] font-medium text-neutral-400">
                              {d}
                            </div>
                          ))}
                          {generarDiasSeguimiento().map((cell, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                if (!cell.esPasado || cell.esHoy) {
                                  setSeguimientoFecha(cell.fecha);
                                }
                              }}
                              disabled={cell.esPasado && !cell.esHoy}
                              className={`
                                w-6 h-6 flex items-center justify-center text-[10px] font-medium rounded transition-all
                                ${cell.esOtroMes ? 'text-neutral-300 dark:text-neutral-600' : ''}
                                ${cell.esPasado && !cell.esHoy ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed' : ''}
                                ${!cell.esOtroMes && !cell.esPasado && !cell.esHoy && cell.fecha !== seguimientoFecha ? 'text-neutral-600 dark:text-neutral-400 hover:bg-primary/10' : ''}
                                ${cell.esHoy && cell.fecha !== seguimientoFecha ? 'text-primary font-bold' : ''}
                                ${cell.fecha === seguimientoFecha ? 'bg-primary text-white' : ''}
                              `}
                            >
                              {cell.dia}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Hora - Input libre compacto */}
                      <div className="p-2 border-t border-neutral-100 dark:border-dark-border">
                        <div className="flex items-center gap-1">
                          {/* Hora */}
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={seguimientoHoraInputs.hora}
                            onChange={(e) => setSeguimientoHoraInputs(prev => ({ ...prev, hora: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                            className="w-10 px-1 py-1.5 text-center text-xs font-semibold rounded border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            placeholder="9"
                          />

                          <span className="text-neutral-400 text-xs font-bold">:</span>

                          {/* Minutos */}
                          <input
                            type="text"
                            inputMode="numeric"
                            maxLength={2}
                            value={seguimientoHoraInputs.minutos}
                            onChange={(e) => setSeguimientoHoraInputs(prev => ({ ...prev, minutos: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                            className="w-10 px-1 py-1.5 text-center text-xs font-semibold rounded border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-primary/30"
                            placeholder="00"
                          />

                          {/* AM/PM */}
                          <div className="flex rounded border border-neutral-200 dark:border-dark-border overflow-hidden ml-1">
                            <button
                              type="button"
                              onClick={() => setSeguimientoHoraInputs(prev => ({ ...prev, periodo: 'AM' }))}
                              className={`px-2 py-1.5 text-[10px] font-bold transition-all ${
                                seguimientoHoraInputs.periodo === 'AM'
                                  ? 'bg-primary text-white'
                                  : 'bg-white dark:bg-dark-bg text-neutral-400 hover:bg-neutral-100'
                              }`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => setSeguimientoHoraInputs(prev => ({ ...prev, periodo: 'PM' }))}
                              className={`px-2 py-1.5 text-[10px] font-bold border-l border-neutral-200 dark:border-dark-border transition-all ${
                                seguimientoHoraInputs.periodo === 'PM'
                                  ? 'bg-primary text-white'
                                  : 'bg-white dark:bg-dark-bg text-neutral-400 hover:bg-neutral-100'
                              }`}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Resumen */}
                      {seguimientoFecha && (
                        <div className="px-2 py-1.5 bg-primary/5 text-center">
                          <span className="text-[10px] text-primary font-semibold">
                            {new Date(seguimientoFecha + 'T00:00:00').toLocaleDateString('es-ES', {
                              weekday: 'short',
                              day: 'numeric',
                              month: 'short'
                            })} - {seguimientoHoraInputs.hora || '9'}:{seguimientoHoraInputs.minutos || '00'} {seguimientoHoraInputs.periodo}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-32 border border-dashed border-neutral-200 dark:border-dark-border rounded-lg flex items-center justify-center">
                      <p className="text-xs text-neutral-400 text-center px-4">
                        Activa para programar una tarea de seguimiento
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Columna derecha - Fecha y hora (solo si requiere fecha) */}
          {tipoConfig.requiereFecha && (
            <div className="w-80 flex-shrink-0 space-y-4 border-l border-neutral-200 dark:border-dark-border pl-6">
              {/* Calendario compacto */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Fecha
                </label>
                <div className="flex items-center justify-between mb-2">
                  <button
                    onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                  >
                    <HiChevronLeft className="w-4 h-4 text-neutral-500" />
                  </button>
                  <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                    {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                  </span>
                  <button
                    onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                  >
                    <HiChevronRight className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {DIAS_SEMANA.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-neutral-400 py-1">
                      {d}
                    </div>
                  ))}
                  {generarDiasCalendario().map((cell, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        if (!cell.esPasado || cell.esHoy) {
                          setFechaInicio(cell.fecha);
                        }
                      }}
                      disabled={cell.esPasado && !cell.esHoy}
                      className={`
                        aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                        ${cell.esOtroMes ? 'text-neutral-300 dark:text-neutral-700' : ''}
                        ${cell.esPasado && !cell.esHoy ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed' : ''}
                        ${!cell.esOtroMes && !cell.esPasado && !cell.esHoy && cell.fecha !== fechaInicio ? 'text-neutral-600 dark:text-neutral-400 hover:bg-primary/10' : ''}
                        ${cell.esHoy && cell.fecha !== fechaInicio ? 'text-primary font-bold ring-1 ring-primary/30' : ''}
                        ${cell.fecha === fechaInicio ? 'bg-primary text-white' : ''}
                      `}
                    >
                      {cell.dia}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hora - Input libre */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Hora
                </label>
                <div className="flex items-center gap-2">
                  {/* Hora */}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={horaInputs.hora}
                    onChange={(e) => setHoraInputs(prev => ({ ...prev, hora: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    className="w-14 px-2 py-2.5 text-center text-sm font-semibold rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="9"
                  />

                  <span className="text-neutral-400 font-bold text-lg">:</span>

                  {/* Minutos */}
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={horaInputs.minutos}
                    onChange={(e) => setHoraInputs(prev => ({ ...prev, minutos: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    className="w-14 px-2 py-2.5 text-center text-sm font-semibold rounded-lg border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    placeholder="00"
                  />

                  {/* AM/PM */}
                  <div className="flex rounded-lg border border-neutral-200 dark:border-dark-border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setHoraInputs(prev => ({ ...prev, periodo: 'AM' }))}
                      className={`px-3 py-2.5 text-xs font-bold transition-all ${
                        horaInputs.periodo === 'AM'
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-dark-bg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-hover'
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoraInputs(prev => ({ ...prev, periodo: 'PM' }))}
                      className={`px-3 py-2.5 text-xs font-bold border-l border-neutral-200 dark:border-dark-border transition-all ${
                        horaInputs.periodo === 'PM'
                          ? 'bg-primary text-white'
                          : 'bg-white dark:bg-dark-bg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-dark-hover'
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
              </div>

              {/* Duración */}
              <div>
                <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Duración
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {DURACIONES.map(d => (
                    <button
                      key={d.minutos}
                      type="button"
                      onClick={() => setDuracion(d.minutos)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        duracion === d.minutos
                          ? 'bg-primary text-white'
                          : 'bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recordatorio integrado */}
              {!isEditing && (
                <div className="relative" ref={recordatorioRef}>
                  <label className="block text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                    <FaBell className="inline w-3.5 h-3.5 mr-1.5" />
                    Recordarme
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowRecordatorioDropdown(!showRecordatorioDropdown)}
                    className={`w-full px-4 py-2.5 rounded-lg border text-left text-sm font-medium flex items-center justify-between transition-all ${
                      recordatorioOpcion !== 'none'
                        ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300'
                        : 'bg-neutral-50 dark:bg-dark-bg border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-neutral-300'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {recordatorioOpcion !== 'none' && <FaClock className="w-3.5 h-3.5" />}
                      {getRecordatorioLabel()}
                    </span>
                    <HiChevronDown className={`w-4 h-4 transition-transform ${showRecordatorioDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showRecordatorioDropdown && (
                    <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border z-50 py-1.5 max-h-48 overflow-y-auto">
                      {OPCIONES_RECORDATORIO.map(opcion => (
                        <button
                          key={opcion.value}
                          type="button"
                          onClick={() => {
                            setRecordatorioOpcion(opcion.value);
                            setShowRecordatorioDropdown(false);
                          }}
                          className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-2 transition-colors ${
                            recordatorioOpcion === opcion.value
                              ? 'bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-300'
                              : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover'
                          }`}
                        >
                          {recordatorioOpcion === opcion.value && <HiCheck className="w-4 h-4 text-sky-600" />}
                          <span className={recordatorioOpcion === opcion.value ? 'font-medium' : ''}>{opcion.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Footer */}
        <div className="flex gap-4 px-6 py-4 border-t border-neutral-200 dark:border-dark-border flex-shrink-0 bg-neutral-50 dark:bg-dark-bg">
          <button
            onClick={onClose}
            className="flex-1 px-5 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!contenido.trim() || saving || (tipoConfig.requiereFecha && (!fechaInicio || !horaInicio))}
            className="flex-1 px-5 py-2.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-sm"
          >
            {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
