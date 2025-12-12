import { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaCalendarDay,
  FaCheck,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
} from 'react-icons/fa';
import { WeeklySchedule } from '../components/WeeklySchedule';
import { DailySchedule } from '../components/DailySchedule';
import { MultiDaySchedule } from '../components/MultiDaySchedule';
import { listarHorariosSucursalApi } from '../api/horariosApi';
import { obtenerAulasPorSucursalApi } from '../../aulas/api/aulasApi';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Horario, DiaSemana } from '../types/horario.types';
import type { Aula } from '../../aulas/types/aula.types';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { AuthContext } from '../../../shared/contexts/AuthContext';

// Colores para las aulas (estilo Google Calendar)
const AULA_COLORES = [
  { bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-500', text: 'text-emerald-700 dark:text-emerald-300' },
  { bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
  { bg: 'bg-violet-500', light: 'bg-violet-50 dark:bg-violet-500/10', border: 'border-violet-500', text: 'text-violet-700 dark:text-violet-300' },
  { bg: 'bg-rose-500', light: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-500', text: 'text-rose-700 dark:text-rose-300' },
  { bg: 'bg-cyan-500', light: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-500', text: 'text-cyan-700 dark:text-cyan-300' },
  { bg: 'bg-orange-500', light: 'bg-orange-50 dark:bg-orange-500/10', border: 'border-orange-500', text: 'text-orange-700 dark:text-orange-300' },
  { bg: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-500/10', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
  { bg: 'bg-teal-500', light: 'bg-teal-50 dark:bg-teal-500/10', border: 'border-teal-500', text: 'text-teal-700 dark:text-teal-300' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50 dark:bg-indigo-500/10', border: 'border-indigo-500', text: 'text-indigo-700 dark:text-indigo-300' },
];

const getAulaColor = (index: number) => AULA_COLORES[index % AULA_COLORES.length];

type ViewMode = 'day' | 'week' | 'weekdays' | 'weekend';

// Helpers de fecha
const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

const formatDateRange = (monday: Date): string => {
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  if (monday.getMonth() === sunday.getMonth()) {
    return `${monday.getDate()} - ${sunday.getDate()} ${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
  } else if (monday.getFullYear() === sunday.getFullYear()) {
    return `${monday.getDate()} ${monthNames[monday.getMonth()]} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]} ${monday.getFullYear()}`;
  } else {
    return `${monday.getDate()} ${monthNames[monday.getMonth()]} ${monday.getFullYear()} - ${sunday.getDate()} ${monthNames[sunday.getMonth()]} ${sunday.getFullYear()}`;
  }
};

const formatSingleDate = (date: Date): string => {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${dayNames[date.getDay()]} ${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

export const HorariosCalendarioPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;

  // Leer vista inicial de la URL
  const viewParam = searchParams.get('view');
  const initialView: ViewMode = viewParam === 'day' ? 'day'
    : viewParam === 'weekdays' ? 'weekdays'
    : viewParam === 'weekend' ? 'weekend'
    : 'week';

  // Estados
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(true);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [selectedSucursalId, setSelectedSucursalId] = useState<string>(user?.idSucursalPrincipal || '');
  const [selectedAulaIds, setSelectedAulaIds] = useState<string[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [currentWeek, setCurrentWeek] = useState<Date>(() => getMonday(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>(initialView);

  // Cargar sucursales
  useEffect(() => {
    const fetchSucursales = async () => {
      setLoadingSucursales(true);
      try {
        const response = await obtenerTodasSucursalesApi();
        if (response.success) {
          setSucursales(response.data);
          if (user?.idSucursalPrincipal) {
            setSelectedSucursalId(user.idSucursalPrincipal);
          } else if (response.data.length > 0) {
            setSelectedSucursalId(response.data[0].id);
          }
        }
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
      } finally {
        setLoadingSucursales(false);
      }
    };

    fetchSucursales();
  }, [user?.idSucursalPrincipal]);

  // Cargar aulas cuando cambia la sucursal
  useEffect(() => {
    const fetchAulas = async () => {
      if (!selectedSucursalId) {
        setAulas([]);
        setSelectedAulaIds([]);
        return;
      }

      setLoadingAulas(true);
      try {
        const response = await obtenerAulasPorSucursalApi(selectedSucursalId, true);
        if (response.success) {
          setAulas(response.data);
          setSelectedAulaIds(response.data.map(a => a.id));
        }
      } catch (error) {
        console.error('Error al cargar aulas:', error);
      } finally {
        setLoadingAulas(false);
      }
    };

    fetchAulas();
  }, [selectedSucursalId]);

  // Calcular fechas de la semana actual
  const weekDates = useMemo(() => {
    const monday = new Date(currentWeek);
    const sunday = new Date(currentWeek);
    sunday.setDate(monday.getDate() + 6);
    return {
      fechaDesde: formatDate(monday),
      fechaHasta: formatDate(sunday),
    };
  }, [currentWeek]);

  // Cargar horarios
  const fetchHorarios = useCallback(async () => {
    if (!selectedSucursalId) return;

    setLoadingHorarios(true);
    try {
      const response = await listarHorariosSucursalApi(
        selectedSucursalId,
        weekDates.fechaDesde,
        weekDates.fechaHasta
      );

      if (response.success) {
        const filteredHorarios = response.data.filter(
          (h) => h.activo && h.modalidad === 'presencial'
        );
        setHorarios(filteredHorarios);
      }
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    } finally {
      setLoadingHorarios(false);
    }
  }, [selectedSucursalId, weekDates]);

  useEffect(() => {
    fetchHorarios();
  }, [fetchHorarios]);

  // Agrupar horarios por aula
  const horariosPorAula = useMemo(() => {
    const result: { [aulaId: string]: { aulaNombre: string; horariosPorDia: { [dia: number]: Horario[] } } } = {};

    const filteredHorarios = horarios.filter(h =>
      h.aulaId && selectedAulaIds.includes(h.aulaId)
    );

    filteredHorarios.forEach(horario => {
      if (!horario.aulaId) return;

      if (!result[horario.aulaId]) {
        result[horario.aulaId] = {
          aulaNombre: horario.aulaNombre || 'Sin nombre',
          horariosPorDia: { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] },
        };
      }

      const dia = horario.diaSemana as DiaSemana;
      result[horario.aulaId].horariosPorDia[dia].push(horario);
    });

    return result;
  }, [horarios, selectedAulaIds]);

  // Toggle aula
  const toggleAula = (aulaId: string) => {
    setSelectedAulaIds(prev =>
      prev.includes(aulaId)
        ? prev.filter(id => id !== aulaId)
        : [...prev, aulaId]
    );
  };

  const toggleAllAulas = () => {
    if (selectedAulaIds.length === aulas.length) {
      setSelectedAulaIds([]);
    } else {
      setSelectedAulaIds(aulas.map(a => a.id));
    }
  };

  const handleHorarioClick = (horario: Horario) => {
    // Navegar directamente al grupo del curso
    if (horario.grupoCursoId) {
      navigate(`/cursos/grupo/${horario.grupoCursoId}`);
    } else {
      navigate(`/horarios/view/${horario.id}`);
    }
  };

  // Navegación de semanas
  const goToPreviousWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentWeek(getMonday(new Date()));
    setSelectedDay(new Date());
  };

  const isCurrentWeek = useMemo(() => {
    const today = getMonday(new Date());
    return currentWeek.getTime() === today.getTime();
  }, [currentWeek]);

  // Navegación de días
  const goToPreviousDay = () => {
    setSelectedDay(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 1);
      return newDate;
    });
  };

  const goToNextDay = () => {
    setSelectedDay(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 1);
      return newDate;
    });
  };

  const isToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDay);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() === today.getTime();
  }, [selectedDay]);

  // Mapa de colores por aula
  const aulaColores = useMemo(() => {
    const result: { [aulaId: string]: { bg: string; light: string; border: string; text: string } } = {};
    aulas.forEach((aula, index) => {
      result[aula.id] = getAulaColor(index);
    });
    return result;
  }, [aulas]);

  // Filtrar aulas seleccionadas
  const aulasSeleccionadas = useMemo(() => {
    return aulas.filter(a => selectedAulaIds.includes(a.id));
  }, [aulas, selectedAulaIds]);

  // Filtrar horarios por aulas seleccionadas
  const horariosFiltered = useMemo(() => {
    return horarios.filter(h => h.aulaId && selectedAulaIds.includes(h.aulaId));
  }, [horarios, selectedAulaIds]);

  const isLoading = loadingSucursales || loadingAulas || loadingHorarios;

  return (
    <div className="px-2 md:px-0">
      {/* Header */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <div className="h-8 sm:h-10 w-1.5 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
            Horarios
          </h1>

          {/* Selector de vista */}
          <div className="flex items-center bg-neutral-100 dark:bg-dark-hover rounded-lg p-1 flex-wrap gap-0.5">
            <button
              onClick={() => navigate('/horarios')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            >
              <FaClock className="w-3 h-3" />
              Lista
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'text-neutral-900 dark:text-white bg-white dark:bg-dark-card shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <FaCalendarDay className="w-3 h-3" />
              Día
            </button>
            <button
              onClick={() => setViewMode('weekdays')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'weekdays'
                  ? 'text-neutral-900 dark:text-white bg-white dark:bg-dark-card shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              L-V
            </button>
            <button
              onClick={() => setViewMode('weekend')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'weekend'
                  ? 'text-neutral-900 dark:text-white bg-white dark:bg-dark-card shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              S-D
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'week'
                  ? 'text-neutral-900 dark:text-white bg-white dark:bg-dark-card shadow-sm'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
              }`}
            >
              <FaCalendarAlt className="w-3 h-3" />
              Semana
            </button>
          </div>
        </div>

        {/* Navegación de fecha */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={viewMode === 'day' ? goToPreviousDay : goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover text-neutral-600 dark:text-neutral-400 transition-colors"
              title={viewMode === 'day' ? 'Día anterior' : 'Semana anterior'}
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              disabled={viewMode === 'day' ? isToday : isCurrentWeek}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                (viewMode === 'day' ? isToday : isCurrentWeek)
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 cursor-default'
                  : 'bg-neutral-100 dark:bg-dark-hover text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-dark-border'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={viewMode === 'day' ? goToNextDay : goToNextWeek}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover text-neutral-600 dark:text-neutral-400 transition-colors"
              title={viewMode === 'day' ? 'Día siguiente' : 'Semana siguiente'}
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {viewMode === 'day' ? formatSingleDate(selectedDay) : formatDateRange(currentWeek)}
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start gap-4 lg:gap-6">
        {/* Sidebar filtros - En móvil arriba, en desktop a la izquierda */}
        <div className="w-full lg:w-auto lg:flex-shrink-0 bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-xl overflow-hidden">
          <div className="p-4 space-y-4 lg:w-56">
            {/* En móvil: Sucursal y Aulas en fila */}
            <div className="flex flex-row lg:flex-col gap-4 lg:gap-0">
              {/* Selector de Sucursal */}
              <div className="flex-1 lg:flex-none lg:mb-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2 block">
                  Sucursal
                </span>
                <select
                  value={selectedSucursalId}
                  onChange={(e) => setSelectedSucursalId(e.target.value)}
                  disabled={loadingSucursales}
                  className="w-full"
                >
                  {sucursales.map((sucursal) => (
                    <option key={sucursal.id} value={sucursal.id}>
                      {sucursal.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Separador - solo en desktop */}
              <div className="hidden lg:block border-t border-neutral-200 dark:border-dark-border" />

              {/* Aulas */}
              <div className="flex-1 lg:flex-none lg:mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                    Aulas
                  </span>
                  <button
                    onClick={toggleAllAulas}
                    className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                  >
                    {selectedAulaIds.length === aulas.length ? 'Ninguna' : 'Todas'}
                  </button>
                </div>

                {loadingAulas ? (
                  <div className="flex items-center justify-center py-4 lg:py-8">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-amber-500 border-t-transparent"></div>
                  </div>
                ) : aulas.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Sin aulas</p>
                  </div>
                ) : (
                  <>
                    {/* En móvil: chips horizontales scrolleables */}
                    <div className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                      {aulas.map((aula, index) => {
                        const isSelected = selectedAulaIds.includes(aula.id);
                        const color = getAulaColor(index);
                        return (
                          <button
                            key={aula.id}
                            onClick={() => toggleAula(aula.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isSelected
                                ? `${color.bg} text-white`
                                : 'bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-neutral-400'
                            }`}
                          >
                            {aula.nombre}
                          </button>
                        );
                      })}
                    </div>

                    {/* En desktop: lista vertical */}
                    <div className="hidden lg:block space-y-0.5">
                      {aulas.map((aula, index) => {
                        const isSelected = selectedAulaIds.includes(aula.id);
                        const color = getAulaColor(index);
                        return (
                          <button
                            key={aula.id}
                            onClick={() => toggleAula(aula.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                              isSelected
                                ? `${color.light} ${color.text}`
                                : 'hover:bg-neutral-50 dark:hover:bg-dark-hover text-neutral-500 dark:text-neutral-400'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                                isSelected
                                  ? `${color.bg}`
                                  : 'border-2 border-neutral-300 dark:border-neutral-600'
                              }`}
                            >
                              {isSelected && (
                                <FaCheck className="w-2.5 h-2.5 text-white" />
                              )}
                            </div>
                            <span className="text-sm font-medium truncate">
                              {aula.nombre}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Contador - solo en desktop */}
                    <div className="hidden lg:block mt-3 pt-3 border-t border-neutral-100 dark:border-dark-border">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                        {selectedAulaIds.length} de {aulas.length} seleccionadas
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Leyenda de disponibilidad - solo en desktop */}
            <div className="hidden lg:block border-t border-neutral-200 dark:border-dark-border pt-4 mt-4">
              <div className="flex items-center gap-1.5 mb-3">
                <FaInfoCircle className="w-3 h-3 text-neutral-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                  Disponibilidad
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 rounded bg-green-100 dark:bg-green-900/40 border-l-4 border-green-500" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Disponible</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 rounded bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-500" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Cupos disponibles</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 rounded bg-yellow-100 dark:bg-yellow-900/40 border-l-4 border-yellow-500" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Casi lleno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 rounded bg-red-100 dark:bg-red-900/40 border-l-4 border-red-500" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Lleno</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-4 rounded bg-neutral-100 dark:bg-neutral-800 border-l-4 border-neutral-400" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400">Sin límite</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-3 border-violet-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">Cargando horarios...</p>
                </div>
              </div>
            ) : selectedAulaIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="w-20 h-20 rounded-full bg-neutral-100 dark:bg-dark-card flex items-center justify-center mb-4">
                  <FaCalendarAlt className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
                </div>
                <p className="text-lg font-medium text-neutral-700 dark:text-neutral-200 mb-1">
                  No hay horarios para mostrar
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  Selecciona al menos un aula para ver los horarios
                </p>
              </div>
            ) : viewMode === 'day' ? (
              // Vista de día - aulas como columnas
              <DailySchedule
                aulas={aulasSeleccionadas}
                horarios={horariosFiltered}
                selectedDate={selectedDay}
                onHorarioClick={handleHorarioClick}
                aulaColores={aulaColores}
              />
            ) : viewMode === 'weekdays' ? (
              // Vista días de semana (L-V) - aulas y días como columnas
              <MultiDaySchedule
                aulas={aulasSeleccionadas}
                horarios={horariosFiltered}
                weekStart={currentWeek}
                dias={[1, 2, 3, 4, 5] as DiaSemana[]}
                onHorarioClick={handleHorarioClick}
                aulaColores={aulaColores}
                titulo="Lunes a Viernes"
              />
            ) : viewMode === 'weekend' ? (
              // Vista fin de semana (S-D) - aulas y días como columnas
              <MultiDaySchedule
                aulas={aulasSeleccionadas}
                horarios={horariosFiltered}
                weekStart={currentWeek}
                dias={[6, 7] as DiaSemana[]}
                onHorarioClick={handleHorarioClick}
                aulaColores={aulaColores}
                titulo="Sábado y Domingo"
              />
            ) : (
              // Vista semanal - una grilla por aula
              <div className="space-y-6">
                {Object.entries(horariosPorAula).map(([aulaId, data]) => (
                  <WeeklySchedule
                    key={aulaId}
                    horariosPorDia={data.horariosPorDia}
                    aulaNombre={data.aulaNombre}
                    onHorarioClick={handleHorarioClick}
                    showCursoName={true}
                    weekStart={currentWeek}
                  />
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
