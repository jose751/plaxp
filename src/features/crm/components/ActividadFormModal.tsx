import { useState, useEffect } from 'react';
import { FaPhone, FaEnvelope, FaWhatsapp, FaCalendarAlt, FaClipboard, FaStickyNote } from 'react-icons/fa';
import { HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { crearActividadApi, actualizarActividadApi } from '../api/crmApi';
import type { CrmActividad, TipoActividad } from '../types/crm.types';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

interface ActividadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (actividad: CrmActividad, isEdit: boolean) => void;
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

// Opciones de hora comunes
const HORAS_RAPIDAS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

// Opciones de duración
const DURACIONES = [
  { label: '30 min', minutos: 30 },
  { label: '1 hora', minutos: 60 },
  { label: '1.5 horas', minutos: 90 },
  { label: '2 horas', minutos: 120 },
  { label: '3 horas', minutos: 180 },
];

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// Helpers
const formatDateKey = (date: Date): string => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const parseDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
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
  const [duracion, setDuracion] = useState(60); // minutos
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mesActual, setMesActual] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);

  const isEditing = !!actividad;
  const tipoConfig = TIPOS_ACTIVIDAD.find(t => t.tipo === tipo) || TIPOS_ACTIVIDAD[0];

  const hoy = new Date();
  const hoyKey = formatDateKey(hoy);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  const mananaKey = formatDateKey(manana);

  useEffect(() => {
    if (isOpen) {
      if (actividad) {
        setTipo(actividad.tipo);
        setContenido(actividad.contenido);
        const inicio = fromISOString(actividad.fechaInicio);
        setFechaInicio(inicio.fecha);
        setHoraInicio(inicio.hora);
        // Calcular duración si hay fecha fin
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
        setDuracion(60);
        setParticipantes([]);
      }
      setMesActual(new Date());
      setShowCalendar(false);
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

    if (tipoConfig.requiereFecha && (!fechaInicio || !horaInicio)) {
      alert('Las tareas y reuniones requieren fecha y hora');
      return;
    }

    setSaving(true);
    try {
      const fechaInicioISO = toISOString(fechaInicio, horaInicio);
      const fin = addMinutes(fechaInicio, horaInicio, duracion);
      const fechaFinISO = toISOString(fin.fecha, fin.hora);

      if (isEditing && actividad) {
        const response = await actualizarActividadApi(actividad.id, {
          tipo,
          contenido: contenido.trim(),
          fechaInicio: fechaInicioISO || undefined,
          fechaFin: fechaFinISO || undefined,
          participantesUsuarioIds: participantes,
        });

        if (response.success) {
          onSuccess(response.data, true);
          onClose();
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
          onSuccess(response.data, false);
          onClose();
        }
      }
    } catch (err) {
      console.error('Error guardando actividad:', err);
    } finally {
      setSaving(false);
    }
  };

  // Generar días del calendario
  const generarDiasCalendario = () => {
    const year = mesActual.getFullYear();
    const month = mesActual.getMonth();
    const primerDia = new Date(year, month, 1);
    const ultimoDia = new Date(year, month + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();

    const dias: { fecha: string; dia: number; esOtroMes: boolean; esHoy: boolean; esPasado: boolean }[] = [];

    // Días del mes anterior
    const mesAnterior = new Date(year, month, 0);
    const diasMesAnterior = mesAnterior.getDate();
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = diasMesAnterior - i;
      const fecha = formatDateKey(new Date(year, month - 1, dia));
      dias.push({ fecha, dia, esOtroMes: true, esHoy: false, esPasado: true });
    }

    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = formatDateKey(new Date(year, month, dia));
      const esHoy = fecha === hoyKey;
      const esPasado = new Date(year, month, dia) < new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      dias.push({ fecha, dia, esOtroMes: false, esHoy, esPasado });
    }

    // Días del mes siguiente
    const diasRestantes = 42 - dias.length;
    for (let dia = 1; dia <= diasRestantes; dia++) {
      const fecha = formatDateKey(new Date(year, month + 1, dia));
      dias.push({ fecha, dia, esOtroMes: true, esHoy: false, esPasado: false });
    }

    return dias;
  };

  const fechaSeleccionadaTexto = () => {
    if (!fechaInicio) return 'Seleccionar fecha';
    if (fechaInicio === hoyKey) return 'Hoy';
    if (fechaInicio === mananaKey) return 'Mañana';
    const date = parseDate(fechaInicio);
    if (!date) return fechaInicio;
    return `${DIAS_SEMANA[date.getDay()]} ${date.getDate()} ${MESES[date.getMonth()]}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {isEditing ? 'Editar' : 'Agregar'} {tipoConfig.label}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Selector de tipo */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Tipo de actividad
            </label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_ACTIVIDAD.map(({ tipo: t, label, icon }) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all
                    ${tipo === t
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
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              placeholder="Escribe los detalles de la actividad..."
            />
          </div>

          {/* Campos de fecha para Tareas y Reuniones */}
          {tipoConfig.requiereFecha && (
            <div className="space-y-4">
              {/* Selector de fecha */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Fecha
                </label>

                {/* Botones rápidos */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => { setFechaInicio(hoyKey); setShowCalendar(false); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border
                      ${fechaInicio === hoyKey
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-300 hover:border-primary'
                      }`}
                  >
                    Hoy
                  </button>
                  <button
                    onClick={() => { setFechaInicio(mananaKey); setShowCalendar(false); }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border
                      ${fechaInicio === mananaKey
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-300 hover:border-primary'
                      }`}
                  >
                    Mañana
                  </button>
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border flex items-center justify-center gap-2
                      ${showCalendar || (fechaInicio !== hoyKey && fechaInicio !== mananaKey && fechaInicio)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-300 hover:border-primary'
                      }`}
                  >
                    <FaCalendarAlt className="w-3.5 h-3.5" />
                    {fechaInicio && fechaInicio !== hoyKey && fechaInicio !== mananaKey
                      ? fechaSeleccionadaTexto()
                      : 'Elegir'}
                  </button>
                </div>

                {/* Calendario desplegable */}
                {showCalendar && (
                  <div className="bg-neutral-50 dark:bg-dark-bg rounded-xl border border-neutral-200 dark:border-dark-border p-3">
                    {/* Header del calendario */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                        className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-dark-hover transition-colors"
                      >
                        <HiChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </button>
                      <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                        {MESES[mesActual.getMonth()]} {mesActual.getFullYear()}
                      </span>
                      <button
                        onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                        className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-dark-hover transition-colors"
                      >
                        <HiChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                      </button>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 mb-1">
                      {DIAS_SEMANA.map(d => (
                        <div key={d} className="text-center text-[10px] font-semibold text-neutral-400 py-1">
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Días */}
                    <div className="grid grid-cols-7 gap-0.5">
                      {generarDiasCalendario().map((cell, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (!cell.esPasado || cell.esHoy) {
                              setFechaInicio(cell.fecha);
                              setShowCalendar(false);
                            }
                          }}
                          disabled={cell.esPasado && !cell.esHoy}
                          className={`
                            aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                            ${cell.esOtroMes ? 'text-neutral-300 dark:text-neutral-700' : ''}
                            ${cell.esPasado && !cell.esHoy ? 'text-neutral-300 dark:text-neutral-700 cursor-not-allowed' : ''}
                            ${!cell.esOtroMes && !cell.esPasado && !cell.esHoy && cell.fecha !== fechaInicio ? 'text-neutral-700 dark:text-neutral-300 hover:bg-primary/10' : ''}
                            ${cell.esHoy && cell.fecha !== fechaInicio ? 'text-primary font-bold' : ''}
                            ${cell.fecha === fechaInicio ? 'bg-primary text-white' : ''}
                          `}
                        >
                          {cell.dia}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de hora */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Hora de inicio
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {HORAS_RAPIDAS.map(hora => (
                    <button
                      key={hora}
                      onClick={() => setHoraInicio(hora)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                        ${horaInicio === hora
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-primary'
                        }`}
                    >
                      {hora}
                    </button>
                  ))}
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* Selector de duración */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Duración
                </label>
                <div className="flex flex-wrap gap-2">
                  {DURACIONES.map(d => (
                    <button
                      key={d.minutos}
                      onClick={() => setDuracion(d.minutos)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border
                        ${duracion === d.minutos
                          ? 'bg-primary text-white border-primary'
                          : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-primary'
                        }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              {fechaInicio && horaInicio && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
                  <p className="text-sm text-primary font-medium">
                    📅 {fechaSeleccionadaTexto()} a las {horaInicio} ({DURACIONES.find(d => d.minutos === duracion)?.label || `${duracion} min`})
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Asignar a usuarios */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Asignar a (opcional)
            </label>
            <div className="max-h-32 overflow-y-auto border border-neutral-300 dark:border-dark-border rounded-xl p-2 space-y-1">
              {usuarios.map(usuario => (
                <label
                  key={usuario.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={participantes.includes(usuario.id)}
                    onChange={() => toggleParticipante(usuario.id)}
                    className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {usuario.nombre}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border flex-shrink-0 bg-neutral-50 dark:bg-dark-bg">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!contenido.trim() || saving || (tipoConfig.requiereFecha && (!fechaInicio || !horaInicio))}
            className="flex-1 px-4 py-2.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};
