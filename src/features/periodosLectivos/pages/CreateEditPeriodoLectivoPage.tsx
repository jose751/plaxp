import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaCheckCircle, FaExclamationCircle, FaSave, FaClock, FaTimesCircle, FaStar } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { crearPeriodoLectivoApi, actualizarPeriodoLectivoApi, obtenerPeriodoLectivoPorIdApi } from '../api/periodosLectivosApi';
import type { CrearPeriodoLectivoData } from '../types/periodoLectivo.types';
import { EstadoPeriodoLectivo } from '../types/periodoLectivo.types';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';

export const CreateEditPeriodoLectivoPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CrearPeriodoLectivoData>({
    nombre: '',
    fechaInicio: '',
    fechaFin: '',
    estado: EstadoPeriodoLectivo.PLANEADO,
    esActual: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Guardando datos...');

  useEffect(() => {
    if (isEditMode && id) {
      loadPeriodoData(id);
    }
  }, [isEditMode, id]);

  // Convierte fecha ISO a formato YYYY-MM-DD para input type="date"
  // Extrae directamente la parte de fecha para evitar problemas de zona horaria
  const formatDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const loadPeriodoData = async (periodoId: string) => {
    setLoadingPeriodo(true);
    try {
      const response = await obtenerPeriodoLectivoPorIdApi(periodoId);
      const periodo = response.data;

      setFormData({
        nombre: periodo.nombre,
        fechaInicio: formatDateForInput(periodo.fechaInicio),
        fechaFin: formatDateForInput(periodo.fechaFin),
        estado: periodo.estado,
        esActual: periodo.esActual,
      });
    } catch (error) {
      console.error('Error al cargar periodo lectivo:', error);
      setApiError('Error al cargar la información del periodo lectivo');
    } finally {
      setLoadingPeriodo(false);
    }
  };

  const validateField = (name: string, value: string | number | boolean) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          error = 'El nombre es requerido';
        } else if (typeof value === 'string' && value.length > 100) {
          error = 'El nombre no debe exceder 100 caracteres';
        }
        break;
      case 'fechaInicio':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          error = 'La fecha de inicio es requerida';
        }
        break;
      case 'fechaFin':
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          error = 'La fecha de fin es requerida';
        } else if (formData.fechaInicio && value < formData.fechaInicio) {
          error = 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | number | boolean = value;

    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'estado') {
      fieldValue = parseInt(value, 10);
    }

    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (errors[name] !== undefined) {
      validateField(name, fieldValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const nombreValid = validateField('nombre', formData.nombre);
    const fechaInicioValid = validateField('fechaInicio', formData.fechaInicio);
    const fechaFinValid = validateField('fechaFin', formData.fechaFin);

    if (!nombreValid || !fechaInicioValid || !fechaFinValid) {
      return;
    }

    setLoading(true);
    setLoadingMessage(isEditMode ? 'Actualizando periodo lectivo...' : 'Creando periodo lectivo...');

    try {
      let response;

      if (isEditMode && id) {
        response = await actualizarPeriodoLectivoApi(id, formData);
      } else {
        response = await crearPeriodoLectivoApi(formData);
      }

      if (response.success) {
        setShowSuccess(true);

        setTimeout(() => {
          navigate('/periodos-lectivos');
        }, 2000);
      } else {
        setApiError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el periodo lectivo`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} periodo lectivo:`, error);
      setApiError(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el periodo lectivo. Por favor, intente nuevamente.`);
      setLoading(false);
    }
  };

  if (loadingPeriodo) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-emerald-600 dark:text-emerald-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del periodo lectivo...</p>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay
        isVisible={loading}
        message={loadingMessage}
        isSuccess={showSuccess}
        successMessage={isEditMode ? '¡Periodo lectivo actualizado exitosamente!' : '¡Periodo lectivo creado exitosamente!'}
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        <div className="mb-4">
          <button
            onClick={() => navigate('/periodos-lectivos')}
            disabled={loading}
            className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 mb-4 transition-colors disabled:opacity-50 font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Periodos Lectivos</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30">
              <FaCalendarAlt className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditMode ? 'Editar Periodo Lectivo' : 'Crear Nuevo Periodo Lectivo'}
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {isEditMode ? 'Modifica la información del periodo lectivo' : 'Completa los datos para crear un nuevo periodo lectivo'}
              </p>
            </div>
          </div>
        </div>

        {showSuccess && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                {isEditMode ? 'Periodo lectivo actualizado exitosamente' : 'Periodo lectivo creado exitosamente'}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">Redirigiendo...</p>
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
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Información del Periodo</h2>

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
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
                placeholder="Ej: Primer Semestre 2025"
              />
              {errors.nombre && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.nombre}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5 mt-5">
              <div>
                <label htmlFor="fechaInicio" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Fecha de Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="fechaInicio"
                  name="fechaInicio"
                  value={formData.fechaInicio}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.fechaInicio
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                />
                {errors.fechaInicio && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.fechaInicio}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="fechaFin" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Fecha de Fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="fechaFin"
                  name="fechaFin"
                  value={formData.fechaFin}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.fechaFin
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                />
                {errors.fechaFin && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.fechaFin}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-5">
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2.5">
                Estado
              </label>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <button
                  type="button"
                  onClick={() => !loading && setFormData(prev => ({ ...prev, estado: EstadoPeriodoLectivo.PLANEADO }))}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.estado === EstadoPeriodoLectivo.PLANEADO
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-400 dark:border-blue-600 shadow-md'
                      : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FaClock className={`w-4 h-4 ${formData.estado === EstadoPeriodoLectivo.PLANEADO ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                  <span className={`text-sm font-semibold ${formData.estado === EstadoPeriodoLectivo.PLANEADO ? 'text-blue-700 dark:text-blue-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    Planeado
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => !loading && setFormData(prev => ({ ...prev, estado: EstadoPeriodoLectivo.ACTIVO }))}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.estado === EstadoPeriodoLectivo.ACTIVO
                      ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-400 dark:border-green-600 shadow-md'
                      : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border hover:border-green-300 dark:hover:border-green-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FaCheckCircle className={`w-4 h-4 ${formData.estado === EstadoPeriodoLectivo.ACTIVO ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                  <span className={`text-sm font-semibold ${formData.estado === EstadoPeriodoLectivo.ACTIVO ? 'text-green-700 dark:text-green-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    Activo
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => !loading && setFormData(prev => ({ ...prev, estado: EstadoPeriodoLectivo.FINALIZADO }))}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.estado === EstadoPeriodoLectivo.FINALIZADO
                      ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-400 dark:border-purple-600 shadow-md'
                      : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border hover:border-purple-300 dark:hover:border-purple-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FaCheckCircle className={`w-4 h-4 ${formData.estado === EstadoPeriodoLectivo.FINALIZADO ? 'text-purple-600 dark:text-purple-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                  <span className={`text-sm font-semibold ${formData.estado === EstadoPeriodoLectivo.FINALIZADO ? 'text-purple-700 dark:text-purple-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    Finalizado
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => !loading && setFormData(prev => ({ ...prev, estado: EstadoPeriodoLectivo.CANCELADO }))}
                  disabled={loading}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 transition-all duration-200 ${
                    formData.estado === EstadoPeriodoLectivo.CANCELADO
                      ? 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-400 dark:border-red-600 shadow-md'
                      : 'bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border hover:border-red-300 dark:hover:border-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <FaTimesCircle className={`w-4 h-4 ${formData.estado === EstadoPeriodoLectivo.CANCELADO ? 'text-red-600 dark:text-red-400' : 'text-neutral-400 dark:text-neutral-500'}`} />
                  <span className={`text-sm font-semibold ${formData.estado === EstadoPeriodoLectivo.CANCELADO ? 'text-red-700 dark:text-red-300' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    Cancelado
                  </span>
                </button>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                <input
                  type="checkbox"
                  id="esActual"
                  name="esActual"
                  checked={formData.esActual}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-5 h-5 accent-amber-600 border-neutral-300 rounded focus:ring-2 focus:ring-amber-200"
                />
                <label htmlFor="esActual" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FaStar className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Marcar como Periodo Actual</span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
                    Si se activa, el periodo actual anterior se desactivará automáticamente
                  </p>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              onClick={() => navigate('/periodos-lectivos')}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {isEditMode ? 'Guardar Cambios' : 'Crear Periodo'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
