import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBan,
} from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
} from '../../../shared/components/PaginatedDataTable';
import { listarMatriculasPagosApi } from '../api/matriculasPagosApi';
import type { MatriculaPago } from '../types/matriculaPago.types';
import { EstadoPago } from '../types/matriculaPago.types';

interface MatriculaPagoItem extends BaseItem {
  id: string;
  estudiante: JSX.Element;
  planPago: string;
  numeroPago: JSX.Element;
  fechaVencimiento: JSX.Element;
  monto: JSX.Element;
  estado: JSX.Element;
}

const columns: ColumnDefinition<MatriculaPagoItem>[] = [
  { key: 'estudiante', header: 'Estudiante' },
  { key: 'planPago', header: 'Plan de Pago' },
  { key: 'numeroPago', header: 'N° Pago' },
  { key: 'fechaVencimiento', header: 'Vencimiento' },
  { key: 'monto', header: 'Monto' },
  { key: 'estado', header: 'Estado' },
];

const statusOptions: StatusOption[] = [
  { label: 'Pendientes', value: '1', color: 'yellow' },
  { label: 'Pagados', value: '2', color: 'green' },
  { label: 'Vencidos', value: '3', color: 'red' },
  { label: 'Anulados', value: '4', color: 'gray' },
  { label: 'Todos', value: '', color: 'gray' },
];

const getEstadoBadge = (estado: EstadoPago): JSX.Element => {
  switch (estado) {
    case EstadoPago.PENDIENTE:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-700 shadow-sm">
          <FaClock className="w-3 h-3" />
          Pendiente
        </span>
      );
    case EstadoPago.PAGADO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm">
          <FaCheckCircle className="w-3 h-3" />
          Pagado
        </span>
      );
    case EstadoPago.VENCIDO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm">
          <FaExclamationTriangle className="w-3 h-3" />
          Vencido
        </span>
      );
    case EstadoPago.ANULADO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-900/30 dark:to-neutral-800/20 text-neutral-700 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700 shadow-sm">
          <FaBan className="w-3 h-3" />
          Anulado
        </span>
      );
    default:
      return <span>-</span>;
  }
};

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  // Extraer solo la parte de fecha para evitar problemas de zona horaria
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const isOverdue = (fechaVencimiento: string | null | undefined, estado: EstadoPago): boolean => {
  if (estado !== EstadoPago.PENDIENTE || !fechaVencimiento) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Extraer solo la parte de fecha para evitar problemas de zona horaria
  const [year, month, day] = fechaVencimiento.split('T')[0].split('-');
  const vencimiento = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return vencimiento < today;
};

const fetchMatriculasPagos = async (
  page: number,
  limit: number,
  query: string,
  status?: string
): Promise<PaginatedResponse<MatriculaPagoItem>> => {
  try {
    const response = await listarMatriculasPagosApi({
      page,
      limit,
      q: query || undefined,
      estado: status && status !== '' ? (parseInt(status) as EstadoPago) : undefined,
    });

    if (!response.success) {
      throw new Error('Error al obtener pagos');
    }

    const transformedData: MatriculaPagoItem[] = response.data.pagos.map(
      (pago: MatriculaPago) => {
        const estudianteElement = (
          <div className="flex flex-col">
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {pago.estudianteNombre} {pago.estudianteApellidos}
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              Matrícula #{pago.matriculaId}
            </span>
          </div>
        );

        const numeroPagoElement = (
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold text-sm">
            {pago.numeroPago}
          </span>
        );

        const overdue = isOverdue(pago.fechaVencimiento, pago.estado);
        const fechaVencimientoElement = (
          <span className={`text-sm ${overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-700 dark:text-neutral-300'}`}>
            {formatDate(pago.fechaVencimiento)}
          </span>
        );

        const montoElement = (
          <span className="font-semibold text-neutral-900 dark:text-neutral-100">
            ${pago.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        );

        return {
          id: pago.id,
          estudiante: estudianteElement,
          planPago: pago.planPagoNombre,
          numeroPago: numeroPagoElement,
          fechaVencimiento: fechaVencimientoElement,
          monto: montoElement,
          estado: getEstadoBadge(pago.estado),
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
    console.error('Error al obtener pagos:', error);
    throw new Error(error.message || 'Error al cargar los pagos');
  }
};

export const MatriculasPagosPage = () => {
  const navigate = useNavigate();
  const [refreshTrigger] = useState(0);

  const handleRowClick = (pago: MatriculaPagoItem) => {
    navigate(`/pagos/view/${pago.id}`);
  };

  const handleView = (pago: MatriculaPagoItem) => {
    navigate(`/pagos/view/${pago.id}`);
  };

  return (
    <PaginatedDataTable
      title="Pagos"
      columns={columns}
      fetchDataFunction={fetchMatriculasPagos}
      onRowClick={handleRowClick}
      onView={handleView}
      statusOptions={statusOptions}
      refreshTrigger={refreshTrigger}
    />
  );
};
