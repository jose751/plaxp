import { useState, useEffect, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaUsers } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
  type CustomAction
} from '../../../shared/components/PaginatedDataTable';
import { listarCursosApi } from '../api/cursosApi';
import { listarCategoriasApi } from '../../categorias/api/categoriasApi';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Curso } from '../types/curso.types';
import type { Categoria } from '../../categorias/types/categoria.types';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

// Interfaz de Curso extendida para el componente
interface CursoItem extends BaseItem {
  id: string;
  codigo: string;
  nombre: string;
  nombreCorto: string;
  categoria: string;
  estado: JSX.Element;
  sincronizado: JSX.Element;
  categoriaNombre?: string;
}

// Definir columnas
const columns: ColumnDefinition<CursoItem>[] = [
  { key: 'codigo', header: 'Código' },
  { key: 'nombre', header: 'Nombre del Curso' },
  { key: 'nombreCorto', header: 'Nombre Corto' },
  { key: 'categoriaNombre', header: 'Categoría' },
  { key: 'estado', header: 'Estado' },
  { key: 'sincronizado', header: 'Sincronizado Moodle' },
];

// Definir opciones de estado según la API
const statusOptions: StatusOption[] = [
  { label: 'Activo', value: 'activo', color: 'green' },
  { label: 'Inactivo', value: 'inactivo', color: 'red' },
  { label: 'Todos', value: 'todos', color: 'gray' },
];

/**
 * Función para obtener cursos desde la API
 * Transforma la respuesta de la API al formato esperado por PaginatedDataTable
 */
const fetchCursos = async (
  page: number,
  limit: number,
  query: string,
  status?: string,
  additionalFilters?: Record<string, any>
): Promise<PaginatedResponse<CursoItem>> => {
  try {
    const response = await listarCursosApi({
      page,
      pageSize: limit,
      estado: status as 'activo' | 'inactivo' | 'todos' | undefined,
      q: query || undefined,
      categoriaId: additionalFilters?.categoriaId || undefined,
      idSucursal: additionalFilters?.idSucursal || undefined,
    });

    if (!response.success) {
      throw new Error(response.message || 'Error al obtener cursos');
    }

    // Transformar los datos de la API al formato de CursoItem
    const transformedData: CursoItem[] = response.data.cursos.map((curso: Curso) => {
      const estadoBadge = curso.estado ? (
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

      const sincronizadoBadge = curso.sincronizadoMoodle ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shadow-sm">
          <FaCheckCircle className="w-3 h-3" />
          Sí
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/30 dark:to-gray-800/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 shadow-sm">
          <FaTimesCircle className="w-3 h-3" />
          No
        </span>
      );

      return {
        id: curso.id,
        codigo: curso.codigo,
        nombre: curso.nombre,
        nombreCorto: curso.nombreCorto,
        categoria: 'N/A',
        estado: estadoBadge,
        sincronizado: sincronizadoBadge,
        categoriaNombre: curso.categoriaNombre,
      };
    });

    // Transformar la respuesta al formato esperado por PaginatedDataTable
    return {
      data: transformedData,
      total: response.data.pagination.totalRecords,
      page: response.data.pagination.page,
      limit: response.data.pagination.pageSize,
    };
  } catch (error: any) {
    console.error('Error al obtener cursos:', error);
    throw new Error(error.message || 'Error al cargar los cursos');
  }
};

// Componente principal
export const CursosPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingSucursales, setLoadingSucursales] = useState(false);


  // Cargar categorías y sucursales al montar el componente
  useEffect(() => {
    const fetchCategorias = async () => {
      setLoadingCategorias(true);
      try {
        const response = await listarCategoriasApi({
          activo: true,
          esVisible: true,
          page: 1,
          limit: 1000,
        });
        if (response.success) {
          // Filtrar solo las categorías que permiten cursos
          const categoriasPermitidas = response.data.filter(cat => cat.permiteCursos);
          setCategorias(categoriasPermitidas);
        }
      } catch (error) {
        console.error('Error al cargar categorías:', error);
      } finally {
        setLoadingCategorias(false);
      }
    };

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

    fetchCategorias();
    fetchSucursales();
  }, []);

  const handleView = (curso: CursoItem) => {
    navigate(`/cursos/view/${curso.id}`);
  };

  const handleCreateNew = () => {
    navigate('/cursos/create');
  };

  const handleEdit = (curso: CursoItem) => {
    navigate(`/cursos/edit/${curso.id}`);
  };

  const handleVerGrupo = (curso: CursoItem) => {
    navigate(`/cursos/grupo/${curso.id}`);
  };

  // Acciones personalizadas para la tabla
  const customActions: CustomAction<CursoItem>[] = [
    {
      icon: <FaUsers size={16} />,
      label: 'Ver grupo',
      onClick: handleVerGrupo,
      className: 'text-teal-600 hover:text-white hover:bg-teal-600',
    },
  ];

  // Renderizar filtros adicionales (categoría y sucursal)
  const renderAdditionalFilters = (filters: Record<string, any>, setFilters: (filters: Record<string, any>) => void) => {
    return (
      <>
        {/* Filtro de Sucursal */}
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

        {/* Filtro de Categoría */}
        <div className="relative">
          <select
            id="category-filter"
            value={filters.categoriaId || ''}
            onChange={(e) => setFilters({ ...filters, categoriaId: e.target.value })}
            className="appearance-none bg-white dark:bg-dark-bg dark:text-neutral-100 border border-neutral-300 dark:border-dark-border rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all shadow-md hover:shadow-lg hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loadingCategorias}
          >
            <option value="">Todas las Categorías</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nivel > 1 && '— '.repeat(categoria.nivel - 1)}
                {categoria.nombre}
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
      </>
    );
  };

  return (
    <PaginatedDataTable
      title="Cursos"
      columns={columns}
      fetchDataFunction={fetchCursos}
      onRowClick={handleView}
      onCreateNew={hasPermission('cursos.crear') ? handleCreateNew : undefined}
      onEdit={hasPermission('cursos.editar') ? handleEdit : undefined}
      onView={handleView}
      statusOptions={statusOptions}
      renderAdditionalFilters={renderAdditionalFilters}
      additionalFilters={{ categoriaId: '', idSucursal: '' }}
      customActions={customActions}
    />
  );
};
