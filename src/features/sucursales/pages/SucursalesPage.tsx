import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
} from '../../../shared/components/PaginatedDataTable';
import { listarSucursalesApi } from '../api/sucursalesApi';
import type { Sucursal } from '../types/sucursal.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

interface SucursalItem extends BaseItem {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  estado: JSX.Element;
  creadoEn: string;
}

const columns: ColumnDefinition<SucursalItem>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'direccion', header: 'Dirección' },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'correo', header: 'Correo' },
  { key: 'estado', header: 'Estado' },
  { key: 'creadoEn', header: 'Fecha de Creación' },
];

const statusOptions: StatusOption[] = [
  { label: 'Activo', value: '1', color: 'green' },
  { label: 'Inactivo', value: '0', color: 'red' },
  { label: 'Todos', value: '', color: 'gray' },

];

const fetchSucursales = async (
  page: number,
  limit: number,
  query: string,
  status?: string
): Promise<PaginatedResponse<SucursalItem>> => {
  try {
    console.log('🔍 fetchSucursales llamado con:', { page, limit, query, status });

    const response = await listarSucursalesApi({
      page,
      limit,
      nombre: query || undefined,
      estado: status && status !== '' ? (parseInt(status) as 0 | 1) : undefined,
    });

    console.log('📦 Respuesta de la API:', response);

    if (!response.success) {
      throw new Error('Error al obtener sucursales');
    }

    const transformedData: SucursalItem[] = response.data.map((sucursal: Sucursal) => {
      const fechaFormateada = sucursal.creadoEn
        ? new Date(sucursal.creadoEn).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        : 'N/A';

      const estadoBadge = sucursal.estado === 1 ? (
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
        id: sucursal.id,
        nombre: sucursal.nombre,
        direccion: sucursal.direccion || 'N/A',
        telefono: sucursal.telefono,
        correo: sucursal.correo,
        estado: estadoBadge,
        creadoEn: fechaFormateada,
      };
    });

    const result = {
      data: transformedData,
      total: response.pagination.total,
      page: response.pagination.page,
      limit: response.pagination.limit,
    };

    console.log('✅ Resultado que se devuelve a PaginatedDataTable:', result);

    return result;
  } catch (error: any) {
    console.error('❌ Error al obtener sucursales:', error);
    throw new Error(error.message || 'Error al cargar las sucursales');
  }
};

export const SucursalesPage = () => {
  const navigate = useNavigate();
  const [refreshTrigger] = useState(0);
  const { hasPermission } = usePermissions();

  const handleRowClick = (sucursal: SucursalItem) => {
    navigate(`/sucursales/view/${sucursal.id}`);
  };

  const handleView = (sucursal: SucursalItem) => {
    navigate(`/sucursales/view/${sucursal.id}`);
  };

  const handleCreateNew = () => {
    navigate('/sucursales/create');
  };

  const handleEdit = (sucursal: SucursalItem) => {
    navigate(`/sucursales/edit/${sucursal.id}`);
  };

  return (
    <PaginatedDataTable
      title="Sucursales"
      columns={columns}
      fetchDataFunction={fetchSucursales}
      onRowClick={handleRowClick}
      onCreateNew={hasPermission('sucursales.crear') ? handleCreateNew : undefined}
      onEdit={hasPermission('sucursales.editar') ? handleEdit : undefined}
      onView={handleView}
      statusOptions={statusOptions}
      refreshTrigger={refreshTrigger}
    />
  );
};
