import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaCrown, FaUserShield } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
} from '../../../shared/components/PaginatedDataTable';
import { listarRolesApi } from '../api/rolesApi';
import type { Rol } from '../types/role.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

// Interfaz de Rol extendida para el componente
interface RolItem extends BaseItem {
  id: string;
  nombre: string;
  descripcion: string;
  esSuperadmin: JSX.Element;
  estado: JSX.Element;
  creadoEn: string;
}

// Definir columnas
const columns: ColumnDefinition<RolItem>[] = [
  { key: 'nombre', header: 'Nombre del Rol' },
  { key: 'descripcion', header: 'Descripción' },
  { key: 'esSuperadmin', header: 'Superadmin' },
  { key: 'estado', header: 'Estado' },
  { key: 'creadoEn', header: 'Fecha de Creación' },
];

// Definir opciones de estado
const statusOptions: StatusOption[] = [
  { label: 'Activo', value: 'activo', color: 'green' },
  { label: 'Inactivo', value: 'inactivo', color: 'red' },
  { label: 'Todos', value: 'todos', color: 'gray' },
];

/**
 * Función para obtener roles desde la API
 * Transforma la respuesta de la API al formato esperado por PaginatedDataTable
 */
const fetchRoles = async (
  page: number,
  limit: number,
  query: string,
  status?: string
): Promise<PaginatedResponse<RolItem>> => {
  try {
    const response = await listarRolesApi({
      page,
      pageSize: limit,
      q: query || undefined,
      estado: (status as 'activo' | 'inactivo' | 'todos') || 'activo',
    });

    if (!response.success) {
      throw new Error('Error al obtener roles');
    }

    // Transformar los datos de la API al formato de RolItem
    const transformedData: RolItem[] = response.data.map((rol: Rol) => {
      // Formatear fecha
      const fechaFormateada = rol.creadoEn
        ? new Date(rol.creadoEn).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A';

      const superadminBadge = rol.esSuperadmin ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-800/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 shadow-sm">
          <FaCrown className="w-3 h-3" />
          Sí
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/30 dark:to-gray-800/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 shadow-sm">
          <FaUserShield className="w-3 h-3" />
          No
        </span>
      );

      const estadoBadge = rol.estado ? (
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
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        esSuperadmin: superadminBadge,
        estado: estadoBadge,
        creadoEn: fechaFormateada,
      };
    });

    // Transformar la respuesta al formato esperado por PaginatedDataTable
    return {
      data: transformedData,
      total: response.pagination.totalRecords,
      page: response.pagination.page,
      limit: response.pagination.pageSize,
    };
  } catch (error: any) {
    console.error('Error al obtener roles:', error);
    throw new Error(error.message || 'Error al cargar los roles');
  }
};

// Componente principal
export const RolesPage = () => {
  const navigate = useNavigate();
  const [refreshTrigger] = useState(0);
  const { hasPermission } = usePermissions();

  const handleRowClick = (rol: RolItem) => {
    navigate(`/roles/view/${rol.id}`);
  };

  const handleView = (rol: RolItem) => {
    navigate(`/roles/view/${rol.id}`);
  };

  const handleCreateNew = () => {
    navigate('/roles/create');
  };

  const handleEdit = (rol: RolItem) => {
    navigate(`/roles/edit/${rol.id}`);
  };

  return (
    <PaginatedDataTable
      title="Roles"
      columns={columns}
      fetchDataFunction={fetchRoles}
      onRowClick={handleRowClick}
      onCreateNew={hasPermission('roles.crear') ? handleCreateNew : undefined}
      onEdit={hasPermission('roles.editar') ? handleEdit : undefined}
      onView={handleView}
      statusOptions={statusOptions}
      refreshTrigger={refreshTrigger}
    />
  );
};
