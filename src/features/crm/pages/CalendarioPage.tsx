import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  HiChevronLeft,
  HiChevronRight,
  HiCalendar,
  HiClock,
  HiUsers,
  HiPhone,
  HiMail,
  HiChat,
  HiVideoCamera,
  HiClipboardList,
  HiX,
  HiViewGrid,
  HiViewList,
  HiOutlineCalendar,
} from 'react-icons/hi';
import { obtenerMisPendientesApi } from '../api/crmApi';
import { listarUsuariosApi } from '../../users/api/UsersApi';
import type { CrmActividad, TipoActividad } from '../types/crm.types';
import { ActividadDetallesModal } from '../components/ActividadDetallesModal';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

interface ActividadConLead extends CrmActividad {
  leadInfo?: {
    id: string;
    contactoNombre: string;
    contactoApellido: string;
    etapaNombre: string;
  };
}

type VistaCalendario = 'mes' | 'semana' | 'dia' | 'agenda';

// Utilidades
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS_SEMANA_COMPLETOS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Colores por tipo de actividad - estilo moderno
const TIPO_CONFIG: Record<TipoActividad, { bg: string; bgLight: string; text: string; icon: typeof HiPhone; label: string }> = {
  NOTA: { bg: 'bg-amber-500', bgLight: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400', icon: HiClipboardList, label: 'Nota' },
  LLAMADA: { bg: 'bg-emerald-500', bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: HiPhone, label: 'Llamada' },
  CORREO: { bg: 'bg-blue-500', bgLight: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: HiMail, label: 'Correo' },
  WHATSAPP: { bg: 'bg-green-500', bgLight: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-600 dark:text-green-400', icon: HiChat, label: 'WhatsApp' },
  REUNION: { bg: 'bg-violet-500', bgLight: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', icon: HiVideoCamera, label: 'Reunión' },
  TAREA: { bg: 'bg-orange-500', bgLight: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', icon: HiClipboardList, label: 'Tarea' },
  CAMBIO_ETAPA: { bg: 'bg-slate-500', bgLight: 'bg-slate-50 dark:bg-slate-900/20', text: 'text-slate-600 dark:text-slate-400', icon: HiViewGrid, label: 'Cambio' },
};

export const CalendarioPage = () => {
  const today = new Date();

  // Estados
  const [actividades, setActividades] = useState<ActividadConLead[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedUsuario, setSelectedUsuario] = useState<string>('todos');
  const [vista, setVista] = useState<VistaCalendario>('mes');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showActividadModal, setShowActividadModal] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState<ActividadConLead | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [actividadesRes, usuariosRes] = await Promise.all([
          obtenerMisPendientesApi(),
          listarUsuariosApi({ estado: 'activo', pageSize: 100 })
        ]);

        if (actividadesRes.success) {
          setActividades(actividadesRes.data as ActividadConLead[]);
        }

        if (usuariosRes.success) {
          setUsuarios(usuariosRes.data.map((u: any) => ({
            id: u.id,
            nombre: u.nombre,
            correo: u.correo
          })));
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Filtrar actividades
  const actividadesFiltradas = useMemo(() => {
    if (selectedUsuario === 'todos') return actividades;
    return actividades.filter(a => a.participantes?.some(p => p.usuarioId === selectedUsuario));
  }, [actividades, selectedUsuario]);

  // Agrupar actividades por fecha
  const actividadesPorFecha = useMemo(() => {
    const map: Record<string, ActividadConLead[]> = {};
    actividadesFiltradas.forEach(actividad => {
      const fecha = new Date(actividad.fechaInicio);
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(actividad);
    });
    return map;
  }, [actividadesFiltradas]);

  // Navegación
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Mini calendario - generar días
  const miniCalendarDays = useMemo(() => {
    const days = [];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const key = `${year}-${month}-${day}`;
      const hasActividades = actividadesPorFecha[key]?.length > 0;
      const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

      days.push({ day, isCurrentMonth: true, isToday, hasActividades, isSelected });
    }

    return days;
  }, [year, month, actividadesPorFecha, today, selectedDate]);

  // Calendario principal - generar días
  const calendarDays = useMemo(() => {
    const days = [];
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    // Días del mes anterior
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, isCurrentMonth: false, actividades: [] });
    }

    // Días del mes actual
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const key = `${year}-${month}-${day}`;
      const dayActividades = actividadesPorFecha[key] || [];
      const isSelected = selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();

      days.push({ day, isCurrentMonth: true, isToday, isSelected, actividades: dayActividades });
    }

    // Días del mes siguiente para completar la grilla
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push({ day, isCurrentMonth: false, actividades: [] });
    }

    return days;
  }, [year, month, actividadesPorFecha, today, selectedDate]);

  // Actividades del día seleccionado
  const actividadesDelDia = useMemo(() => {
    if (!selectedDate) return [];
    const key = `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`;
    return actividadesPorFecha[key] || [];
  }, [selectedDate, actividadesPorFecha]);

  // Próximas actividades
  const proximasActividades = useMemo(() => {
    const ahora = new Date();
    return actividadesFiltradas
      .filter(a => new Date(a.fechaInicio) >= ahora)
      .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
      .slice(0, 5);
  }, [actividadesFiltradas]);

  // Formatear hora
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  // Abrir modal de actividad
  const handleVerActividad = (actividad: ActividadConLead) => {
    setActividadSeleccionada(actividad);
    setShowActividadModal(true);
  };

  // Obtener nombre del lead para mostrar en el modal
  const getLeadNombre = (actividad: ActividadConLead) => {
    if (actividad.leadInfo) {
      return `${actividad.leadInfo.contactoNombre} ${actividad.leadInfo.contactoApellido}`;
    }
    return 'Ver lead';
  };

  // Seleccionar día
  const handleDayClick = useCallback((day: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setSelectedDate(new Date(year, month, day));
  }, [year, month]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-900 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-neutral-600 dark:text-neutral-400 font-medium">Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
              <HiCalendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Calendario</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {MESES[month]} {year}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Selector de usuario */}
            <select
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-card text-sm text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
            >
              <option value="todos">Todos</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>

            {/* Selector de vista */}
            <div className="hidden md:flex items-center bg-neutral-100 dark:bg-dark-bg rounded-xl p-1">
              {(['mes', 'semana', 'agenda'] as VistaCalendario[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setVista(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    vista === v
                      ? 'bg-white dark:bg-dark-card text-violet-600 dark:text-violet-400 shadow-sm'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>

            {/* Botón Hoy */}
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-xl text-sm font-medium text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
            >
              Hoy
            </button>

            {/* Toggle Sidebar */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors lg:hidden"
            >
              <HiViewList className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Sidebar - Mini Calendario y Próximas Tareas */}
        <div className={`${showSidebar ? 'flex' : 'hidden'} lg:flex flex-col w-full lg:w-72 flex-shrink-0 gap-4`}>
          {/* Mini Calendario */}
          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
            <div className="p-4">
              {/* Navegación Mini */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={goToPrevMonth}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                >
                  <HiChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {MESES_CORTOS[month]} {year}
                </span>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                >
                  <HiChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 mb-2">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Días */}
              <div className="grid grid-cols-7 gap-0.5">
                {miniCalendarDays.map((cell, index) => (
                  <button
                    key={index}
                    onClick={() => cell.day && cell.isCurrentMonth && handleDayClick(cell.day, true)}
                    disabled={!cell.isCurrentMonth}
                    className={`
                      relative aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all
                      ${!cell.isCurrentMonth ? 'text-neutral-300 dark:text-neutral-700' : ''}
                      ${cell.isCurrentMonth && !cell.isToday && !cell.isSelected ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover' : ''}
                      ${cell.isToday && !cell.isSelected ? 'text-violet-600 dark:text-violet-400 font-bold' : ''}
                      ${cell.isSelected ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30' : ''}
                    `}
                  >
                    {cell.day}
                    {cell.hasActividades && !cell.isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-500"></span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Próximas Tareas */}
          <div className="flex-1 bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden flex flex-col min-h-0">
            <div className="p-4 border-b border-neutral-100 dark:border-dark-border flex-shrink-0">
              <h3 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <HiClock className="w-4 h-4 text-violet-500" />
                Próximas tareas
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {proximasActividades.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-dark-bg flex items-center justify-center mb-3">
                    <HiOutlineCalendar className="w-6 h-6 text-neutral-400" />
                  </div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Sin tareas pendientes</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {proximasActividades.map((actividad) => {
                    const config = TIPO_CONFIG[actividad.tipo];
                    const Icon = config.icon;
                    const fecha = new Date(actividad.fechaInicio);

                    return (
                      <button
                        key={actividad.id}
                        onClick={() => handleVerActividad(actividad)}
                        className={`w-full p-3 rounded-xl ${config.bgLight} border border-transparent hover:border-neutral-200 dark:hover:border-dark-border transition-all text-left group`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg ${config.bg} flex-shrink-0`}>
                            <Icon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 dark:text-white truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {actividad.contenido}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} · {formatTime(actividad.fechaInicio)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Calendario Principal */}
        <div className="flex-1 bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden flex flex-col min-h-0">
          {/* Header del calendario */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-dark-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={goToPrevMonth}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
              >
                <HiChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
              <button
                onClick={goToNextMonth}
                className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
              >
                <HiChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white ml-2">
                {MESES[month]} {year}
              </h2>
            </div>

            {/* Leyenda */}
            <div className="hidden lg:flex items-center gap-4">
              {['LLAMADA', 'REUNION', 'TAREA'].map((tipo) => {
                const config = TIPO_CONFIG[tipo as TipoActividad];
                return (
                  <div key={tipo} className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${config.bg}`}></div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-neutral-100 dark:border-dark-border flex-shrink-0">
            {DIAS_SEMANA.map((dia, index) => (
              <div
                key={dia}
                className={`py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                  index === 0 || index === 6
                    ? 'text-neutral-400 dark:text-neutral-600'
                    : 'text-neutral-600 dark:text-neutral-400'
                }`}
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Grilla de días */}
          <div className="flex-1 grid grid-cols-7 grid-rows-6 overflow-hidden">
            {calendarDays.map((cell, index) => {
              const isWeekend = index % 7 === 0 || index % 7 === 6;

              return (
                <button
                  key={index}
                  onClick={() => cell.isCurrentMonth && handleDayClick(cell.day, true)}
                  className={`
                    relative border-b border-r border-neutral-100 dark:border-dark-border p-1.5 text-left transition-colors overflow-hidden
                    ${!cell.isCurrentMonth ? 'bg-neutral-50/50 dark:bg-dark-bg/30' : ''}
                    ${cell.isCurrentMonth && !cell.isSelected ? 'hover:bg-violet-50/50 dark:hover:bg-violet-900/10' : ''}
                    ${cell.isSelected ? 'bg-violet-50 dark:bg-violet-900/20 ring-2 ring-inset ring-violet-500' : ''}
                    ${isWeekend && cell.isCurrentMonth ? 'bg-neutral-50/30 dark:bg-dark-bg/20' : ''}
                  `}
                >
                  {/* Número del día */}
                  <div className={`
                    inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1
                    ${!cell.isCurrentMonth ? 'text-neutral-300 dark:text-neutral-700' : ''}
                    ${cell.isCurrentMonth && !cell.isToday ? 'text-neutral-700 dark:text-neutral-300' : ''}
                    ${cell.isToday ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-md shadow-violet-500/30' : ''}
                  `}>
                    {cell.day}
                  </div>

                  {/* Eventos del día */}
                  {cell.actividades && cell.actividades.length > 0 && (
                    <div className="space-y-0.5 overflow-hidden">
                      {cell.actividades.slice(0, 2).map((actividad) => {
                        const config = TIPO_CONFIG[actividad.tipo];
                        return (
                          <div
                            key={actividad.id}
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${config.bgLight} ${config.text} truncate`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${config.bg} flex-shrink-0`}></span>
                            <span className="truncate">{formatTime(actividad.fechaInicio)}</span>
                          </div>
                        );
                      })}
                      {cell.actividades.length > 2 && (
                        <div className="text-[10px] font-medium text-violet-600 dark:text-violet-400 px-1.5">
                          +{cell.actividades.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Panel de detalles del día */}
        {selectedDate && (
          <div className="hidden xl:flex flex-col w-80 flex-shrink-0 bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
            <div className="p-4 border-b border-neutral-100 dark:border-dark-border flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    {DIAS_SEMANA_COMPLETOS[selectedDate.getDay()]}
                  </p>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {selectedDate.getDate()} <span className="text-lg font-normal text-neutral-500">{MESES_CORTOS[selectedDate.getMonth()]}</span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
                >
                  <HiX className="w-4 h-4 text-neutral-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {actividadesDelDia.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                    <HiCalendar className="w-8 h-8 text-violet-500" />
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium mb-1">Sin eventos</p>
                  <p className="text-sm text-neutral-400 dark:text-neutral-500">Este día está libre</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {actividadesDelDia
                    .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
                    .map((actividad) => {
                      const config = TIPO_CONFIG[actividad.tipo];
                      const Icon = config.icon;

                      return (
                        <button
                          key={actividad.id}
                          onClick={() => handleVerActividad(actividad)}
                          className="w-full p-4 rounded-xl border border-neutral-200 dark:border-dark-border hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all text-left group"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl ${config.bg} flex-shrink-0 shadow-md`}>
                              <Icon className="w-4 h-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-neutral-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                {config.label}
                              </p>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                                {actividad.contenido}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <HiClock className="w-3.5 h-3.5 text-neutral-400" />
                                <span className="text-xs text-neutral-500">
                                  {formatTime(actividad.fechaInicio)}
                                  {actividad.fechaFin && ` - ${formatTime(actividad.fechaFin)}`}
                                </span>
                              </div>
                              {actividad.participantes && actividad.participantes.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <HiUsers className="w-3.5 h-3.5 text-neutral-400" />
                                  <div className="flex -space-x-1.5">
                                    {actividad.participantes.slice(0, 3).map((p) => (
                                      <div
                                        key={p.usuarioId}
                                        className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 border-2 border-white dark:border-dark-card flex items-center justify-center text-[8px] font-bold text-white"
                                        title={p.usuarioNombre}
                                      >
                                        {(p.usuarioNombre || 'U')[0]}
                                      </div>
                                    ))}
                                    {actividad.participantes.length > 3 && (
                                      <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-dark-border border-2 border-white dark:border-dark-card flex items-center justify-center text-[8px] font-bold text-neutral-600">
                                        +{actividad.participantes.length - 3}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles de actividad */}
      <ActividadDetallesModal
        isOpen={showActividadModal}
        onClose={() => {
          setShowActividadModal(false);
          setActividadSeleccionada(null);
        }}
        actividad={actividadSeleccionada}
        showLeadLink={true}
        leadNombre={actividadSeleccionada ? getLeadNombre(actividadSeleccionada) : undefined}
      />
    </div>
  );
};
