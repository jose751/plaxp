import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaReceipt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBan,
  FaTimesCircle,
  FaUserGraduate,
  FaCalendarAlt,
  FaDollarSign,
  FaPlus,
  FaUser,
  FaPrint,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerMatriculaPagoPorIdApi, obtenerResumenAbonosApi, crearAbonoApi } from '../api/matriculasPagosApi';
import type { MatriculaPago, ResumenAbonos, Abono, CrearAbonoData } from '../types/matriculaPago.types';
import { EstadoPago } from '../types/matriculaPago.types';

const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Cheque', 'Otro'];

export const ViewMatriculaPagoPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [pago, setPago] = useState<MatriculaPago | null>(null);
  const [resumen, setResumen] = useState<ResumenAbonos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de abono
  const [abonoModalOpen, setAbonoModalOpen] = useState(false);
  const [abonoForm, setAbonoForm] = useState<Omit<CrearAbonoData, 'matriculaPagoId'>>({
    metodoPago: 'Efectivo',
    monto: 0,
    referencia: '',
    nota: '',
  });
  const [abonoLoading, setAbonoLoading] = useState(false);
  const [abonoError, setAbonoError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const [pagoRes, resumenRes] = await Promise.all([
        obtenerMatriculaPagoPorIdApi(id),
        obtenerResumenAbonosApi(id),
      ]);
      setPago(pagoRes.data);
      setResumen(resumenRes.data);
    } catch (err: any) {
      console.error('Error al obtener datos:', err);
      setError(err.message || 'Error al cargar los detalles del pago');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    // Extraer solo la parte de fecha para evitar problemas de zona horaria
    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMonto = (monto: number): string => {
    return `$${monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getEstadoInfo = (estado: EstadoPago) => {
    switch (estado) {
      case EstadoPago.PENDIENTE:
        return {
          label: 'Pendiente',
          description: 'Pago pendiente de realizar',
          bgClass: 'bg-yellow-50 dark:bg-yellow-900/30',
          textClass: 'text-yellow-700 dark:text-yellow-400',
          borderClass: 'border-yellow-200 dark:border-yellow-800',
          icon: <FaClock className="w-4 h-4" />,
        };
      case EstadoPago.PAGADO:
        return {
          label: 'Pagado',
          description: 'Pago realizado exitosamente',
          bgClass: 'bg-green-50 dark:bg-green-900/30',
          textClass: 'text-green-700 dark:text-green-400',
          borderClass: 'border-green-200 dark:border-green-800',
          icon: <FaCheckCircle className="w-4 h-4" />,
        };
      case EstadoPago.VENCIDO:
        return {
          label: 'Vencido',
          description: 'Pago vencido',
          bgClass: 'bg-red-50 dark:bg-red-900/30',
          textClass: 'text-red-700 dark:text-red-400',
          borderClass: 'border-red-200 dark:border-red-800',
          icon: <FaExclamationTriangle className="w-4 h-4" />,
        };
      case EstadoPago.ANULADO:
        return {
          label: 'Anulado',
          description: 'Pago anulado',
          bgClass: 'bg-neutral-50 dark:bg-neutral-900/30',
          textClass: 'text-neutral-700 dark:text-neutral-400',
          borderClass: 'border-neutral-200 dark:border-neutral-800',
          icon: <FaBan className="w-4 h-4" />,
        };
      default:
        return {
          label: 'Desconocido',
          description: '',
          bgClass: 'bg-neutral-50 dark:bg-neutral-900/30',
          textClass: 'text-neutral-700 dark:text-neutral-400',
          borderClass: 'border-neutral-200 dark:border-neutral-800',
          icon: null,
        };
    }
  };

  const openAbonoModal = () => {
    setAbonoForm({
      metodoPago: 'Efectivo',
      monto: resumen?.saldoPendiente || 0,
      referencia: '',
      nota: '',
    });
    setAbonoError(null);
    setAbonoModalOpen(true);
  };

  const closeAbonoModal = () => {
    if (!abonoLoading) {
      setAbonoModalOpen(false);
      setAbonoError(null);
    }
  };

  const handleAbonoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !resumen || !pago) return;

    if (abonoForm.monto <= 0) {
      setAbonoError('El monto debe ser mayor a 0');
      return;
    }

    if (abonoForm.monto > resumen.saldoPendiente) {
      setAbonoError(`El monto no puede exceder el saldo pendiente (${formatMonto(resumen.saldoPendiente)})`);
      return;
    }

    setAbonoLoading(true);
    setAbonoError(null);

    try {
      const response = await crearAbonoApi({
        matriculaPagoId: id,
        metodoPago: abonoForm.metodoPago,
        monto: abonoForm.monto,
        referencia: abonoForm.referencia || undefined,
        nota: abonoForm.nota || undefined,
      });

      setAbonoModalOpen(false);

      // Navegar a la página de impresión con los datos del recibo
      const nuevoAbono = response.data;
      const nuevoTotalAbonado = resumen.totalAbonado + abonoForm.monto;
      const nuevoSaldoPendiente = resumen.saldoPendiente - abonoForm.monto;

      // Calcular impuesto
      const subtotal = pago.subtotal || resumen.totalPago;
      const impuestoMonto = pago.total - subtotal;
      const impuestoPorcentaje = subtotal > 0 ? (impuestoMonto / subtotal) * 100 : 0;

      navigate(`/pagos/recibo/${nuevoAbono.id}`, {
        state: {
          abonoId: nuevoAbono.id,
          monto: nuevoAbono.monto,
          metodoPago: nuevoAbono.metodoPago,
          fechaAbono: nuevoAbono.fechaAbono,
          referencia: nuevoAbono.referencia,
          nota: nuevoAbono.nota,
          usuarioNombre: nuevoAbono.usuarioNombre,
          pagoId: id,
          numeroPago: pago.numeroPago,
          planPagoNombre: pago.planPagoNombre,
          subtotal: subtotal,
          impuestoPorcentaje: Math.round(impuestoPorcentaje * 100) / 100,
          impuestoMonto: impuestoMonto,
          totalPago: resumen.totalPago,
          totalAbonado: nuevoTotalAbonado,
          saldoPendiente: nuevoSaldoPendiente,
          estudianteNombre: pago.estudianteNombre,
          estudianteApellidos: pago.estudianteApellidos,
        },
      });
    } catch (err: any) {
      console.error('Error al registrar abono:', err);
      setAbonoError(err.message || 'Error al registrar el abono');
    } finally {
      setAbonoLoading(false);
    }
  };

  const canAddAbono = pago && resumen &&
    (pago.estado === EstadoPago.PENDIENTE || pago.estado === EstadoPago.VENCIDO) &&
    resumen.saldoPendiente > 0;

  const handleReimprimirAbono = (abono: Abono) => {
    if (!pago || !resumen) return;

    // Calcular el saldo pendiente al momento del abono
    // Para esto necesitamos sumar los abonos anteriores a este
    const abonosOrdenados = [...resumen.abonos].sort(
      (a, b) => new Date(a.fechaAbono).getTime() - new Date(b.fechaAbono).getTime()
    );

    let totalAbonadoHastaEste = 0;
    for (const a of abonosOrdenados) {
      totalAbonadoHastaEste += a.monto;
      if (a.id === abono.id) break;
    }

    const saldoPendienteAlMomento = resumen.totalPago - totalAbonadoHastaEste;

    // Calcular impuesto
    const subtotal = pago.subtotal || resumen.totalPago;
    const impuestoMonto = pago.total - subtotal;
    const impuestoPorcentaje = subtotal > 0 ? (impuestoMonto / subtotal) * 100 : 0;

    navigate(`/pagos/recibo/${abono.id}`, {
      state: {
        abonoId: abono.id,
        monto: abono.monto,
        metodoPago: abono.metodoPago,
        fechaAbono: abono.fechaAbono,
        referencia: abono.referencia,
        nota: abono.nota,
        usuarioNombre: abono.usuarioNombre,
        pagoId: id,
        numeroPago: pago.numeroPago,
        planPagoNombre: pago.planPagoNombre,
        subtotal: subtotal,
        impuestoPorcentaje: Math.round(impuestoPorcentaje * 100) / 100,
        impuestoMonto: impuestoMonto,
        totalPago: resumen.totalPago,
        totalAbonado: totalAbonadoHastaEste,
        saldoPendiente: saldoPendienteAlMomento,
        estudianteNombre: pago.estudianteNombre,
        estudianteApellidos: pago.estudianteApellidos,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          Cargando información del pago...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 flex flex-col items-center">
          <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 mb-4">
            <FaTimesCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">
            Error al cargar el pago
          </p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">
            {error}
          </p>
          <button
            onClick={() => navigate('/pagos')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Pagos
          </button>
        </div>
      </div>
    );
  }

  if (!pago) {
    return null;
  }

  const estadoInfo = getEstadoInfo(pago.estado);
  const porcentajePagado = resumen ? (resumen.totalAbonado / resumen.totalPago) * 100 : 0;

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/pagos')}
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Pagos</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30">
              <FaReceipt className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Detalle del Pago
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Pago #{pago.numeroPago} - {pago.planPagoNombre}
              </p>
            </div>
          </div>
          {canAddAbono && (
            <button
              onClick={openAbonoModal}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
            >
              <FaPlus className="w-4 h-4" />
              Registrar Abono
            </button>
          )}
        </div>
      </div>

      {/* Estado del Pago */}
      <div className={`${estadoInfo.bgClass} border ${estadoInfo.borderClass} rounded-xl p-4 mb-6`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${estadoInfo.bgClass} ${estadoInfo.textClass}`}>
            {estadoInfo.icon}
          </div>
          <div>
            <p className={`font-semibold ${estadoInfo.textClass}`}>{estadoInfo.label}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{estadoInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Resumen Financiero */}
      {resumen && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            Resumen de Pagos
          </h3>

          {/* Barra de progreso */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600 dark:text-neutral-400">Progreso de pago</span>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{porcentajePagado.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(porcentajePagado, 100)}%` }}
              />
            </div>
          </div>

          {/* Montos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4">
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">
                Total a Pagar
              </p>
              <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                {formatMonto(resumen.totalPago)}
              </p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-1">
                Total Abonado
              </p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatMonto(resumen.totalAbonado)}
              </p>
            </div>

            <div className={`rounded-lg p-4 ${resumen.saldoPendiente > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-green-50 dark:bg-green-900/20'}`}>
              <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${resumen.saldoPendiente > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                Saldo Pendiente
              </p>
              <p className={`text-xl font-bold ${resumen.saldoPendiente > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatMonto(resumen.saldoPendiente)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Abonos */}
      {resumen && resumen.abonos.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            Historial de Abonos ({resumen.abonos.length})
          </h3>

          <div className="space-y-3">
            {resumen.abonos.map((abono: Abono) => (
              <div
                key={abono.id}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <FaDollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {formatMonto(abono.monto)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span>{abono.metodoPago}</span>
                      <span>•</span>
                      <span>{formatDateTime(abono.fechaAbono)}</span>
                    </div>
                    {abono.referencia && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Ref: {abono.referencia}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
                      <FaUser className="w-3 h-3" />
                      {abono.usuarioNombre}
                    </div>
                  </div>
                  <button
                    onClick={() => handleReimprimirAbono(abono)}
                    className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                    title="Reimprimir recibo"
                  >
                    <FaPrint className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Información Principal */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        {/* Estudiante */}
        <div className="flex items-start gap-4 pb-4 border-b border-neutral-200 dark:border-dark-border">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <FaUserGraduate className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-1">
              Estudiante
            </label>
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {pago.estudianteNombre} {pago.estudianteApellidos}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Matrícula #{pago.matriculaId}
            </p>
          </div>
        </div>

        {/* Fechas */}
        <div className="pt-4">
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-4">
            Fechas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Vencimiento
              </label>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className={`text-sm ${pago.estado === EstadoPago.VENCIDO ? 'text-red-600 dark:text-red-400 font-medium' : 'text-neutral-600 dark:text-neutral-400'}`}>
                  {formatDate(pago.fechaVencimiento)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Generación
              </label>
              <div className="flex items-center gap-2">
                <FaCalendarAlt className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDateTime(pago.fechaGenerado)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Última Actualización
              </label>
              <div className="flex items-center gap-2">
                <FaClock className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  {formatDateTime(pago.fechaActualizacion)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Abono */}
      {abonoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeAbonoModal}
          />
          <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
              Registrar Abono
            </h2>

            {resumen && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  Saldo pendiente: <span className="font-bold">{formatMonto(resumen.saldoPendiente)}</span>
                </p>
              </div>
            )}

            {abonoError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-700 dark:text-red-400">{abonoError}</p>
              </div>
            )}

            <form onSubmit={handleAbonoSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Monto <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <input
                    type="number"
                    value={abonoForm.monto || ''}
                    onChange={(e) => setAbonoForm({ ...abonoForm, monto: parseFloat(e.target.value) || 0 })}
                    disabled={abonoLoading}
                    min="0.01"
                    step="0.01"
                    max={resumen?.saldoPendiente}
                    className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Método de Pago <span className="text-red-500">*</span>
                </label>
                <select
                  value={abonoForm.metodoPago}
                  onChange={(e) => setAbonoForm({ ...abonoForm, metodoPago: e.target.value })}
                  disabled={abonoLoading}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 disabled:opacity-50"
                >
                  {METODOS_PAGO.map((metodo) => (
                    <option key={metodo} value={metodo}>{metodo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Referencia / Comprobante
                </label>
                <input
                  type="text"
                  value={abonoForm.referencia}
                  onChange={(e) => setAbonoForm({ ...abonoForm, referencia: e.target.value })}
                  disabled={abonoLoading}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 disabled:opacity-50"
                  placeholder="Ej: TRF-123456"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Nota
                </label>
                <textarea
                  value={abonoForm.nota}
                  onChange={(e) => setAbonoForm({ ...abonoForm, nota: e.target.value })}
                  disabled={abonoLoading}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 disabled:opacity-50 resize-none"
                  placeholder="Notas adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeAbonoModal}
                  disabled={abonoLoading}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={abonoLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {abonoLoading ? (
                    <>
                      <CgSpinner className="w-4 h-4 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <FaCheckCircle className="w-4 h-4" />
                      Registrar Abono
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
