import { useState, useEffect, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption
} from '../../../shared/components/PaginatedDataTable';
import { listarProfesoresApi } from '../api/profesoresApi';
import type { Profesor } from '../types/profesor.types';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

// Interfaz de Profesor extendida para el componente
interface Teacher extends BaseItem {
  id: string;
  nombreCompleto: string;
  correo: string;
  telefono: string;
  identificacion: string;
  sucursalPrincipal: string;
  idMoodle: string;
  estado: JSX.Element;
}

// Definir columnas
const columns: ColumnDefinition<Teacher>[] = [
  { key: 'nombreCompleto', header: 'Nombre Completo' },
  { key: 'correo', header: 'Correo Electrónico' },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'identificacion', header: 'Identificación' },
  { key: 'sucursalPrincipal', header: 'Sucursal Principal' },
  { key: 'idMoodle', header: 'ID Moodle' },
  { key: 'estado', header: 'Estado' },
];

// Definir opciones de estado
const statusOptions: StatusOption[] = [
  { label: 'Activo', value: 'true', color: 'green' },
  { label: 'Inactivo', value: 'false', color: 'red' },
  { label: 'Todos', value: 'todos', color: 'gray' },
];

// Componente principal
export const ProfesoresPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [refreshTrigger] = useState(0);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  // Cargar sucursales al montar el componente
  useEffect(() => {
    const loadSucursales = async () => {
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

    loadSucursales();
  }, []);

  // Función para obtener el nombre de la sucursal por ID
  const getSucursalNombre = (sucursalId?: string): string => {
    if (!sucursalId) return 'N/A';
    const sucursal = sucursales.find(s => s.id === sucursalId);
    return sucursal?.nombre || 'N/A';
  };

  /**
   * Función para obtener profesores desde la API
   * Transforma la respuesta de la API al formato esperado por PaginatedDataTable
   */
  const fetchTeachers = async (
    page: number,
    limit: number,
    query: string,
    status?: string,
    additionalFilters?: Record<string, any>
  ): Promise<PaginatedResponse<Teacher>> => {
    try {
      const response = await listarProfesoresApi({
        page,
        limit,
        estado: status === 'todos' ? undefined : status === 'true',
        nombre: query || undefined,
        idSucursal: additionalFilters?.idSucursal || undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener profesores');
      }

      // Transformar los datos de la API al formato de Teacher
      const transformedData: Teacher[] = response.data.profesores.map((profesor: Profesor) => {
        const nombreCompleto = `${profesor.nombre} ${profesor.primerApellido} ${profesor.segundoApellido || ''}`.trim();

        const estadoBadge = profesor.estado ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm">
            <FaCheckCircle className="w-3 h-3" />
            Activo
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm">
            <FaTimesCircle className="w-3 h-3" />
            Inactivo
          </span>
        );

        return {
          id: profesor.id,
          nombreCompleto,
          correo: profesor.correo,
          telefono: profesor.telefono || 'N/A',
          identificacion: profesor.identificacion,
          sucursalPrincipal: getSucursalNombre(profesor.idSucursalPrincipal),
          idMoodle: profesor.idMoodle || 'N/A',
          estado: estadoBadge,
        };
      });

      // Transformar la respuesta al formato esperado por PaginatedDataTable
      return {
        data: transformedData,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit,
      };
    } catch (error: any) {
      console.error('Error al obtener profesores:', error);
      throw new Error(error.message || 'Error al cargar los profesores');
    }
  };

  const handleView = (teacher: Teacher) => {
    navigate(`/profesores/view/${teacher.id}`);
  };

  const handleCreateNew = () => {
    navigate('/profesores/create');
  };

  const handleEdit = (teacher: Teacher) => {
    navigate(`/profesores/edit/${teacher.id}`);
  };

  // Renderizar filtro de sucursal
  const renderSucursalFilter = (filters: Record<string, any>, setFilters: (filters: Record<string, any>) => void) => {
    return (
      <div className="relative">
        <select
          id="sucursal-filter"
          value={filters.idSucursal || ''}
          onChange={(e) => setFilters({ ...filters, idSucursal: e.target.value })}
          className="appearance-none bg-white dark:bg-dark-bg dark:text-neutral-100 border border-neutral-300 dark:border-dark-border rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all shadow-md hover:shadow-lg hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loadingSucursales}
        >
          <option value="">Todas las Sucursales</option>
          {sucursales.map((sucursal) => (
            <option key={sucursal.id} value={sucursal.id}>
              {sucursal.nombre}
            </option>
          ))}
        </select>
        {/* Icono de flecha personalizado */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <PaginatedDataTable
      title="Gestión de Profesores"
      columns={columns}
      fetchDataFunction={fetchTeachers}
      onRowClick={handleView}
      onCreateNew={hasPermission('profesores.crear') ? handleCreateNew : undefined}
      onEdit={hasPermission('profesores.editar') ? handleEdit : undefined}
      onView={handleView}
      statusOptions={statusOptions}
      refreshTrigger={refreshTrigger}
      renderAdditionalFilters={renderSucursalFilter}
      additionalFilters={{ idSucursal: '' }}
    />
  );
};
