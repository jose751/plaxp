import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt, FaClock, FaTimesCircle, FaStar } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
} from '../../../shared/components/PaginatedDataTable';
import { listarPeriodosLectivosApi } from '../api/periodosLectivosApi';
import type { PeriodoLectivo } from '../types/periodoLectivo.types';
import { EstadoPeriodoLectivo } from '../types/periodoLectivo.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

interface PeriodoLectivoItem extends BaseItem {
  id: string;
  nombre: JSX.Element;
  fechaInicio: string;
  fechaFin: string;
  estado: JSX.Element;
  esActual: JSX.Element;
}

const columns: ColumnDefinition<PeriodoLectivoItem>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'fechaInicio', header: 'Fecha Inicio' },
  { key: 'fechaFin', header: 'Fecha Fin' },
  { key: 'estado', header: 'Estado' },
  { key: 'esActual', header: 'Periodo Actual' },
];

const statusOptions: StatusOption[] = [
  { label: 'Todos', value: '', color: 'gray' },
  { label: 'Planeado', value: '0', color: 'blue' },
  { label: 'Activo', value: '1', color: 'green' },
  { label: 'Finalizado', value: '3', color: 'purple' },
  { label: 'Cancelado', value: '4', color: 'red' },
];

const getEstadoBadge = (estado: EstadoPeriodoLectivo): JSX.Element => {
  switch (estado) {
    case EstadoPeriodoLectivo.PLANEADO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shadow-sm">
          <FaClock className="w-3 h-3" />
          Planeado
        </span>
      );
    case EstadoPeriodoLectivo.ACTIVO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm">
          <FaCheckCircle className="w-3 h-3" />
          Activo
        </span>
      );
    case EstadoPeriodoLectivo.FINALIZADO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700 shadow-sm">
          <FaCheckCircle className="w-3 h-3" />
          Finalizado
        </span>
      );
    case EstadoPeriodoLectivo.CANCELADO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm">
          <FaTimesCircle className="w-3 h-3" />
          Cancelado
        </span>
      );
    default:
      return <span>-</span>;
  }
};

const fetchPeriodosLectivos = async (
  page: number,
  limit: number,
  query: string,
  status?: string
): Promise<PaginatedResponse<PeriodoLectivoItem>> => {
  try {
    const response = await listarPeriodosLectivosApi({
      page,
      limit,
      q: query || undefined,
      estado: status && status !== '' ? (parseInt(status) as EstadoPeriodoLectivo) : undefined,
    });

    if (!response.success) {
      throw new Error('Error al obtener periodos lectivos');
    }

    const transformedData: PeriodoLectivoItem[] = response.data.periodosLectivos.map(
      (periodo: PeriodoLectivo) => {
        const formatDate = (dateStr: string) => {
          // Extraer solo la parte de fecha para evitar problemas de zona horaria
          const [year, month, day] = dateStr.split('T')[0].split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        };

        const nombreElement = (
          <div className="flex items-center gap-2">
            <FaCalendarAlt className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {periodo.nombre}
            </span>
          </div>
        );

        const esActualBadge = periodo.esActual ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 shadow-sm">
            <FaStar className="w-3 h-3" />
            Sí
          </span>
        ) : (
          <span className="text-neutral-400 dark:text-neutral-500 text-sm">No</span>
        );

        return {
          id: periodo.id,
          nombre: nombreElement,
          fechaInicio: formatDate(periodo.fechaInicio),
          fechaFin: formatDate(periodo.fechaFin),
          estado: getEstadoBadge(periodo.estado),
          esActual: esActualBadge,
        };
      }
    );

    return {
      data: transformedData,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit,
    };
  } catch (error: any) {
    console.error('Error al obtener periodos lectivos:', error);
    throw new Error(error.message || 'Error al cargar los periodos lectivos');
  }
};

export const PeriodosLectivosPage = () => {
  const navigate = useNavigate();
  const [refreshTrigger] = useState(0);
  const { hasPermission } = usePermissions();

  const handleRowClick = (periodo: PeriodoLectivoItem) => {
    navigate(`/periodos-lectivos/view/${periodo.id}`);
  };

  const handleView = (periodo: PeriodoLectivoItem) => {
    navigate(`/periodos-lectivos/view/${periodo.id}`);
  };

  const handleCreateNew = () => {
    navigate('/periodos-lectivos/create');
  };

  const handleEdit = (periodo: PeriodoLectivoItem) => {
    navigate(`/periodos-lectivos/edit/${periodo.id}`);
  };

  return (
    <PaginatedDataTable
      title="Periodos Lectivos"
      columns={columns}
      fetchDataFunction={fetchPeriodosLectivos}
      onRowClick={handleRowClick}
      onCreateNew={hasPermission('periodos-lectivos.crear') ? handleCreateNew : undefined}
      onEdit={hasPermission('periodos-lectivos.editar') ? handleEdit : undefined}
      onView={handleView}
      statusOptions={statusOptions}
      refreshTrigger={refreshTrigger}
    />
  );
};
