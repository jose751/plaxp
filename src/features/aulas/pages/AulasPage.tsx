import { useState, useEffect, useMemo, useCallback, useContext, type JSX } from 'react';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
} from '../../../shared/components/PaginatedDataTable';
import { listarAulasApi } from '../api/aulasApi';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import { AulaModal } from '../components/AulaModal';
import { ViewAulaModal } from '../components/ViewAulaModal';
import type { Aula } from '../types/aula.types';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { AuthContext } from '../../../shared/contexts/AuthContext';
// TODO: Habilitar permisos cuando estén configurados
// import { usePermissions } from '../../../shared/hooks/usePermissions';

// Interfaz de Aula extendida para el componente
interface AulaItem extends BaseItem {
  id: string;
  nombre: string;
  sucursalNombre: string;
  capacidadMaxima: JSX.Element;
  estado: JSX.Element;
}

// Definir columnas
const columns: ColumnDefinition<AulaItem>[] = [
  { key: 'nombre', header: 'Nombre del Aula' },
  { key: 'sucursalNombre', header: 'Sucursal' },
  { key: 'capacidadMaxima', header: 'Capacidad' },
  { key: 'estado', header: 'Estado' },
];

// Definir opciones de estado
const statusOptions: StatusOption[] = [
  { label: 'Activo', value: 'true', color: 'green' },
  { label: 'Inactivo', value: 'false', color: 'red' },
  { label: 'Todos', value: '', color: 'gray' },
];

// Componente principal
export const AulasPage = () => {
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  // const { hasPermission } = usePermissions();
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loadingSucursales, setLoadingSucursales] = useState(false);

  // Sucursal inicial del usuario (sucursal principal)
  const userSucursalId = user?.idSucursalPrincipal || '';

  // Estado del modal de crear/editar
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAulaId, setEditingAulaId] = useState<string | null>(null);

  // Estado del modal de vista
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewingAulaId, setViewingAulaId] = useState<string | null>(null);

  // Trigger para refrescar la tabla
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mapa de sucursales para lookup rápido
  const sucursalesMap = useMemo(() => {
    const map = new Map<string, string>();
    sucursales.forEach(s => map.set(s.id, s.nombre));
    return map;
  }, [sucursales]);

  /**
   * Función para obtener aulas desde la API
   */
  const fetchAulas = useCallback(async (
    page: number,
    limit: number,
    query: string,
    status?: string,
    additionalFilters?: Record<string, any>
  ): Promise<PaginatedResponse<AulaItem>> => {
    try {
      const response = await listarAulasApi({
        page,
        pageSize: limit,
        activo: status !== '' ? status === 'true' : undefined,
        q: query || undefined,
        sucursalId: additionalFilters?.sucursalId || undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Error al obtener aulas');
      }

      // Transformar los datos de la API al formato de AulaItem
      const transformedData: AulaItem[] = response.data.map((aula: Aula) => {
        // Buscar nombre de sucursal en el mapa local
        const sucursalNombre = sucursalesMap.get(aula.sucursalId) || aula.sucursalNombre || 'N/A';

        const estadoBadge = aula.activo ? (
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

        const capacidadBadge = (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            {aula.capacidadMaxima > 0 ? `${aula.capacidadMaxima} personas` : 'Sin límite'}
          </span>
        );

        return {
          id: aula.id,
          nombre: aula.nombre,
          sucursalNombre,
          capacidadMaxima: capacidadBadge,
          estado: estadoBadge,
        };
      });

      return {
        data: transformedData,
        total: response.pagination.totalRecords,
        page: response.pagination.page,
        limit: response.pagination.pageSize,
      };
    } catch (error: any) {
      console.error('Error al obtener aulas:', error);
      throw new Error(error.message || 'Error al cargar las aulas');
    }
  }, [sucursalesMap]);

  // Cargar sucursales al montar el componente
  useEffect(() => {
    const fetchSucursales = async () => {
      setLoadingSucursales(true);
      try {
        const response = await obtenerTodasSucursalesApi();
        if (response.success) {
          setSucursales(response.data);
          // Refrescar la tabla cuando las sucursales se carguen para mostrar los nombres
          setRefreshTrigger(prev => prev + 1);
        }
      } catch (error) {
        console.error('Error al cargar sucursales:', error);
      } finally {
        setLoadingSucursales(false);
      }
    };

    fetchSucursales();
  }, []);

  const handleView = (aula: AulaItem) => {
    setViewingAulaId(aula.id);
    setViewModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingAulaId(null);
    setModalOpen(true);
  };

  const handleEdit = (aula: AulaItem) => {
    setEditingAulaId(aula.id);
    setModalOpen(true);
  };

  const handleModalSuccess = () => {
    // Refrescar la tabla después de crear/editar
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditFromView = (aulaId: string) => {
    setViewModalOpen(false);
    setEditingAulaId(aulaId);
    setModalOpen(true);
  };

  const handleStatusChange = () => {
    // Refrescar la tabla cuando cambia el estado desde el modal de vista
    setRefreshTrigger(prev => prev + 1);
  };

  // Renderizar filtros adicionales (sucursal - obligatoria)
  const renderAdditionalFilters = (filters: Record<string, any>, setFilters: (filters: Record<string, any>) => void) => {
    return (
      <div className="relative">
        <select
          id="sucursal-filter"
          value={filters.sucursalId || ''}
          onChange={(e) => setFilters({ ...filters, sucursalId: e.target.value })}
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
    );
  };

  return (
    <>
      <PaginatedDataTable
        title="Aulas"
        columns={columns}
        fetchDataFunction={fetchAulas}
        onRowClick={handleView}
        // TODO: Habilitar permisos cuando estén configurados en el backend
        // onCreateNew={hasPermission('aulas.crear') ? handleCreateNew : undefined}
        // onEdit={hasPermission('aulas.editar') ? handleEdit : undefined}
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
        onView={handleView}
        statusOptions={statusOptions}
        renderAdditionalFilters={renderAdditionalFilters}
        additionalFilters={{ sucursalId: userSucursalId }}
        refreshTrigger={refreshTrigger}
      />

      {/* Modal de crear/editar aula */}
      <AulaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleModalSuccess}
        aulaId={editingAulaId}
        defaultSucursalId={userSucursalId}
      />

      {/* Modal de ver aula */}
      <ViewAulaModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        aulaId={viewingAulaId}
        onEdit={handleEditFromView}
        onStatusChange={handleStatusChange}
      />
    </>
  );
};
