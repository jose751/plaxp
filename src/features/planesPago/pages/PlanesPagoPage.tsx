import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaCreditCard,
  FaSync,
  FaLayerGroup,
  FaDollarSign,
} from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption,
} from '../../../shared/components/PaginatedDataTable';
import { listarPlanesPagoApi } from '../api/planesPagoApi';
import type { PlanPago } from '../types/planPago.types';
import { TipoPago } from '../types/planPago.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

interface PlanPagoItem extends BaseItem {
  id: string;
  nombre: JSX.Element;
  tipoPago: JSX.Element;
  monto: JSX.Element;
  estado: JSX.Element;
}

const columns: ColumnDefinition<PlanPagoItem>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'tipoPago', header: 'Tipo de Pago' },
  { key: 'monto', header: 'Monto' },
  { key: 'estado', header: 'Estado' },
];

const statusOptions: StatusOption[] = [
  { label: 'Activos', value: 'true', color: 'green' },
  { label: 'Inactivos', value: 'false', color: 'red' },
  { label: 'Todos', value: '', color: 'gray' },
];

const getTipoPagoBadge = (tipoPago: TipoPago): JSX.Element => {
  switch (tipoPago) {
    case TipoPago.UNICO:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shadow-sm">
          <FaDollarSign className="w-3 h-3" />
          Único
        </span>
      );
    case TipoPago.RECURRENTE:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700 shadow-sm">
          <FaSync className="w-3 h-3" />
          Recurrente
        </span>
      );
    case TipoPago.CUOTAS:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-800/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700 shadow-sm">
          <FaLayerGroup className="w-3 h-3" />
          Cuotas
        </span>
      );
    default:
      return <span>-</span>;
  }
};

const getEstadoBadge = (activo: boolean): JSX.Element => {
  if (activo) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm">
        <FaCheckCircle className="w-3 h-3" />
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm">
      <FaTimesCircle className="w-3 h-3" />
      Inactivo
    </span>
  );
};

const formatMonto = (plan: PlanPago): JSX.Element => {
  const simbolo = plan.moneda?.simbolo || '$';
  const formatNumber = (num: number) =>
    num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (plan.tipoPago === TipoPago.CUOTAS && plan.numeroCuotas) {
    return (
      <div className="flex flex-col">
        <span className="font-medium text-neutral-900 dark:text-neutral-100">
          {simbolo}{formatNumber(plan.total)} x {plan.numeroCuotas} cuotas
        </span>
        {plan.totalFinal && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Total: {simbolo}{formatNumber(plan.totalFinal)}
          </span>
        )}
      </div>
    );
  }

  return (
    <span className="font-medium text-neutral-900 dark:text-neutral-100">
      {simbolo}{formatNumber(plan.total)}
    </span>
  );
};

const fetchPlanesPago = async (
  page: number,
  limit: number,
  query: string,
  status?: string
): Promise<PaginatedResponse<PlanPagoItem>> => {
  try {
    const response = await listarPlanesPagoApi({
      page,
      limit,
      q: query || undefined,
      activo: status && status !== '' ? status === 'true' : undefined,
    });

    if (!response.success) {
      throw new Error('Error al obtener planes de pago');
    }

    const transformedData: PlanPagoItem[] = response.data.planesPago.map(
      (plan: PlanPago) => {
        const nombreElement = (
          <div className="flex items-center gap-2">
            <FaCreditCard className="w-4 h-4 text-rose-500" />
            <div className="flex flex-col">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {plan.nombre}
              </span>
              {plan.descripcion && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                  {plan.descripcion}
                </span>
              )}
            </div>
          </div>
        );

        return {
          id: plan.id,
          nombre: nombreElement,
          tipoPago: getTipoPagoBadge(plan.tipoPago),
          monto: formatMonto(plan),
          estado: getEstadoBadge(plan.activo),
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
    console.error('Error al obtener planes de pago:', error);
    throw new Error(error.message || 'Error al cargar los planes de pago');
  }
};

export const PlanesPagoPage = () => {
  const navigate = useNavigate();
  const [refreshTrigger] = useState(0);
  const { hasPermission } = usePermissions();

  const handleRowClick = (plan: PlanPagoItem) => {
    navigate(`/planes-pago/view/${plan.id}`);
  };

  const handleView = (plan: PlanPagoItem) => {
    navigate(`/planes-pago/view/${plan.id}`);
  };

  const handleCreateNew = () => {
    navigate('/planes-pago/create');
  };

  const handleEdit = (plan: PlanPagoItem) => {
    navigate(`/planes-pago/edit/${plan.id}`);
  };

  return (
    <PaginatedDataTable
      title="Planes de Pago"
      columns={columns}
      fetchDataFunction={fetchPlanesPago}
      onRowClick={handleRowClick}
      onCreateNew={hasPermission('planes-pago.crear') ? handleCreateNew : undefined}
      onEdit={hasPermission('planes-pago.editar') ? handleEdit : undefined}
      onView={handleView}
      statusOptions={statusOptions}
      refreshTrigger={refreshTrigger}
    />
  );
};
