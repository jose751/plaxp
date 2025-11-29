import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaSave } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  crearCategoriaApi,
  actualizarCategoriaApi,
  obtenerCategoriaPorIdApi,
  obtenerArbolCategoriasApi,
} from '../api/categoriasApi';
import type { CrearCategoriaData, CategoriaConHijos } from '../types/categoria.types';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';

export const CreateEditCategoriaPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CrearCategoriaData>({
    nombre: '',
    slug: '',
    descripcion: '',
    parentId: null,
    orden: 0,
    esVisible: true,
    permiteCursos: true,
    sincronizadoMoodle: false,
  });

  const [categorias, setCategorias] = useState<CategoriaConHijos[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingCategoria, setLoadingCategoria] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Guardando datos...');

  // Cargar categoría si es modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadCategoriaData(id);
    }
  }, [isEditMode, id]);

  // Cargar árbol de categorías para el selector
  useEffect(() => {
    fetchCategorias();
  }, []);

  const loadCategoriaData = async (categoriaId: string) => {
    setLoadingCategoria(true);
    try {
      const response = await obtenerCategoriaPorIdApi(categoriaId);
      const cat = response.data;

      setFormData({
        nombre: cat.nombre,
        slug: cat.slug || '',
        descripcion: cat.descripcion || '',
        parentId: cat.parentId,
        orden: cat.orden,
        esVisible: cat.esVisible,
        permiteCursos: cat.permiteCursos,
      });
    } catch (error) {
      console.error('Error al cargar categoría:', error);
      setApiError('Error al cargar la información de la categoría');
    } finally {
      setLoadingCategoria(false);
    }
  };

  const fetchCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const response = await obtenerArbolCategoriasApi(true, undefined);
      if (response.success) {
        setCategorias(response.data);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoadingCategorias(false);
    }
  };

  // Función para aplanar el árbol de categorías y crear opciones para el select
  const aplanarCategorias = (cats: CategoriaConHijos[], nivel = 0, prefix = ''): { value: string; label: string }[] => {
    let opciones: { value: string; label: string }[] = [];

    cats.forEach(cat => {
      // No incluir la categoría actual si estamos editando (no puede ser su propio padre)
      if (!(isEditMode && cat.id === id)) {
        const indent = '  '.repeat(nivel);
        opciones.push({
          value: cat.id,
          label: `${indent}${prefix}${cat.nombre}`,
        });

        if (cat.hijos && cat.hijos.length > 0) {
          opciones = opciones.concat(aplanarCategorias(cat.hijos, nivel + 1, '└─ '));
        }
      }
    });

    return opciones;
  };

  const opcionesCategorias = [
    { value: '', label: 'Sin categoría padre (Raíz)' },
    ...aplanarCategorias(categorias),
  ];

  const validateField = (name: string, value: string | boolean | number) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value || (typeof value === 'string' && value.trim().length < 3)) {
          error = 'El nombre debe tener al menos 3 caracteres';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | boolean | number = value;

    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'number') {
      fieldValue = parseInt(value, 10) || 0;
    } else if (name === 'parentId' && value === '') {
      fieldValue = null as any;
    }

    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (errors[name] !== undefined) {
      validateField(name, fieldValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const nombreValid = validateField('nombre', formData.nombre);

    if (!nombreValid) {
      return;
    }

    setLoading(true);
    setLoadingMessage(isEditMode ? 'Actualizando categoría...' : 'Creando categoría...');

    try {
      let response;

      if (isEditMode && id) {
        response = await actualizarCategoriaApi(id, formData);
      } else {
        response = await crearCategoriaApi(formData);
      }

      if (response.success) {
        setShowSuccess(true);

        setTimeout(() => {
          navigate('/categorias');
        }, 2000);
      } else {
        setApiError(`Error al ${isEditMode ? 'actualizar' : 'crear'} la categoría`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} categoría:`, error);
      setApiError(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} la categoría. Por favor, intente nuevamente.`);
      setLoading(false);
    }
  };

  if (loadingCategoria) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-primary dark:text-purple-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información de la categoría...</p>
      </div>
    );
  }

  return (
    <>
      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={loading}
        message={loadingMessage}
        isSuccess={showSuccess}
        successMessage={isEditMode ? '¡Categoría actualizada exitosamente!' : '¡Categoría creada exitosamente!'}
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/categorias')}
          disabled={loading}
          className="flex items-center gap-2 text-primary dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-colors disabled:opacity-50 font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Categorías de Cursos</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/30">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {isEditMode ? 'Editar Categoría de Curso' : 'Crear Nueva Categoría de Curso'}
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 mt-1">
              {isEditMode ? 'Modifica la información de la categoría de curso' : 'Completa los datos para crear una nueva categoría de curso'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-200">
              {isEditMode ? 'Categoría actualizada exitosamente' : 'Categoría creada exitosamente'}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">Redirigiendo...</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {apiError && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
          <FaExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-900 dark:text-red-200">{apiError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Información Básica</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {/* Nombre */}
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
                className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 transition-all ${
                  errors.nombre
                    ? 'border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900'
                    : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed placeholder:text-neutral-400 dark:placeholder:text-neutral-500`}
                placeholder="Ej: Desarrollo Web"
              />
              {errors.nombre && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Código */}
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Código
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug || ''}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                placeholder="desarrollo-web"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Si se deja vacío, se generará automáticamente del nombre</p>
            </div>

            {/* Categoría Padre */}
            <div>
              <label htmlFor="parentId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Categoría Padre
              </label>
              <select
                id="parentId"
                name="parentId"
                value={formData.parentId || ''}
                onChange={handleChange}
                disabled={loading || loadingCategorias}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
              >
                {opcionesCategorias.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Orden */}
            <div>
              <label htmlFor="orden" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Orden
              </label>
              <input
                type="number"
                id="orden"
                name="orden"
                value={formData.orden}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                placeholder="0"
              />
            </div>

            {/* Descripción - Span completo */}
            <div className="lg:col-span-2">
              <label htmlFor="descripcion" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Descripción
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                disabled={loading}
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed resize-none"
                placeholder="Describe la categoría..."
              />
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Opciones</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Es Visible */}
            <div className="flex items-center gap-3 border border-neutral-300 dark:border-dark-border rounded-lg p-3">
              <input
                type="checkbox"
                id="esVisible"
                name="esVisible"
                checked={formData.esVisible}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 accent-purple-600 border-neutral-300 rounded focus:ring-2 focus:ring-purple-100"
              />
              <label htmlFor="esVisible" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer flex-1">
                Visible en la interfaz
              </label>
            </div>

            {/* Permite Cursos */}
            <div className="flex items-center gap-3 border border-neutral-300 dark:border-dark-border rounded-lg p-3">
              <input
                type="checkbox"
                id="permiteCursos"
                name="permiteCursos"
                checked={formData.permiteCursos}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 accent-purple-600 border-neutral-300 rounded focus:ring-2 focus:ring-purple-100"
              />
              <label htmlFor="permiteCursos" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer flex-1">
                Permite cursos directamente
              </label>
            </div>
          </div>
        </div>

        {/* Footer con botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
          <button
            type="button"
            onClick={() => navigate('/categorias')}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2  bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/30 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <CgSpinner className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                {isEditMode ? 'Guardar Cambios' : 'Crear Categoría'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};
