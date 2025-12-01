import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaUser,
  FaCreditCard,
  FaCalendarAlt,
  FaSearch,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClipboardList,
  FaSave,
  FaExclamationCircle,
  FaTimes,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { listarEstudiantesApi } from '../../estudiantes/api/estudiantesApi';
import { listarPlanesPagoApi, obtenerPlanPagoPorIdApi } from '../../planesPago/api/planesPagoApi';
import { listarPeriodosLectivosApi } from '../../periodosLectivos/api/periodosLectivosApi';
import { crearMatriculaApi, validarMatriculaDuplicadaApi } from '../api/matriculasApi';
import { crearMatriculaPagoApi, crearAbonoApi } from '../../matriculasPagos/api/matriculasPagosApi';
import type { Estudiante } from '../../estudiantes/types/estudiante.types';
import type { PlanPago, TipoPago, PeriodicidadUnidad } from '../../planesPago/types/planPago.types';
import type { PeriodoLectivo } from '../../periodosLectivos/types/periodoLectivo.types';
import { UserAvatar } from '../../users/components/UserAvatar';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number, simbolo?: string): string => {
  return `${simbolo || '$'}${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
};

const getTipoPagoLabel = (tipo: TipoPago): string => {
  switch (tipo) {
    case 1: return 'Pago Único';
    case 2: return 'Recurrente';
    case 3: return 'Cuotas';
    default: return 'Desconocido';
  }
};

const addPeriod = (date: Date, valor: number, unidad: PeriodicidadUnidad): Date => {
  const result = new Date(date);
  switch (unidad) {
    case 1: result.setDate(result.getDate() + valor); break;
    case 2: result.setDate(result.getDate() + (valor * 7)); break;
    case 3: result.setMonth(result.getMonth() + valor); break;
    case 4: result.setFullYear(result.getFullYear() + valor); break;
  }
  return result;
};

export const CreateMatriculaPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Guardando...');

  // Estados del proceso de creación
  const [createdMatriculaId, setCreatedMatriculaId] = useState<string | null>(null);
  const [pagosGenerados, setPagosGenerados] = useState<{ id: string; numeroPago: number; total: number }[]>([]);

  // Estado para abono
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [referenciaAbono, setReferenciaAbono] = useState('');
  const [registrandoAbono, setRegistrandoAbono] = useState(false);
  const [abonoError, setAbonoError] = useState<string | null>(null);

  // Datos del formulario
  const [selectedEstudiante, setSelectedEstudiante] = useState<Estudiante | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanPago | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoLectivo | null>(null);
  const [controlFinalizacion, setControlFinalizacion] = useState(false);
  const [fechaMatricula, setFechaMatricula] = useState(new Date().toISOString().split('T')[0]);
  const [fechaProximoPago, setFechaProximoPago] = useState(new Date().toISOString().split('T')[0]);

  // Configuración de cuotas personalizadas
  const [fechasCuotas, setFechasCuotas] = useState<string[]>([]);
  const [modalPlanStep, setModalPlanStep] = useState<'select' | 'configure'>('select');
  const [tempSelectedPlan, setTempSelectedPlan] = useState<PlanPago | null>(null);
  const [periodicidadPreset, setPeriodicidadPreset] = useState<'mensual' | 'quincenal' | 'semanal' | 'personalizado'>('mensual');

  // Estados para modales de selección
  const [showEstudianteModal, setShowEstudianteModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Estados para estudiantes paginados
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [estudiantesPage, setEstudiantesPage] = useState(1);
  const [estudiantesTotalPages, setEstudiantesTotalPages] = useState(1);
  const [estudiantesTotal, setEstudiantesTotal] = useState(0);
  const [loadingEstudiantes, setLoadingEstudiantes] = useState(false);
  const [estudianteSearch, setEstudianteSearch] = useState('');

  // Listas
  const [planesPago, setPlanesPago] = useState<PlanPago[]>([]);
  const [periodosLectivos, setPeriodosLectivos] = useState<PeriodoLectivo[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);
  const [loadingPeriodos, setLoadingPeriodos] = useState(false);

  // Errores de validación
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  // Cargar estudiantes paginados
  const fetchEstudiantes = useCallback(async (page: number, search?: string) => {
    setLoadingEstudiantes(true);
    try {
      const response = await listarEstudiantesApi({
        page,
        limit: 8,
        q: search || undefined,
        estado: true,
      });
      if (response.success) {
        setEstudiantes(response.data.estudiantes);
        setEstudiantesTotalPages(response.data.totalPages);
        setEstudiantesTotal(response.data.total);
      }
    } catch (err) {
      console.error('Error al cargar estudiantes:', err);
    } finally {
      setLoadingEstudiantes(false);
    }
  }, []);

  useEffect(() => {
    if (showEstudianteModal) {
      const timer = setTimeout(() => {
        fetchEstudiantes(estudiantesPage, estudianteSearch);
      }, estudianteSearch ? 300 : 0);
      return () => clearTimeout(timer);
    }
  }, [showEstudianteModal, estudiantesPage, estudianteSearch, fetchEstudiantes]);

  useEffect(() => {
    const fetchPlanes = async () => {
      setLoadingPlanes(true);
      try {
        const response = await listarPlanesPagoApi({ activo: true, limit: 100 });
        if (response.success) {
          setPlanesPago(response.data.planesPago);
        }
      } catch (err) {
        console.error('Error al cargar planes de pago:', err);
      } finally {
        setLoadingPlanes(false);
      }
    };
    fetchPlanes();
  }, []);

  useEffect(() => {
    const fetchPeriodos = async () => {
      setLoadingPeriodos(true);
      try {
        const response = await listarPeriodosLectivosApi({ estado: 1, limit: 100 });
        if (response.success) {
          setPeriodosLectivos(response.data.periodosLectivos);
        }
      } catch (err) {
        console.error('Error al cargar períodos lectivos:', err);
      } finally {
        setLoadingPeriodos(false);
      }
    };
    fetchPeriodos();
  }, []);

  useEffect(() => {
    setEstudiantesPage(1);
  }, [estudianteSearch]);

  // Generar fechas de cuotas según periodicidad
  const generarFechasCuotas = (numCuotas: number, fechaInicio: string, preset: typeof periodicidadPreset) => {
    const fechas: string[] = [];
    let fechaBase = new Date(fechaInicio);

    for (let i = 0; i < numCuotas; i++) {
      if (i === 0) {
        fechas.push(fechaBase.toISOString().split('T')[0]);
      } else {
        let nuevaFecha = new Date(fechaBase);
        switch (preset) {
          case 'semanal':
            nuevaFecha = addPeriod(fechaBase, i * 1, 2); // cada semana
            break;
          case 'quincenal':
            nuevaFecha = addPeriod(fechaBase, i * 15, 1); // cada 15 días
            break;
          case 'mensual':
          default:
            nuevaFecha = addPeriod(fechaBase, i * 1, 3); // cada mes
            break;
        }
        fechas.push(nuevaFecha.toISOString().split('T')[0]);
      }
    }
    return fechas;
  };

  // Cuando se selecciona un plan por cuotas, generar fechas iniciales
  const handleSelectPlanInModal = (plan: PlanPago) => {
    if (plan.tipoPago === 3 && plan.numeroCuotas) {
      setTempSelectedPlan(plan);
      setPeriodicidadPreset('mensual');
      const fechasIniciales = generarFechasCuotas(plan.numeroCuotas, fechaProximoPago, 'mensual');
      setFechasCuotas(fechasIniciales);
      setModalPlanStep('configure');
    } else {
      // Plan sin cuotas, seleccionar directamente
      setSelectedPlan(plan);
      setFechasCuotas([]);
      setShowPlanModal(false);
      setErrors((prev) => ({ ...prev, plan: '' }));
    }
  };

  // Aplicar periodicidad a todas las cuotas
  const aplicarPeriodicidad = (preset: typeof periodicidadPreset) => {
    if (!tempSelectedPlan?.numeroCuotas) return;
    setPeriodicidadPreset(preset);
    if (preset !== 'personalizado') {
      const nuevasFechas = generarFechasCuotas(tempSelectedPlan.numeroCuotas, fechasCuotas[0] || fechaProximoPago, preset);
      setFechasCuotas(nuevasFechas);
    }
  };

  // Actualizar fecha individual de cuota
  const actualizarFechaCuota = (index: number, nuevaFecha: string) => {
    const nuevasFechas = [...fechasCuotas];
    nuevasFechas[index] = nuevaFecha;
    setFechasCuotas(nuevasFechas);
    setPeriodicidadPreset('personalizado');
  };

  // Confirmar selección de plan con cuotas configuradas
  const confirmarPlanConCuotas = () => {
    if (tempSelectedPlan) {
      setSelectedPlan(tempSelectedPlan);
      setShowPlanModal(false);
      setModalPlanStep('select');
      setErrors((prev) => ({ ...prev, plan: '' }));
    }
  };

  // Cancelar configuración de cuotas
  const cancelarConfiguracionCuotas = () => {
    setModalPlanStep('select');
    setTempSelectedPlan(null);
    setFechasCuotas([]);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedEstudiante) {
      newErrors.estudiante = 'Debe seleccionar un estudiante';
    }
    if (!selectedPlan) {
      newErrors.plan = 'Debe seleccionar un plan de pago';
    }
    if (!fechaMatricula) {
      newErrors.fechaMatricula = 'La fecha de matrícula es requerida';
    }
    if (!fechaProximoPago) {
      newErrors.fechaProximoPago = 'La fecha del primer pago es requerida';
    }
    if (controlFinalizacion && !selectedPeriodo) {
      newErrors.periodo = 'Debe seleccionar un período lectivo';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generarPagos = async (matriculaId: string, plan: PlanPago) => {
    const pagosCreados: { id: string; numeroPago: number; total: number }[] = [];

    try {
      const planCompleto = await obtenerPlanPagoPorIdApi(plan.id);
      const planData = planCompleto.data;

      if (planData.tipoPago === 1 || planData.tipoPago === 2) {
        // Pago único o recurrente
        const pago = await crearMatriculaPagoApi({
          matriculaId,
          numeroPago: 1,
          subtotal: planData.subtotal,
          total: planData.total,
          fechaVencimiento: fechaProximoPago,
        });
        if (pago.success) {
          pagosCreados.push({ id: pago.data.id, numeroPago: 1, total: pago.data.total });
        }
      } else if (planData.tipoPago === 3 && planData.numeroCuotas) {
        // Plan por cuotas - usar las fechas personalizadas
        const subtotalCuota = planData.subtotalFinal ? planData.subtotalFinal / planData.numeroCuotas : planData.subtotal;
        const totalCuota = planData.totalFinal ? planData.totalFinal / planData.numeroCuotas : planData.total;

        for (let i = 0; i < planData.numeroCuotas; i++) {
          const fechaVenc = fechasCuotas[i] || fechaProximoPago;

          const pago = await crearMatriculaPagoApi({
            matriculaId,
            numeroPago: i + 1,
            subtotal: Math.round(subtotalCuota * 100) / 100,
            total: Math.round(totalCuota * 100) / 100,
            fechaVencimiento: fechaVenc,
          });

          if (pago.success) {
            pagosCreados.push({ id: pago.data.id, numeroPago: i + 1, total: pago.data.total });
          }
        }
      }

      setPagosGenerados(pagosCreados);
    } catch (err) {
      console.error('Error al generar pagos:', err);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) return;
    if (!selectedEstudiante || !selectedPlan) return;

    setLoading(true);
    setLoadingMessage('Creando matrícula...');

    try {
      if (controlFinalizacion && selectedPeriodo) {
        const existeMatricula = await validarMatriculaDuplicadaApi(selectedEstudiante.id, selectedPeriodo.id);
        if (existeMatricula) {
          setApiError('Ya existe una matrícula para este estudiante en el período seleccionado');
          setLoading(false);
          return;
        }
      }

      const matriculaData = {
        estudianteId: selectedEstudiante.id,
        planPagoId: selectedPlan.id,
        fechaMatricula,
        fechaProximoPago,
        controlFinalizacion,
        periodoLectivoId: controlFinalizacion && selectedPeriodo ? selectedPeriodo.id : undefined,
        estado: 1 as const,
      };

      const matriculaRes = await crearMatriculaApi(matriculaData);

      if (!matriculaRes.success) {
        throw new Error(matriculaRes.message || 'Error al crear la matrícula');
      }

      const matriculaId = matriculaRes.data.id;
      setCreatedMatriculaId(matriculaId);

      setLoadingMessage('Generando pagos...');
      await generarPagos(matriculaId, selectedPlan);

      setLoading(false);
      setShowAbonoModal(true);

    } catch (err: any) {
      console.error('Error al crear matrícula:', err);
      setApiError(err.message || 'Error al crear la matrícula');
      setLoading(false);
    }
  };

  const handleRegistrarAbono = async () => {
    if (!pagosGenerados.length || montoAbono <= 0) return;

    setRegistrandoAbono(true);
    setAbonoError(null);
    try {
      await crearAbonoApi({
        matriculaPagoId: pagosGenerados[0].id,
        metodoPago,
        monto: montoAbono,
        referencia: referenciaAbono || undefined,
        nota: 'Abono inicial al momento de matrícula',
      });

      setShowAbonoModal(false);
      setShowSuccess(true);
      setLoadingMessage('');

      setTimeout(() => {
        navigate(`/matriculas/view/${createdMatriculaId}`);
      }, 1500);
    } catch (err: any) {
      console.error('Error al registrar abono:', err);
      setAbonoError(err.message || 'Error al registrar el abono');
    } finally {
      setRegistrandoAbono(false);
    }
  };

  const handleSkipAbono = () => {
    setShowAbonoModal(false);
    setShowSuccess(true);
    setLoadingMessage('');

    setTimeout(() => {
      navigate(`/matriculas/view/${createdMatriculaId}`);
    }, 1500);
  };

  const getEstudianteNombreCompleto = (est: Estudiante) =>
    `${est.nombre} ${est.primerApellido} ${est.segundoApellido || ''}`.trim();

  // Modal de Selección de Estudiante
  const renderEstudianteModal = () => {
    if (!showEstudianteModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowEstudianteModal(false)} />
        <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-2xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
                <FaUser className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                Seleccionar Estudiante
              </h2>
            </div>
            <button
              onClick={() => setShowEstudianteModal(false)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
            >
              <FaTimes className="w-4 h-4 text-neutral-500" />
            </button>
          </div>

          {/* Search */}
          <div className="px-5 py-3 border-b border-neutral-200 dark:border-dark-border">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
              <input
                type="text"
                value={estudianteSearch}
                onChange={(e) => setEstudianteSearch(e.target.value)}
                placeholder="Buscar por nombre o apellido..."
                className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {loadingEstudiantes ? (
              <div className="flex justify-center py-12">
                <CgSpinner className="w-8 h-8 text-orange-600 animate-spin" />
              </div>
            ) : estudiantes.length === 0 ? (
              <div className="py-12 text-center text-neutral-500">
                No se encontraron estudiantes
              </div>
            ) : (
              <div className="grid gap-2">
                {estudiantes.map((estudiante) => (
                  <button
                    key={estudiante.id}
                    onClick={() => {
                      setSelectedEstudiante(estudiante);
                      setShowEstudianteModal(false);
                      setErrors((prev) => ({ ...prev, estudiante: '' }));
                    }}
                    className="p-3 text-left rounded-lg border border-neutral-200 dark:border-dark-border hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all flex items-center gap-3"
                  >
                    <UserAvatar
                      nombre={getEstudianteNombreCompleto(estudiante)}
                      pathFoto={estudiante.pathFoto}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {getEstudianteNombreCompleto(estudiante)}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                        {estudiante.correo}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {estudiantesTotalPages > 1 && (
            <div className="px-5 py-3 border-t border-neutral-200 dark:border-dark-border flex items-center justify-between">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {estudiantesTotal} estudiantes
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEstudiantesPage(p => Math.max(1, p - 1))}
                  disabled={estudiantesPage === 1}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronLeft className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 px-3 py-1 bg-neutral-100 dark:bg-dark-hover rounded-lg">
                  {estudiantesPage} / {estudiantesTotalPages}
                </span>
                <button
                  onClick={() => setEstudiantesPage(p => Math.min(estudiantesTotalPages, p + 1))}
                  disabled={estudiantesPage === estudiantesTotalPages}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Modal de Selección de Plan (con configuración de cuotas)
  const renderPlanModal = () => {
    if (!showPlanModal) return null;

    const handleCloseModal = () => {
      setShowPlanModal(false);
      setModalPlanStep('select');
      setTempSelectedPlan(null);
    };

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCloseModal} />
        <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-2xl max-h-[85vh] flex flex-col">

          {/* PASO 1: Selección de Plan */}
          {modalPlanStep === 'select' && (
            <>
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
                    <FaCreditCard className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                    Seleccionar Plan de Pago
                  </h2>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <FaTimes className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5">
                {loadingPlanes ? (
                  <div className="flex justify-center py-12">
                    <CgSpinner className="w-8 h-8 text-orange-600 animate-spin" />
                  </div>
                ) : planesPago.length === 0 ? (
                  <div className="py-12 text-center text-neutral-500">
                    No hay planes de pago activos
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {planesPago.map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => handleSelectPlanInModal(plan)}
                        className="p-4 text-left rounded-lg border border-neutral-200 dark:border-dark-border hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {plan.nombre}
                              </p>
                              {plan.tipoPago === 3 && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded">
                                  {plan.numeroCuotas} cuotas
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">
                              {getTipoPagoLabel(plan.tipoPago)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                              {formatCurrency(plan.total, plan.moneda?.simbolo)}
                            </p>
                            {plan.tipoPago === 3 && plan.totalFinal && (
                              <p className="text-xs text-neutral-500">
                                Total: {formatCurrency(plan.totalFinal, plan.moneda?.simbolo)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* PASO 2: Configuración de Cuotas */}
          {modalPlanStep === 'configure' && tempSelectedPlan && (
            <>
              {/* Header */}
              <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <button
                    onClick={cancelarConfiguracionCuotas}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                  >
                    <FaArrowLeft className="w-4 h-4 text-neutral-500" />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                      Configurar Cuotas
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      {tempSelectedPlan.nombre} • {tempSelectedPlan.numeroCuotas} cuotas de {formatCurrency(tempSelectedPlan.total, tempSelectedPlan.moneda?.simbolo)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                >
                  <FaTimes className="w-4 h-4 text-neutral-500" />
                </button>
              </div>

              {/* Periodicidad Presets */}
              <div className="px-5 py-3 border-b border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-hover">
                <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                  Aplicar periodicidad:
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'semanal', label: 'Semanal' },
                    { key: 'quincenal', label: 'Quincenal' },
                    { key: 'mensual', label: 'Mensual' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => aplicarPeriodicidad(key as typeof periodicidadPreset)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                        periodicidadPreset === key
                          ? 'bg-orange-500 text-white shadow-md'
                          : 'bg-white dark:bg-dark-bg border border-neutral-200 dark:border-dark-border text-neutral-700 dark:text-neutral-300 hover:border-orange-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {periodicidadPreset === 'personalizado' && (
                    <span className="px-3 py-1.5 text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
                      Personalizado
                    </span>
                  )}
                </div>
              </div>

              {/* Lista de Cuotas */}
              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-2">
                  {fechasCuotas.map((fecha, index) => {
                    const montoCuota = tempSelectedPlan.totalFinal
                      ? tempSelectedPlan.totalFinal / (tempSelectedPlan.numeroCuotas || 1)
                      : tempSelectedPlan.total;

                    return (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-lg hover:border-orange-200 dark:hover:border-orange-800 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                            Cuota {index + 1}
                          </p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {formatCurrency(montoCuota, tempSelectedPlan.moneda?.simbolo)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="w-3.5 h-3.5 text-neutral-400" />
                          <input
                            type="date"
                            value={fecha}
                            onChange={(e) => actualizarFechaCuota(index, e.target.value)}
                            className="px-2 py-1.5 border border-neutral-200 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-4 border-t border-neutral-200 dark:border-dark-border flex gap-3">
                <button
                  onClick={cancelarConfiguracionCuotas}
                  className="px-4 py-2.5 border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover transition-all text-sm"
                >
                  Volver
                </button>
                <button
                  onClick={confirmarPlanConCuotas}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md shadow-orange-500/30 text-sm flex items-center justify-center gap-2"
                >
                  <FaCheckCircle className="w-4 h-4" />
                  Confirmar Plan y Cuotas
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Modal de Abono
  const renderAbonoModal = () => {
    if (!showAbonoModal) return null;

    const primerPago = pagosGenerados[0];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="relative bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border max-w-md w-full">
          {/* Header */}
          <div className="px-5 py-4 flex items-center justify-between border-b border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-md shadow-green-500/30">
                <FaCheckCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                  Matrícula Creada
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {pagosGenerados.length} pago(s) generado(s)
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div className="p-3 bg-neutral-50 dark:bg-dark-hover rounded-lg border border-neutral-200 dark:border-dark-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600 dark:text-neutral-400">Primer pago:</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formatCurrency(primerPago?.total || 0, selectedPlan?.moneda?.simbolo)}
                </span>
              </div>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              ¿Desea registrar un abono inicial?
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Monto del Abono
                </label>
                <input
                  type="number"
                  value={montoAbono || ''}
                  onChange={(e) => setMontoAbono(parseFloat(e.target.value) || 0)}
                  max={primerPago?.total}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-lg font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Método de Pago
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="sinpe">SINPE Móvil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Referencia
                  </label>
                  <input
                    type="text"
                    value={referenciaAbono}
                    onChange={(e) => setReferenciaAbono(e.target.value)}
                    placeholder="Opcional"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {abonoError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{abonoError}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-neutral-200 dark:border-dark-border flex gap-3">
            <button
              onClick={handleSkipAbono}
              disabled={registrandoAbono}
              className="flex-1 px-4 py-2.5 border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-700 dark:text-neutral-300 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover transition-all disabled:opacity-50 text-sm"
            >
              Omitir
            </button>
            <button
              onClick={handleRegistrarAbono}
              disabled={registrandoAbono || montoAbono <= 0}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-orange-500/30 text-sm"
            >
              {registrandoAbono ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Registrar Abono'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <LoadingOverlay
        isVisible={loading || showSuccess}
        message={loadingMessage}
        isSuccess={showSuccess}
        successMessage="¡Matrícula creada exitosamente!"
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/matriculas')}
            disabled={loading}
            className="flex items-center gap-2 text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 mb-4 transition-colors disabled:opacity-50 font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Matrículas</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30">
              <FaClipboardList className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                Nueva Matrícula
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Completa los datos para registrar una nueva matrícula
              </p>
            </div>
          </div>
        </div>

        {apiError && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
            <FaExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900 dark:text-red-200">{apiError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estudiante */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Estudiante <span className="text-red-500">*</span>
            </h2>

            {selectedEstudiante ? (
              <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    nombre={getEstudianteNombreCompleto(selectedEstudiante)}
                    pathFoto={selectedEstudiante.pathFoto}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">
                      {getEstudianteNombreCompleto(selectedEstudiante)}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {selectedEstudiante.correo}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEstudianteModal(true)}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowEstudianteModal(true)}
                className={`w-full p-4 border-2 border-dashed rounded-lg text-left transition-all flex items-center gap-3 ${
                  errors.estudiante
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                    : 'border-neutral-300 dark:border-dark-border hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-dark-hover flex items-center justify-center">
                  <FaUser className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-700 dark:text-neutral-300">
                    Seleccionar estudiante
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Haz clic para buscar y seleccionar
                  </p>
                </div>
              </button>
            )}

            {errors.estudiante && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                <FaExclamationCircle className="w-3 h-3" />
                {errors.estudiante}
              </p>
            )}
          </div>

          {/* Plan de Pago */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Plan de Pago <span className="text-red-500">*</span>
            </h2>

            {selectedPlan ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center">
                      <FaCreditCard className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-green-800 dark:text-green-300">
                        {selectedPlan.nombre}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {getTipoPagoLabel(selectedPlan.tipoPago)} • {formatCurrency(selectedPlan.total, selectedPlan.moneda?.simbolo)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModalPlanStep('select');
                      setTempSelectedPlan(null);
                      setShowPlanModal(true);
                    }}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>

                {/* Mostrar resumen de cuotas configuradas si es plan por cuotas */}
                {selectedPlan.tipoPago === 3 && fechasCuotas.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                      Fechas de cobro configuradas:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {fechasCuotas.slice(0, 4).map((fecha, i) => (
                        <span key={i} className="px-2 py-0.5 text-xs bg-white dark:bg-dark-bg border border-amber-300 dark:border-amber-700 rounded text-amber-700 dark:text-amber-300">
                          {i + 1}: {formatDate(fecha)}
                        </span>
                      ))}
                      {fechasCuotas.length > 4 && (
                        <span className="px-2 py-0.5 text-xs text-amber-600 dark:text-amber-400">
                          +{fechasCuotas.length - 4} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPlanModal(true)}
                className={`w-full p-4 border-2 border-dashed rounded-lg text-left transition-all flex items-center gap-3 ${
                  errors.plan
                    ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10'
                    : 'border-neutral-300 dark:border-dark-border hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/10'
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-dark-hover flex items-center justify-center">
                  <FaCreditCard className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <p className="font-medium text-neutral-700 dark:text-neutral-300">
                    Seleccionar plan de pago
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Haz clic para ver los planes disponibles
                  </p>
                </div>
              </button>
            )}

            {errors.plan && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                <FaExclamationCircle className="w-3 h-3" />
                {errors.plan}
              </p>
            )}
          </div>

          {/* Fechas */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              Configuración de Fechas
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fechaMatricula" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Fecha de Matrícula <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="date"
                    id="fechaMatricula"
                    value={fechaMatricula}
                    onChange={(e) => {
                      setFechaMatricula(e.target.value);
                      setErrors((prev) => ({ ...prev, fechaMatricula: '' }));
                    }}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                      errors.fechaMatricula
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100'
                        : 'border-neutral-300 dark:border-dark-border focus:border-orange-500 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
                {errors.fechaMatricula && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.fechaMatricula}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="fechaProximoPago" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Fecha Primer Pago <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                  <input
                    type="date"
                    id="fechaProximoPago"
                    value={fechaProximoPago}
                    onChange={(e) => {
                      setFechaProximoPago(e.target.value);
                      setErrors((prev) => ({ ...prev, fechaProximoPago: '' }));
                    }}
                    className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                      errors.fechaProximoPago
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-100'
                        : 'border-neutral-300 dark:border-dark-border focus:border-orange-500 focus:ring-orange-500/20'
                    }`}
                  />
                </div>
                {errors.fechaProximoPago && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.fechaProximoPago}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Control de Finalización */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="controlFinalizacion"
                checked={controlFinalizacion}
                onChange={(e) => {
                  setControlFinalizacion(e.target.checked);
                  if (!e.target.checked) {
                    setSelectedPeriodo(null);
                    setErrors((prev) => ({ ...prev, periodo: '' }));
                  }
                }}
                className="w-5 h-5 accent-orange-600 border-neutral-300 rounded focus:ring-2 focus:ring-orange-200"
              />
              <label htmlFor="controlFinalizacion" className="cursor-pointer">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Control de Finalización
                </span>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Vincular la matrícula a un período lectivo específico
                </p>
              </label>
            </div>

            {controlFinalizacion && (
              <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
                  Período Lectivo <span className="text-red-500">*</span>
                </label>
                {loadingPeriodos ? (
                  <div className="flex justify-center py-6">
                    <CgSpinner className="w-6 h-6 text-orange-600 animate-spin" />
                  </div>
                ) : periodosLectivos.length === 0 ? (
                  <div className="py-4 text-center text-neutral-500 text-sm">
                    No hay períodos lectivos activos
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {periodosLectivos.map((periodo) => (
                      <button
                        key={periodo.id}
                        type="button"
                        onClick={() => {
                          setSelectedPeriodo(periodo);
                          setErrors((prev) => ({ ...prev, periodo: '' }));
                        }}
                        className={`p-3 text-left rounded-lg border-2 transition-all ${
                          selectedPeriodo?.id === periodo.id
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : 'border-neutral-200 dark:border-dark-border hover:border-orange-300'
                        }`}
                      >
                        <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                          {periodo.nombre}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                          {formatDate(periodo.fechaInicio)} - {formatDate(periodo.fechaFin)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {errors.periodo && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.periodo}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              onClick={() => navigate('/matriculas')}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 shadow-md shadow-orange-500/30 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  Crear Matrícula
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modals */}
      {renderEstudianteModal()}
      {renderPlanModal()}
      {renderAbonoModal()}
    </>
  );
};
