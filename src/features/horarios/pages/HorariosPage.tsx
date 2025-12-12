import { useState, useEffect, useContext, type JSX } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaDesktop, FaBuilding, FaClock, FaCalendarAlt, FaCalendarDay } from 'react-icons/fa';
import { ViewHorarioModal } from '../components/ViewHorarioModal';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
} from '../../../shared/components/PaginatedDataTable';
import { listarHorariosApi } from '../api/horariosApi';
import { obtenerAulasPorSucursalApi } from '../../aulas/api/aulasApi';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Horario, DiaSemana } from '../types/horario.types';
import { DIAS_SEMANA } from '../types/horario.types';
import type { Aula } from '../../aulas/types/aula.types';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { AuthContext } from '../../../shared/contexts/AuthContext';
// TODO: Habilitar permisos cuando estén configurados
// import { usePermissions } from '../../../shared/hooks/usePermissions';

// Interfaz de Horario extendida para el componente
interface HorarioItem extends BaseItem {
  id: string;
  cursoNombre: string;
  diaSemanaTexto: string;
  horario: JSX.Element;
  modalidad: JSX.Element;
  aulaNombre: string;
}

// Definir columnas
const columns: ColumnDefinition<HorarioItem>[] = [
  { key: 'cursoNombre', header: 'Curso' },
  { key: 'diaSemanaTexto', header: 'Día' },
  { key: 'horario', header: 'Horario' },
  { key: 'modalidad', header: 'Modalidad' },
  { key: 'aulaNombre', header: 'Aula' },
];

// Definir opciones de estado
const statusOptions: StatusOption[] = [
  { label: 'Activos', value: 'true', color: 'green' },
  { label: 'Inactivos', value: 'false', color: 'red' },
  { label: 'Todos', value: '', color: 'gray' },
];

// Opciones de días
const diasOptions = [
  { value: '', label: 'Todos los días' },
  ...Object.entries(DIAS_SEMANA).map(([value, label]) => ({ value, label })),
];

// Opciones de modalidad
const modalidadOptions = [
  { value: '', label: 'Todas las modalidades' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'virtual', label: 'Virtual' },
];

/**
 * Función para obtener horarios desde la API
 */
const fetchHorarios = async (
  page: number,
  limit: number,
  _query: string,
  status?: string,
  additionalFilters?: Record<string, any>
): Promise<PaginatedResponse<HorarioItem>> => {
  try {
    const response = await listarHorariosApi({
      page,
      pageSize: limit,
      activo: status !== '' ? status === 'true' : undefined,
      sucursalId: additionalFilters?.sucursalId || undefined,
      aulaId: additionalFilters?.aulaId || undefined,
      diaSemana: additionalFilters?.diaSemana ? parseInt(additionalFilters.diaSemana) as DiaSemana : undefined,
      modalidad: additionalFilters?.modalidad || undefined,
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al obtener horarios');
    }

    // Transformar los datos
    const transformedData: HorarioItem[] = response.data.map((horario: Horario) => {
      const modalidadBadge = horario.modalidad === 'presencial' ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700">
          <FaBuilding className="w-3 h-3" />
          Presencial
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700">
          <FaDesktop className="w-3 h-3" />
          Virtual
        </span>
      );

      const horarioBadge = (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
          <FaClock className="w-3 h-3" />
          {horario.horaInicio} - {horario.horaFin}
          <span className="text-neutral-400 dark:text-neutral-500">({horario.duracionMinutos} min)</span>
        </span>
      );

      return {
        id: horario.id,
        cursoNombre: horario.cursoNombre || 'Sin nombre',
        diaSemanaTexto: horario.diaSemanaTexto,
        horario: horarioBadge,
        modalidad: modalidadBadge,
        aulaNombre: horario.aulaNombre || 'Sin aula',
      };
    });

    return {
      data: transformedData,
      total: response.pagination.totalRecords,
      page: response.pagination.page,
      limit: response.pagination.pageSize,
    };
  } catch (error: any) {
    console.error('Error al obtener horarios:', error);
    throw new Error(error.message || 'Error al cargar los horarios');
  }
};

