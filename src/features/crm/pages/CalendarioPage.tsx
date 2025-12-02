import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaCalendarAlt, FaClipboard, FaUsers, FaFilter } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerMisPendientesApi } from '../api/crmApi';
import { listarUsuariosApi } from '../../users/api/UsersApi';
import type { CrmActividad, TipoActividad } from '../types/crm.types';

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

// Obtener días del mes
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Obtener el primer día de la semana del mes (0 = Domingo)
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// Nombres de los meses
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Nombres de los días
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

// Colores por tipo de actividad
const COLORES_TIPO: Record<TipoActividad, string> = {
  NOTA: 'bg-amber-500',
  LLAMADA: 'bg-green-500',
  CORREO: 'bg-blue-500',
  WHATSAPP: 'bg-emerald-500',
  REUNION: 'bg-purple-500',
  TAREA: 'bg-orange-500',
  CAMBIO_ETAPA: 'bg-gray-500',
};

export const CalendarioPage = () => {
  const navigate = useNavigate();
  const today = new Date();

  // Estados
  const [actividades, setActividades] = useState<ActividadConLead[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedUsuario, setSelectedUsuario] = useState<string>('todos');
  const [showFilters, setShowFilters] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

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

  // Filtrar actividades por usuario seleccionado
  const actividadesFiltradas = useMemo(() => {
    if (selectedUsuario === 'todos') return actividades;

    return actividades.filter(a =>
      a.participantes?.some(p => p.usuarioId === selectedUsuario)
    );
  }, [actividades, selectedUsuario]);

  // Agrupar actividades por fecha
  const actividadesPorFecha = useMemo(() => {
    const map: Record<string, ActividadConLead[]> = {};

    actividadesFiltradas.forEach(actividad => {
      // Usar fechaInicio para ubicar en el calendario
      const fecha = new Date(actividad.fechaInicio);
      const key = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;

      if (!map[key]) map[key] = [];
      map[key].push(actividad);
    });

    return map;
  }, [actividadesFiltradas]);

  // Navegación de mes
  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const days = [];

    // Días vacíos al inicio
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const key = `${year}-${month}-${day}`;
      const dayActividades = actividadesPorFecha[key] || [];

      days.push({
        day,
        isCurrentMonth: true,
        isToday,
        actividades: dayActividades
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfMonth, actividadesPorFecha, today]);

  // Formatear hora
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-3">
        <CgSpinner className="animate-spin text-5xl text-primary" />
        <p className="text-lg text-neutral-700 dark:text-neutral-300 font-semibold">Cargando calendario...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Calendario de Tareas
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Visualiza las tareas y reuniones programadas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
              showFilters || selectedUsuario !== 'todos'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-neutral-300 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-primary/50'
            }`}
          >
            <FaFilter className="w-4 h-4" />
            <span className="font-medium text-sm">Filtros</span>
          </button>

          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-primary border border-primary rounded-xl hover:bg-primary/10 transition-colors"
          >
            Hoy
          </button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <FaUsers className="w-4 h-4 text-neutral-400" />
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Filtrar por usuario:
              </label>
            </div>
            <select
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-800 dark:text-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="todos">Todos los usuarios</option>
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </option>
              ))}
            </select>

            {selectedUsuario !== 'todos' && (
              <button
                onClick={() => setSelectedUsuario('todos')}
                className="text-sm text-primary hover:underline"
              >
                Limpiar filtro
              </button>
            )}
          </div>
        </div>
      )}

      {/* Calendario */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border overflow-hidden">
        {/* Navegación del calendario */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-border">
          <button
            onClick={goToPrevMonth}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <FaChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>

          <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            {MESES[month]} {year}
          </h2>

          <button
            onClick={goToNextMonth}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <FaChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-dark-border">
          {DIAS_SEMANA.map(dia => (
            <div
              key={dia}
              className="py-3 text-center text-sm font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-dark-bg"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Días del mes */}
        <div className="grid grid-cols-7">
          {calendarDays.map((cell, index) => (
            <div
              key={index}
              className={`min-h-[100px] border-b border-r border-neutral-100 dark:border-dark-border p-1 ${
                !cell.isCurrentMonth ? 'bg-neutral-50 dark:bg-dark-bg/50' : ''
              } ${cell.isToday ? 'bg-primary/5' : ''}`}
            >
              {cell.day && (
                <>
                  <div className={`text-sm font-medium mb-1 p-1 ${
                    cell.isToday
                      ? 'w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center'
                      : 'text-neutral-700 dark:text-neutral-300'
                  }`}>
                    {cell.day}
                  </div>

                  {/* Actividades del día */}
                  <div className="space-y-1 overflow-y-auto max-h-[60px]">
                    {cell.actividades?.slice(0, 3).map((actividad) => (
                      <button
                        key={actividad.id}
                        onClick={() => navigate(`/crm/leads/${actividad.leadId}`)}
                        className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate hover:opacity-80 transition-opacity ${COLORES_TIPO[actividad.tipo]}`}
                        title={`${actividad.contenido} - ${formatTime(actividad.fechaInicio)}`}
                      >
                        {formatTime(actividad.fechaInicio)} {actividad.tipo === 'TAREA' ? '📋' : '📅'}
                      </button>
                    ))}
                    {cell.actividades && cell.actividades.length > 3 && (
                      <p className="text-[10px] text-neutral-500 px-1">
                        +{cell.actividades.length - 3} más
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lista de actividades pendientes */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-dark-border">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <FaClipboard className="w-5 h-5 text-orange-500" />
            Próximas Tareas y Reuniones
          </h3>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-dark-border">
          {actividadesFiltradas.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-dark-hover rounded-full flex items-center justify-center">
                <FaCalendarAlt className="w-8 h-8 text-neutral-400" />
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                No hay tareas pendientes
              </p>
            </div>
          ) : (
            actividadesFiltradas
              .sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime())
              .slice(0, 10)
              .map(actividad => {
                const fechaInicio = new Date(actividad.fechaInicio);
                const isPast = fechaInicio < new Date();

                return (
                  <button
                    key={actividad.id}
                    onClick={() => navigate(`/crm/leads/${actividad.leadId}`)}
                    className="w-full flex items-center gap-4 p-4 hover:bg-neutral-50 dark:hover:bg-dark-hover transition-colors text-left"
                  >
                    {/* Indicador de tipo */}
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 ${COLORES_TIPO[actividad.tipo]}`} />

                    {/* Contenido */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate ${isPast ? 'text-red-600 dark:text-red-400' : 'text-neutral-900 dark:text-neutral-100'}`}>
                        {actividad.contenido}
                      </p>
                      {actividad.leadInfo && (
                        <p className="text-sm text-neutral-500 truncate">
                          {actividad.leadInfo.contactoNombre} {actividad.leadInfo.contactoApellido} - {actividad.leadInfo.etapaNombre}
                        </p>
                      )}
                    </div>

                    {/* Fecha */}
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-medium ${isPast ? 'text-red-600 dark:text-red-400' : 'text-neutral-700 dark:text-neutral-300'}`}>
                        {fechaInicio.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatTime(actividad.fechaInicio)}
                      </p>
                    </div>

                    {/* Participantes */}
                    {actividad.participantes && actividad.participantes.length > 0 && (
                      <div className="flex -space-x-2">
                        {actividad.participantes.slice(0, 3).map((p, idx) => (
                          <div
                            key={p.usuarioId}
                            className="w-7 h-7 rounded-full bg-primary/20 border-2 border-white dark:border-dark-card flex items-center justify-center text-[10px] font-bold text-primary"
                            title={p.usuarioNombre || `Usuario ${p.usuarioId}`}
                          >
                            {(p.usuarioNombre || 'U')[0].toUpperCase()}
                          </div>
                        ))}
                        {actividad.participantes.length > 3 && (
                          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-dark-border border-2 border-white dark:border-dark-card flex items-center justify-center text-[10px] font-bold text-neutral-600">
                            +{actividad.participantes.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};
