import { useState, useEffect, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption
} from '../../../shared/components/PaginatedDataTable';
import { listarEstudiantesApi } from '../api/estudiantesApi';
import type { Estudiante } from '../types/estudiante.types';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { UserAvatar } from '../../users/components/UserAvatar';

// Interfaz de Estudiante extendida para el componente
interface Student extends BaseItem {
  id: string;
  estudiante: JSX.Element; // Columna con avatar + nombre
  nombreCompleto: string;
  correo: string;
  telefono: string;
  identificacion: string;
  idMoodle: string;
  estado: JSX.Element;
  pathFoto?: string | null;
}

// Definir columnas
const columns: ColumnDefinition<Student>[] = [
  { key: 'estudiante', header: 'Estudiante' },
  { key: 'correo', header: 'Correo Electrónico' },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'identificacion', header: 'Identificación' },
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
export const EstudiantesPage = () => {
  const navigate = useNavigate();
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

  /**
   * Función para obtener estudiantes desde la API
   * Transforma la respuesta de la API al formato esperado por PaginatedDataTable
   */
  const fetchStudents = async (
    page: number,
    limit: number,
    query: string,
    status?: string,
    additionalFilters?: Record<string, any>
  ): Promise<PaginatedResponse<Student>> => {
    try {
      const response = await listarEstudiantesApi({
        page,
        limit,
        estado: status === 'todos' ? undefined : status === 'true',
        nombre: query || undefined,
        idSucursal: additionalFilters?.idSucursal || undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener estudiantes');
      }

      // Transformar los datos de la API al formato de Student
      const transformedData: Student[] = response.data.estudiantes.map((estudiante: Estudiante) => {
        const nombreCompleto = `${estudiante.nombre} ${estudiante.primerApellido} ${estudiante.segundoApellido || ''}`.trim();

        const estadoBadge = estudiante.estado ? (
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

        // Componente de estudiante con avatar + nombre
        const estudianteCell = (
          <div className="flex items-center gap-3">
            <UserAvatar
              nombre={nombreCompleto}
              pathFoto={estudiante.pathFoto}
              size="md"
            />
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {nombreCompleto}
            </span>
          </div>
        );

        return {
          id: estudiante.id,
          estudiante: estudianteCell,
          nombreCompleto,
          correo: estudiante.correo,
          telefono: estudiante.telefono || 'N/A',
          identificacion: estudiante.identificacion,
          idMoodle: estudiante.idMoodle || 'N/A',
          estado: estadoBadge,
          pathFoto: estudiante.pathFoto,
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
      console.error('Error al obtener estudiantes:', error);
      throw new Error(error.message || 'Error al cargar los estudiantes');
    }
  };

  const handleView = (student: Student) => {
    navigate(`/estudiantes/view/${student.id}`);
  };

  const handleCreateNew = () => {
    navigate('/estudiantes/create');
  };

  const handleEdit = (student: Student) => {
    navigate(`/estudiantes/edit/${student.id}`);
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
      title="Gestión de Estudiantes"
      columns={columns}
      fetchDataFunction={fetchStudents}
      onRowClick={handleView}
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onView={handleView}
      statusOptions={statusOptions}
      refreshTrigger={refreshTrigger}
      renderAdditionalFilters={renderSucursalFilter}
      additionalFilters={{ idSucursal: '' }}
    />
  );
};