// Componente principal
export const HorariosPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  // const { hasPermission } = usePermissions();

  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loadingAulas, setLoadingAulas] = useState(false);
  const [currentSucursalId, setCurrentSucursalId] = useState<string>(user?.idSucursalPrincipal || '');

  // Modal state
  const [selectedHorarioId, setSelectedHorarioId] = useState<string | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Obtener filtro inicial de la URL
  const initialAulaId = searchParams.get('aulaId') || '';

  // Sucursal inicial del usuario
  const userSucursalId = user?.idSucursalPrincipal || '';

  // Cargar sucursales al montar
  useEffect(() => {
    const fetchSucursales = async () => {
      setLoadingSucursales(true);
      try {
        const response = await obtenerTodasSucursalesApi();
        if (response.success) {
          setSucursales(response.data);
        }
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
      } finally {
        setLoadingSucursales(false);
      }
    };

    fetchSucursales();
  }, []);

  // Cargar aulas cuando cambia la sucursal
  useEffect(() => {
    const fetchAulas = async () => {
      if (!currentSucursalId) {
        setAulas([]);
        return;
      }

      setLoadingAulas(true);
      try {
        const response = await obtenerAulasPorSucursalApi(currentSucursalId, true);
        if (response.success) {
          setAulas(response.data);
        }
      } catch (error) {
        console.error('Error al cargar aulas:', error);
      } finally {
        setLoadingAulas(false);
      }
    };

    fetchAulas();
  }, [currentSucursalId]);

  const handleView = (horario: HorarioItem) => {
    setSelectedHorarioId(horario.id);
    setIsViewModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedHorarioId(null);
  };

  // Renderizar filtros adicionales
  const renderAdditionalFilters = (filters: Record<string, any>, setFilters: (filters: Record<string, any>) => void) => {
    return (
      <>
        {/* Filtro de Sucursal (obligatorio) */}
        <div className="relative">
          <select
            id="sucursal-filter"
            value={filters.sucursalId || ''}
            onChange={(e) => {
              const newSucursalId = e.target.value;
              setCurrentSucursalId(newSucursalId);
              setFilters({ ...filters, sucursalId: newSucursalId, aulaId: '' });
            }}
            className="appearance-none bg-white dark:bg-dark-bg dark:text-neutral-100 border border-neutral-300 dark:border-dark-border rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all shadow-md hover:shadow-lg hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingSucursales}
          >
            {sucursales.map((sucursal) => (
              <option key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Filtro de Aula */}
        <div className="relative">
          <select
            id="aula-filter"
            value={filters.aulaId || ''}
            onChange={(e) => setFilters({ ...filters, aulaId: e.target.value })}
            className="appearance-none bg-white dark:bg-dark-bg dark:text-neutral-100 border border-neutral-300 dark:border-dark-border rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all shadow-md hover:shadow-lg hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingAulas}
          >
            <option value="">Todas las Aulas</option>
            {aulas.map((aula) => (
              <option key={aula.id} value={aula.id}>
                {aula.nombre}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Filtro de Día */}
        <div className="relative">
          <select
            id="dia-filter"
            value={filters.diaSemana || ''}
            onChange={(e) => setFilters({ ...filters, diaSemana: e.target.value })}
            className="appearance-none bg-white dark:bg-dark-bg dark:text-neutral-100 border border-neutral-300 dark:border-dark-border rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all shadow-md hover:shadow-lg hover:border-primary/50"
          >
            {diasOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Filtro de Modalidad */}
        <div className="relative">
          <select
            id="modalidad-filter"
            value={filters.modalidad || ''}
            onChange={(e) => setFilters({ ...filters, modalidad: e.target.value })}
            className="appearance-none bg-white dark:bg-dark-bg dark:text-neutral-100 border border-neutral-300 dark:border-dark-border rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all shadow-md hover:shadow-lg hover:border-primary/50"
          >
            {modalidadOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </>
    );
  };

  return (
    <>
      {/* Header con título y selector de vista */}
      <div className="px-2 md:px-0 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
            <div className="h-10 w-1.5 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full"></div>
            Horarios
          </h1>

          {/* Selector de vista */}
          <div className="flex items-center bg-neutral-100 dark:bg-dark-hover rounded-lg p-1 flex-wrap gap-0.5">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-900 dark:text-white bg-white dark:bg-dark-card rounded-md shadow-sm"
            >
              <FaClock className="w-3 h-3" />
              Lista
            </button>
            <button
              onClick={() => navigate('/horarios/calendario?view=day')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            >
              <FaCalendarDay className="w-3 h-3" />
              Día
            </button>
            <button
              onClick={() => navigate('/horarios/calendario?view=weekdays')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            >
              L-V
            </button>
            <button
              onClick={() => navigate('/horarios/calendario?view=weekend')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            >
              S-D
            </button>
            <button
              onClick={() => navigate('/horarios/calendario')}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md transition-colors"
            >
              <FaCalendarAlt className="w-3 h-3" />
              Semana
            </button>
          </div>
        </div>
      </div>

      <PaginatedDataTable
        title=""
        columns={columns}
        fetchDataFunction={fetchHorarios}
        onRowClick={handleView}
        onView={handleView}
        statusOptions={statusOptions}
        renderAdditionalFilters={renderAdditionalFilters}
        additionalFilters={{ sucursalId: userSucursalId, aulaId: initialAulaId, diaSemana: '', modalidad: '' }}
      />

      <ViewHorarioModal
        isOpen={isViewModalOpen}
        onClose={handleCloseModal}
        horarioId={selectedHorarioId}
      />
    </>
  );
};
