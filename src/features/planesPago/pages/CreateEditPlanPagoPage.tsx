import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaCreditCard,
  FaCheckCircle,
  FaExclamationCircle,
  FaSave,
  FaDollarSign,
  FaSync,
  FaLayerGroup,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  crearPlanPagoApi,
  actualizarPlanPagoApi,
  obtenerPlanPagoPorIdApi,
  listarImpuestosApi,
  listarMonedasApi,
} from '../api/planesPagoApi';
import type { CrearPlanPagoData, Impuesto, Moneda } from '../types/planPago.types';
import { TipoPago, PeriodicidadUnidad } from '../types/planPago.types';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';

export const CreateEditPlanPagoPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CrearPlanPagoData>({
    nombre: '',
    descripcion: '',
    tipoPago: TipoPago.UNICO,
    idMoneda: '',
    idImpuesto: '',
    subtotal: 0,
    total: 0,
    periodicidadValor: 1,
    idPeriodicidadUnidad: PeriodicidadUnidad.MESES,
    numeroCuotas: 1,
    subtotalFinal: 0,
    totalFinal: 0,
    activo: true,
  });

  const [impuestos, setImpuestos] = useState<Impuesto[]>([]);
  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [lastEditedField, setLastEditedField] = useState<'subtotal' | 'total' | 'subtotalFinal' | 'totalFinal' | 'numeroCuotas' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingCatalogs, setLoadingCatalogs] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Guardando datos...');

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (isEditMode && id && !loadingCatalogs) {
      loadPlanData(id);
    }
  }, [isEditMode, id, loadingCatalogs]);

  // Helper para redondear a 2 decimales
  const round2 = (num: number) => Math.round(num * 100) / 100;

  // Helper para obtener la tasa del impuesto
  const getTasaImpuesto = (): number => {
    const impuesto = impuestos.find((i) => i.id === formData.idImpuesto);
    return impuesto ? impuesto.tasa / 100 : 0;
  };

  // Recalcular campos según el último editado
  useEffect(() => {
    if (!lastEditedField || !formData.idImpuesto) return;

    const tasa = getTasaImpuesto();
    if (tasa === 0 && !impuestos.find((i) => i.id === formData.idImpuesto)) return;

    const { subtotal, total, numeroCuotas, subtotalFinal, totalFinal, tipoPago } = formData;

    setFormData((prev) => {
      const updates: Partial<CrearPlanPagoData> = {};

      switch (lastEditedField) {
        case 'subtotal':
          // Subtotal editado -> calcular total
          updates.total = round2(subtotal * (1 + tasa));
          if (tipoPago === TipoPago.CUOTAS && numeroCuotas) {
            updates.subtotalFinal = round2(subtotal * numeroCuotas);
            updates.totalFinal = round2(updates.total * numeroCuotas);
          }
          break;

        case 'total':
          // Total editado -> calcular subtotal
          updates.subtotal = round2(total / (1 + tasa));
          if (tipoPago === TipoPago.CUOTAS && numeroCuotas) {
            updates.subtotalFinal = round2(updates.subtotal * numeroCuotas);
            updates.totalFinal = round2(total * numeroCuotas);
          }
          break;

        case 'subtotalFinal':
          // SubtotalFinal editado -> calcular cuota y totales
          if (tipoPago === TipoPago.CUOTAS && numeroCuotas && numeroCuotas > 0 && subtotalFinal) {
            updates.subtotal = round2(subtotalFinal / numeroCuotas);
            updates.total = round2(updates.subtotal * (1 + tasa));
            updates.totalFinal = round2(updates.total * numeroCuotas);
          }
          break;

        case 'totalFinal':
          // TotalFinal editado -> calcular cuota y subtotales
          if (tipoPago === TipoPago.CUOTAS && numeroCuotas && numeroCuotas > 0 && totalFinal) {
            updates.total = round2(totalFinal / numeroCuotas);
            updates.subtotal = round2(updates.total / (1 + tasa));
            updates.subtotalFinal = round2(updates.subtotal * numeroCuotas);
          }
          break;

        case 'numeroCuotas':
          // Número de cuotas editado -> recalcular finales basado en cuota unitaria
          if (tipoPago === TipoPago.CUOTAS && numeroCuotas && numeroCuotas > 0) {
            updates.subtotalFinal = round2(subtotal * numeroCuotas);
            updates.totalFinal = round2(total * numeroCuotas);
          }
          break;
      }

      return { ...prev, ...updates };
    });
  }, [formData.subtotal, formData.total, formData.subtotalFinal, formData.totalFinal, formData.numeroCuotas, lastEditedField]);

  // Recalcular cuando cambia el impuesto
  useEffect(() => {
    if (!formData.idImpuesto || impuestos.length === 0) return;

    const tasa = getTasaImpuesto();
    const { subtotal, total, numeroCuotas, tipoPago } = formData;

    // Priorizar subtotal como base si existe
    if (subtotal > 0) {
      const nuevoTotal = round2(subtotal * (1 + tasa));
      setFormData((prev) => ({
        ...prev,
        total: nuevoTotal,
        ...(tipoPago === TipoPago.CUOTAS && numeroCuotas
          ? {
              subtotalFinal: round2(subtotal * numeroCuotas),
              totalFinal: round2(nuevoTotal * numeroCuotas),
            }
          : {}),
      }));
    } else if (total > 0) {
      const nuevoSubtotal = round2(total / (1 + tasa));
      setFormData((prev) => ({
        ...prev,
        subtotal: nuevoSubtotal,
        ...(tipoPago === TipoPago.CUOTAS && numeroCuotas
          ? {
              subtotalFinal: round2(nuevoSubtotal * numeroCuotas),
              totalFinal: round2(total * numeroCuotas),
            }
          : {}),
      }));
    }
  }, [formData.idImpuesto]);

  const loadCatalogs = async () => {
    setLoadingCatalogs(true);
    try {
      const [impuestosRes, monedasRes] = await Promise.all([
        listarImpuestosApi({ activo: true }),
        listarMonedasApi({ activo: true }),
      ]);

      if (impuestosRes.success) {
        setImpuestos(impuestosRes.data);
      }
      if (monedasRes.success) {
        setMonedas(monedasRes.data);
        // Establecer moneda por defecto si hay solo una
        if (monedasRes.data.length === 1) {
          setFormData((prev) => ({ ...prev, idMoneda: monedasRes.data[0].id }));
        }
      }
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
      setApiError('Error al cargar los catálogos de impuestos y monedas');
    } finally {
      setLoadingCatalogs(false);
    }
  };

  const loadPlanData = async (planId: string) => {
    setLoadingPlan(true);
    try {
      const response = await obtenerPlanPagoPorIdApi(planId);
      const plan = response.data;

      setFormData({
        nombre: plan.nombre,
        descripcion: plan.descripcion || '',
        tipoPago: plan.tipoPago,
        idMoneda: plan.idMoneda,
        idImpuesto: plan.idImpuesto,
        subtotal: plan.subtotal,
        total: plan.total,
        periodicidadValor: plan.periodicidadValor || 1,
        idPeriodicidadUnidad: plan.idPeriodicidadUnidad || PeriodicidadUnidad.MESES,
        numeroCuotas: plan.numeroCuotas || 1,
        subtotalFinal: plan.subtotalFinal || 0,
        totalFinal: plan.totalFinal || 0,
        activo: plan.activo,
      });
    } catch (error) {
      console.error('Error al cargar plan de pago:', error);
      setApiError('Error al cargar la información del plan de pago');
    } finally {
      setLoadingPlan(false);
    }
  };

  const validateField = (name: string, value: string | number | boolean) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          error = 'El nombre es requerido';
        } else if (typeof value === 'string' && value.length > 150) {
          error = 'El nombre no debe exceder 150 caracteres';
        }
        break;
      case 'idMoneda':
        if (!value) {
          error = 'La moneda es requerida';
        }
        break;
      case 'idImpuesto':
        if (!value) {
          error = 'El impuesto es requerido';
        }
        break;
      case 'total':
        if (typeof value === 'number' && value < 0) {
          error = 'El total no puede ser negativo';
        } else if (typeof value === 'number' && value === 0) {
          error = 'El total es requerido';
        }
        break;
      case 'periodicidadValor':
        if (
          formData.tipoPago === TipoPago.RECURRENTE &&
          (typeof value !== 'number' || value < 1)
        ) {
          error = 'El valor de periodicidad debe ser al menos 1';
        }
        break;
      case 'numeroCuotas':
        if (formData.tipoPago === TipoPago.CUOTAS && (typeof value !== 'number' || value < 1)) {
          error = 'El número de cuotas debe ser al menos 1';
        }
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let fieldValue: string | number | boolean = value;

    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      // Permitir campo vacío (no forzar a 0)
      fieldValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'tipoPago' || name === 'idPeriodicidadUnidad') {
      fieldValue = parseInt(value, 10);
    }

    // Rastrear cuál campo de monto se está editando
    const montoFields = ['subtotal', 'total', 'subtotalFinal', 'totalFinal', 'numeroCuotas'];
    if (montoFields.includes(name)) {
      setLastEditedField(name as typeof lastEditedField);
    }

    setFormData((prev) => ({ ...prev, [name]: fieldValue }));

    if (errors[name] !== undefined) {
      validateField(name, fieldValue);
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let fieldValue: string | number | boolean = value;
    if (type === 'number') {
      fieldValue = parseFloat(value) || 0;
    }
    validateField(name, fieldValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const nombreValid = validateField('nombre', formData.nombre);
    const monedaValid = validateField('idMoneda', formData.idMoneda);
    const impuestoValid = validateField('idImpuesto', formData.idImpuesto);
    const totalValid = validateField('total', formData.total);

    let periodicidadValid = true;
    let cuotasValid = true;

    if (formData.tipoPago === TipoPago.RECURRENTE) {
      periodicidadValid = validateField('periodicidadValor', formData.periodicidadValor || 0);
    }
    if (formData.tipoPago === TipoPago.CUOTAS) {
      cuotasValid = validateField('numeroCuotas', formData.numeroCuotas || 0);
    }

    if (
      !nombreValid ||
      !monedaValid ||
      !impuestoValid ||
      !totalValid ||
      !periodicidadValid ||
      !cuotasValid
    ) {
      return;
    }

    setLoading(true);
    setLoadingMessage(isEditMode ? 'Actualizando plan de pago...' : 'Creando plan de pago...');

    try {
      // Preparar datos según el tipo de pago
      const dataToSend: CrearPlanPagoData = {
        nombre: formData.nombre,
        descripcion: formData.descripcion || undefined,
        tipoPago: formData.tipoPago,
        idMoneda: formData.idMoneda,
        idImpuesto: formData.idImpuesto,
        subtotal: formData.subtotal,
        total: formData.total,
        activo: formData.activo,
      };

      if (formData.tipoPago === TipoPago.RECURRENTE) {
        dataToSend.periodicidadValor = formData.periodicidadValor;
        dataToSend.idPeriodicidadUnidad = formData.idPeriodicidadUnidad;
      }

      if (formData.tipoPago === TipoPago.CUOTAS) {
        dataToSend.numeroCuotas = formData.numeroCuotas;
        dataToSend.subtotalFinal = formData.subtotalFinal;
        dataToSend.totalFinal = formData.totalFinal;
      }

      let response;

      if (isEditMode && id) {
        response = await actualizarPlanPagoApi(id, dataToSend);
      } else {
        response = await crearPlanPagoApi(dataToSend);
      }

      if (response.success) {
        setShowSuccess(true);

        setTimeout(() => {
          navigate('/planes-pago');
        }, 2000);
      } else {
        setApiError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el plan de pago`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} plan de pago:`, error);
      setApiError(
        error.message ||
          `Error al ${isEditMode ? 'actualizar' : 'crear'} el plan de pago. Por favor, intente nuevamente.`
      );
      setLoading(false);
    }
  };

  const getPeriodicidadLabel = (unidad: PeriodicidadUnidad): string => {
    switch (unidad) {
      case PeriodicidadUnidad.DIAS:
        return 'día(s)';
      case PeriodicidadUnidad.SEMANAS:
        return 'semana(s)';
      case PeriodicidadUnidad.MESES:
        return 'mes(es)';
      case PeriodicidadUnidad.ANIOS:
        return 'año(s)';
      default:
        return '';
    }
  };

  const getMonedaSimbolo = (): string => {
    const moneda = monedas.find((m) => m.id === formData.idMoneda);
    return moneda?.simbolo || '$';
  };

  if (loadingPlan || loadingCatalogs) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-rose-600 dark:text-rose-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
          {loadingCatalogs
            ? 'Cargando catálogos...'
            : 'Cargando información del plan de pago...'}
        </p>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay
        isVisible={loading}
        message={loadingMessage}
        isSuccess={showSuccess}
        successMessage={
          isEditMode
            ? '¡Plan de pago actualizado exitosamente!'
            : '¡Plan de pago creado exitosamente!'
        }
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        <div className="mb-4">
          <button
            onClick={() => navigate('/planes-pago')}
            disabled={loading}
            className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 mb-4 transition-colors disabled:opacity-50 font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Planes de Pago</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-500/30">
              <FaCreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditMode ? 'Editar Plan de Pago' : 'Crear Nuevo Plan de Pago'}
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {isEditMode
                  ? 'Modifica la información del plan de pago'
                  : 'Completa los datos para crear un nuevo plan de pago'}
              </p>
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                {isEditMode
                  ? 'Plan de pago actualizado exitosamente'
                  : 'Plan de pago creado exitosamente'}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                Redirigiendo...
              </p>
            </div>
          </div>
        )}

        {apiError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <FaExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 dark:text-red-200">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Información del Plan
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              <div className="lg:col-span-2">
                <label
                  htmlFor="nombre"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.nombre
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed placeholder:text-neutral-400 dark:placeholder:text-neutral-500`}
                  placeholder="Ej: Membresía Premium Mensual"
                />
                {errors.nombre && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.nombre}
                  </p>
                )}
              </div>

              <div className="lg:col-span-2">
                <label
                  htmlFor="descripcion"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  disabled={loading}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed placeholder:text-neutral-400 dark:placeholder:text-neutral-500 resize-none"
                  placeholder="Descripción detallada del plan de pago..."
                />
              </div>

              <div>
                <label
                  htmlFor="idMoneda"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Moneda <span className="text-red-500">*</span>
                </label>
                <select
                  id="idMoneda"
                  name="idMoneda"
                  value={formData.idMoneda}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.idMoneda
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                >
                  <option value="">Seleccionar moneda</option>
                  {monedas.map((moneda) => (
                    <option key={moneda.id} value={moneda.id}>
                      {moneda.codigo} - {moneda.nombre} ({moneda.simbolo})
                    </option>
                  ))}
                </select>
                {errors.idMoneda && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.idMoneda}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="idImpuesto"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Impuesto <span className="text-red-500">*</span>
                </label>
                <select
                  id="idImpuesto"
                  name="idImpuesto"
                  value={formData.idImpuesto}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.idImpuesto
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                >
                  <option value="">Seleccionar impuesto</option>
                  {impuestos.map((impuesto) => (
                    <option key={impuesto.id} value={impuesto.id}>
                      {impuesto.nombre} ({impuesto.tasa}%)
                    </option>
                  ))}
                </select>
                {errors.idImpuesto && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.idImpuesto}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tipo de Pago */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Tipo de Pago
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() =>
                  !loading && setFormData((prev) => ({ ...prev, tipoPago: TipoPago.UNICO }))
                }
                disabled={loading}
                className={`flex items-center justify-center gap-3 px-4 py-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.tipoPago === TipoPago.UNICO
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-400 dark:border-blue-600 shadow-md'
                    : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FaDollarSign
                  className={`w-5 h-5 ${
                    formData.tipoPago === TipoPago.UNICO
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                />
                <div className="text-left">
                  <span
                    className={`text-sm font-semibold block ${
                      formData.tipoPago === TipoPago.UNICO
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Pago Único
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Una sola transacción
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  !loading && setFormData((prev) => ({ ...prev, tipoPago: TipoPago.RECURRENTE }))
                }
                disabled={loading}
                className={`flex items-center justify-center gap-3 px-4 py-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.tipoPago === TipoPago.RECURRENTE
                    ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-400 dark:border-purple-600 shadow-md'
                    : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border hover:border-purple-300 dark:hover:border-purple-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FaSync
                  className={`w-5 h-5 ${
                    formData.tipoPago === TipoPago.RECURRENTE
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                />
                <div className="text-left">
                  <span
                    className={`text-sm font-semibold block ${
                      formData.tipoPago === TipoPago.RECURRENTE
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Recurrente
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Cobros periódicos
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  !loading && setFormData((prev) => ({ ...prev, tipoPago: TipoPago.CUOTAS }))
                }
                disabled={loading}
                className={`flex items-center justify-center gap-3 px-4 py-4 rounded-lg border-2 transition-all duration-200 ${
                  formData.tipoPago === TipoPago.CUOTAS
                    ? 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border-amber-400 dark:border-amber-600 shadow-md'
                    : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border hover:border-amber-300 dark:hover:border-amber-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <FaLayerGroup
                  className={`w-5 h-5 ${
                    formData.tipoPago === TipoPago.CUOTAS
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-neutral-400 dark:text-neutral-500'
                  }`}
                />
                <div className="text-left">
                  <span
                    className={`text-sm font-semibold block ${
                      formData.tipoPago === TipoPago.CUOTAS
                        ? 'text-amber-700 dark:text-amber-300'
                        : 'text-neutral-600 dark:text-neutral-400'
                    }`}
                  >
                    Cuotas
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Pagos fraccionados
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Configuración de Montos */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Configuración de Montos
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
              <div>
                <label
                  htmlFor="subtotal"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Subtotal (sin impuesto)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 text-sm">
                    {getMonedaSimbolo()}
                  </span>
                  <input
                    type="number"
                    id="subtotal"
                    name="subtotal"
                    value={formData.subtotal || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                      errors.subtotal
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                        : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                    } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                    placeholder="0.00"
                  />
                </div>
                {errors.subtotal && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.subtotal}
                  </p>
                )}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Precio base sin impuesto
                </p>
              </div>

              <div>
                <label
                  htmlFor="total"
                  className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                >
                  Total (con impuesto) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 text-sm">
                    {getMonedaSimbolo()}
                  </span>
                  <input
                    type="number"
                    id="total"
                    name="total"
                    value={formData.total || ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={loading}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                      errors.total
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                        : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                    } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                    placeholder="0.00"
                  />
                </div>
                {errors.total && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.total}
                  </p>
                )}
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  Precio final que pagará el cliente
                </p>
              </div>
            </div>

            {/* Configuración para Recurrente */}
            {formData.tipoPago === TipoPago.RECURRENTE && (
              <div className="mt-5 pt-5 border-t border-neutral-200 dark:border-dark-border">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Configuración de Periodicidad
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="periodicidadValor"
                      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                    >
                      Cada <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="periodicidadValor"
                      name="periodicidadValor"
                      value={formData.periodicidadValor}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={loading}
                      min="1"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                        errors.periodicidadValor
                          ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                          : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                      } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                    />
                    {errors.periodicidadValor && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <FaExclamationCircle className="w-3 h-3" />
                        {errors.periodicidadValor}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="idPeriodicidadUnidad"
                      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                    >
                      Unidad de tiempo
                    </label>
                    <select
                      id="idPeriodicidadUnidad"
                      name="idPeriodicidadUnidad"
                      value={formData.idPeriodicidadUnidad}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                    >
                      <option value={PeriodicidadUnidad.DIAS}>Días</option>
                      <option value={PeriodicidadUnidad.SEMANAS}>Semanas</option>
                      <option value={PeriodicidadUnidad.MESES}>Meses</option>
                      <option value={PeriodicidadUnidad.ANIOS}>Años</option>
                    </select>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                  <FaSync className="inline w-4 h-4 mr-2 text-purple-500" />
                  Se cobrará {getMonedaSimbolo()}
                  {formData.total.toFixed(2)} cada {formData.periodicidadValor}{' '}
                  {getPeriodicidadLabel(formData.idPeriodicidadUnidad || PeriodicidadUnidad.MESES)}
                </p>
              </div>
            )}

            {/* Configuración para Cuotas */}
            {formData.tipoPago === TipoPago.CUOTAS && (
              <div className="mt-5 pt-5 border-t border-neutral-200 dark:border-dark-border">
                <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Configuración de Cuotas
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label
                      htmlFor="numeroCuotas"
                      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                    >
                      Número de cuotas <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      id="numeroCuotas"
                      name="numeroCuotas"
                      value={formData.numeroCuotas || ''}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      disabled={loading}
                      min="1"
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                        errors.numeroCuotas
                          ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                          : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                      } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                      placeholder="1"
                    />
                    {errors.numeroCuotas && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <FaExclamationCircle className="w-3 h-3" />
                        {errors.numeroCuotas}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="subtotalFinal"
                      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                    >
                      Subtotal Final
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 text-sm">
                        {getMonedaSimbolo()}
                      </span>
                      <input
                        type="number"
                        id="subtotalFinal"
                        name="subtotalFinal"
                        value={formData.subtotalFinal || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Total sin impuesto de todas las cuotas
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="totalFinal"
                      className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5"
                    >
                      Total Final
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 dark:text-neutral-400 text-sm">
                        {getMonedaSimbolo()}
                      </span>
                      <input
                        type="number"
                        id="totalFinal"
                        name="totalFinal"
                        value={formData.totalFinal || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loading}
                        min="0"
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      Total con impuesto de todas las cuotas
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-3 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                  <FaLayerGroup className="inline w-4 h-4 mr-2 text-amber-500" />
                  {formData.numeroCuotas || 0} cuotas de {getMonedaSimbolo()}
                  {(formData.total || 0).toFixed(2)}, totalizando {getMonedaSimbolo()}
                  {(formData.totalFinal || 0).toFixed(2)}
                </p>
              </div>
            )}
          </div>

          {/* Estado */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="activo"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                disabled={loading}
                className="w-5 h-5 accent-rose-600 border-neutral-300 rounded focus:ring-2 focus:ring-rose-200"
              />
              <label htmlFor="activo" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <FaCheckCircle
                    className={`w-4 h-4 ${formData.activo ? 'text-rose-500' : 'text-neutral-400'}`}
                  />
                  <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    Plan Activo
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              onClick={() => navigate('/planes-pago')}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-rose-500 to-rose-600 shadow-md shadow-rose-500/30 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {isEditMode ? 'Guardar Cambios' : 'Crear Plan'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
