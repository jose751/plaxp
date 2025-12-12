import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationCircle, FaSave, FaImage, FaTrash, FaCloudUploadAlt } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  crearCursoApi,
  actualizarCursoApi,
  obtenerCursoPorIdApi,
} from '../api/cursosApi';
import { listarCategoriasApi } from '../../categorias/api/categoriasApi';
import type { CrearCursoData } from '../types/curso.types';
import type { Categoria } from '../../categorias/types/categoria.types';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';
import { SucursalSelect } from '../../sucursales';
import { HorariosFormSection, type HorarioLocal } from '../../horarios/components/HorariosFormSection';
import { HorariosCursoManager } from '../../horarios/components/HorariosCursoManager';
import { crearHorarioApi } from '../../horarios/api/horariosApi';

export const CreateEditCursoPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<CrearCursoData & { estado?: boolean }>({
    categoriaId: '',
    codigo: '',
    nombre: '',
    nombreCorto: '',
    slug: '',
    descripcion: '',
    fechaInicio: getTodayDate(),
    fechaFin: '',
    enableCompletion: false,
    estado: true,
    idSucursal: '',
    capacidadMaxima: undefined,
  });

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [loadingCurso, setLoadingCurso] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('Guardando datos...');

  // Estado para horarios (solo en modo creación)
  const [horariosLocales, setHorariosLocales] = useState<HorarioLocal[]>([]);

  // Cargar curso si es modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadCursoData(id);
    }
  }, [isEditMode, id]);

  // Cargar categorías para el selector
  useEffect(() => {
    fetchCategorias();
  }, []);

  const loadCursoData = async (cursoId: string) => {
    setLoadingCurso(true);
    try {
      const response = await obtenerCursoPorIdApi(cursoId);
      const curso = response.data;

      setFormData({
        categoriaId: curso.categoriaId,
        codigo: curso.codigo,
        nombre: curso.nombre,
        nombreCorto: curso.nombreCorto,
        slug: curso.slug,
        descripcion: curso.descripcion || '',
        fechaInicio: curso.fechaInicio ? curso.fechaInicio.split('T')[0] : '',
        fechaFin: curso.fechaFin ? curso.fechaFin.split('T')[0] : '',
        enableCompletion: curso.enableCompletion,
        estado: curso.estado,
        idSucursal: curso.idSucursal || '',
        capacidadMaxima: curso.capacidadMaxima,
      });
    } catch (error) {
      console.error('Error al cargar curso:', error);
      setApiError('Error al cargar la información del curso');
    } finally {
      setLoadingCurso(false);
    }
  };

  const fetchCategorias = async () => {
    setLoadingCategorias(true);
    try {
      const response = await listarCategoriasApi({
        activo: true,
        esVisible: true,
        page: 1,
        limit: 1000,
      });
      if (response.success) {
        // Filtrar solo las categorías que permiten cursos
        const categoriasPermitidas = response.data.filter(cat => cat.permiteCursos);
        setCategorias(categoriasPermitidas);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoadingCategorias(false);
    }
  };

  const validateField = (name: string, value: string | boolean) => {
    let error = '';

    switch (name) {
      case 'categoriaId':
        if (!value) {
          error = 'La categoría es requerida';
        }
        break;
      case 'codigo':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'El código es requerido';
        } else if (typeof value === 'string' && value.trim().length > 100) {
          error = 'El código no puede tener más de 100 caracteres';
        }
        break;
      case 'nombre':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'El nombre es requerido';
        } else if (typeof value === 'string' && value.trim().length > 255) {
          error = 'El nombre no puede tener más de 255 caracteres';
        }
        break;
      case 'nombreCorto':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'El nombre corto es requerido';
        } else if (typeof value === 'string' && value.trim().length > 100) {
          error = 'El nombre corto no puede tener más de 100 caracteres';
        }
        break;
      case 'slug':
        if (!value || (typeof value === 'string' && !value.trim())) {
          error = 'El código URL es requerido';
        } else if (typeof value === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
          error = 'El código URL solo puede contener letras minúsculas, números y guiones';
        }
        break;
      case 'fechaInicio':
        if (typeof value === 'string' && value) {
          const today = getTodayDate();
          if (value < today && !isEditMode) {
            error = 'La fecha de inicio no puede ser anterior a hoy';
          }
        }
        break;
      case 'fechaFin':
        // Solo validar si el control de finalización está habilitado
        if (formData.enableCompletion && typeof value === 'string' && value && formData.fechaInicio) {
          if (value <= formData.fechaInicio) {
            error = 'La fecha de fin debe ser posterior a la fecha de inicio';
          }
        }
        break;
      case 'idSucursal':
        if (!value) {
          error = 'La sucursal es requerida';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | boolean = value;

    if (type === 'checkbox') {
      fieldValue = (e.target as HTMLInputElement).checked;
    }

    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    // Auto-generar slug desde el código si es modo creación
    if (name === 'codigo' && !isEditMode) {
      const slugValue = value
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, slug: slugValue }));
    }

    // Si se deshabilita el control de finalización, limpiar la fecha de fin
    if (name === 'enableCompletion' && !fieldValue) {
      setFormData(prev => ({ ...prev, fechaFin: '' }));
      setErrors(prev => ({ ...prev, fechaFin: '' }));
    }

    // Revalidar fecha de fin si cambia la fecha de inicio y el control de finalización está habilitado
    if (name === 'fechaInicio' && formData.fechaFin && formData.enableCompletion) {
      validateField('fechaFin', formData.fechaFin);
    }

    if (errors[name] !== undefined) {
      validateField(name, fieldValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      setErrors(prev => ({ ...prev, courseImage: '' }));
      return;
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({
        ...prev,
        courseImage: 'Solo se permiten imágenes JPG, PNG o SVG'
      }));
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validar tamaño (máximo 1 MB)
    const maxSize = 1 * 1024 * 1024; // 1 MB en bytes
    if (file.size > maxSize) {
      setErrors(prev => ({
        ...prev,
        courseImage: 'La imagen no debe superar 1 MB'
      }));
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Todo OK, guardar archivo y crear preview
    setImageFile(file);
    setErrors(prev => ({ ...prev, courseImage: '' }));

    // Crear URL de previsualización
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setErrors(prev => ({ ...prev, courseImage: '' }));

    // Limpiar el input file
    const fileInput = document.getElementById('courseImage') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setUploadStatus('');

    // Validar campos requeridos
    const categoriaValid = validateField('categoriaId', formData.categoriaId);
    const codigoValid = validateField('codigo', formData.codigo);
    const nombreValid = validateField('nombre', formData.nombre);
    const nombreCortoValid = validateField('nombreCorto', formData.nombreCorto);
    const slugValid = validateField('slug', formData.slug);
    const sucursalValid = validateField('idSucursal', formData.idSucursal);

    if (!categoriaValid || !codigoValid || !nombreValid || !nombreCortoValid || !slugValid || !sucursalValid) {
      return;
    }

    setLoading(true);

    try {
      // Preparar el objeto de datos
      const dataToSend: any = {
        categoriaId: formData.categoriaId,
        codigo: formData.codigo.trim(),
        nombre: formData.nombre.trim(),
        nombreCorto: formData.nombreCorto.trim(),
        slug: formData.slug.trim(),
        descripcion: formData.descripcion?.trim() || undefined,
        enableCompletion: formData.enableCompletion,
        idSucursal: formData.idSucursal,
        capacidadMaxima: formData.capacidadMaxima || undefined,
      };

      // Solo incluir fechas si tienen valores
      if (formData.fechaInicio) {
        dataToSend.fechaInicio = new Date(formData.fechaInicio).toISOString();
      }
      // Solo incluir fecha de fin si el control de finalización está habilitado
      if (formData.fechaFin && formData.enableCompletion) {
        dataToSend.fechaFin = new Date(formData.fechaFin).toISOString();
      }

      // En modo edición, incluir el estado
      if (isEditMode) {
        dataToSend.estado = formData.estado;
      }

      let response;

      if (isEditMode && id) {
        setLoadingMessage('Actualizando curso...');
        setUploadStatus('Actualizando curso...');
        console.log('🔄 Actualizando curso:', { id, data: dataToSend });

        // En modo edición, enviar como JSON normal (sin imagen por ahora)
        response = await actualizarCursoApi(id, dataToSend);
      } else {
        // En modo creación, usar FormData si hay imagen
        if (imageFile) {
          setLoadingMessage('Subiendo imagen y creando curso...');
          setUploadStatus('Preparando imagen...');
          console.log('📦 Preparando FormData con imagen:', {
            fileName: imageFile.name,
            fileSize: `${(imageFile.size / 1024).toFixed(2)} KB`,
            fileType: imageFile.type,
            data: dataToSend
          });

          const formDataToSend = new FormData();
          formDataToSend.append('data', JSON.stringify(dataToSend));
          formDataToSend.append('courseImage', imageFile);

          setUploadStatus('Subiendo imagen y creando curso...');
          console.log('🚀 Enviando request con imagen...');

          response = await crearCursoApi(formDataToSend);

          console.log('✅ Curso creado con imagen:', response);
        } else {
          setLoadingMessage('Creando curso...');
          setUploadStatus('Creando curso...');
          console.log('📝 Creando curso sin imagen:', dataToSend);

          response = await crearCursoApi(dataToSend);

          console.log('✅ Curso creado:', response);
        }
      }

      if (response.success) {
        // Si es creación y hay horarios, crearlos
        if (!isEditMode && horariosLocales.length > 0 && response.data?.id) {
          setLoadingMessage('Creando horarios...');
          setUploadStatus('Creando horarios del curso...');

          const cursoId = response.data.id;

          // Crear cada horario
          for (const horario of horariosLocales) {
            try {
              await crearHorarioApi({
                cursoId,
                diaSemana: horario.diaSemana,
                horaInicio: horario.horaInicio,
                duracionMinutos: horario.duracionMinutos,
                modalidad: horario.modalidad,
                aulaId: horario.aulaId,
              });
            } catch (err) {
              console.error('Error al crear horario:', err);
              // Continuamos con los demás horarios aunque uno falle
            }
          }
        }

        setUploadStatus(isEditMode ? '¡Curso actualizado!' : '¡Curso creado exitosamente!');
        setShowSuccess(true);

        // Esperar 2 segundos antes de redirigir para mostrar el estado de éxito
        setTimeout(() => {
          navigate('/cursos');
        }, 2000);
      } else {
        setApiError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el curso`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`❌ Error al ${isEditMode ? 'actualizar' : 'crear'} curso:`, error);
      setApiError(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el curso. Por favor, intente nuevamente.`);
      setLoading(false);
      setUploadStatus('');
    }
  };

  if (loadingCurso) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-primary dark:text-purple-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del curso...</p>
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
        successMessage={isEditMode ? '¡Curso actualizado exitosamente!' : '¡Curso creado exitosamente!'}
      />

      <div className="w-full">
        {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/cursos')}
          disabled={loading}
          className="flex items-center gap-2 text-primary dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-colors disabled:opacity-50 font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Gestión de Cursos</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30">
            <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
            </svg>
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {isEditMode ? 'Editar Curso' : 'Crear Nuevo Curso'}
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Modifica la información del curso' : 'Completa los datos para crear un nuevo curso'}
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
              {isEditMode ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente'}
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

      {/* Upload Status Message */}
      {uploadStatus && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
          <CgSpinner className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{uploadStatus}</p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Por favor espera, esto puede tardar unos segundos...</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Información Básica</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {/* Categoría */}
            <div>
              <label htmlFor="categoriaId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                id="categoriaId"
                name="categoriaId"
                value={formData.categoriaId}
                onChange={handleChange}
                disabled={loading || loadingCategorias}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                  errors.categoriaId
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                    : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
              >
                <option value="">-- Selecciona una categoría --</option>
                {categorias.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nivel > 1 && '— '.repeat(categoria.nivel - 1)}
                    {categoria.nombre}
                  </option>
                ))}
              </select>
              {errors.categoriaId && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.categoriaId}
                </p>
              )}
            </div>

            {/* Sucursal */}
            <div>
              <SucursalSelect
                value={formData.idSucursal}
                onChange={(value) => {
                  setFormData(prev => ({ ...prev, idSucursal: value }));
                  validateField('idSucursal', value);
                }}
                error={errors.idSucursal}
                disabled={loading}
                required
                label="Sucursal"
                placeholder="Seleccionar sucursal"
              />
            </div>

            {/* Capacidad Máxima */}
            <div>
              <label htmlFor="capacidadMaxima" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Capacidad Máxima
              </label>
              <input
                type="number"
                id="capacidadMaxima"
                name="capacidadMaxima"
                value={formData.capacidadMaxima || ''}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value, 10) : undefined;
                  setFormData(prev => ({ ...prev, capacidadMaxima: value }));
                }}
                disabled={loading}
                min={1}
                max={999}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                placeholder="Ej: 30"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Número máximo de estudiantes (opcional)</p>
            </div>

            {/* Código del Curso */}
            <div>
              <label htmlFor="codigo" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Código del Curso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading || isEditMode}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                  errors.codigo
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                    : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                placeholder="Ej: CURSO-001"
              />
              {errors.codigo && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.codigo}
                </p>
              )}
              {isEditMode && <p className="text-xs text-neutral-500 mt-1">El código no puede ser modificado</p>}
            </div>

            {/* Nombre del Curso */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Nombre del Curso <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                maxLength={255}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                  errors.nombre
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                    : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                placeholder="Ej: Introducción a la Programación"
              />
              {errors.nombre && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Nombre Corto */}
            <div>
              <label htmlFor="nombreCorto" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Nombre Corto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombreCorto"
                name="nombreCorto"
                value={formData.nombreCorto}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                maxLength={100}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                  errors.nombreCorto
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                    : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                placeholder="Ej: Intro Prog"
              />
              {errors.nombreCorto && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.nombreCorto}
                </p>
              )}
            </div>

            {/* Código URL */}
            <div className="lg:col-span-2">
              <label htmlFor="slug" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Código URL <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={formData.slug}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                  errors.slug
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                    : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                placeholder="Ej: intro-prog"
              />
              {errors.slug && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.slug}
                </p>
              )}
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Solo letras minúsculas, números y guiones. {!isEditMode && 'Se genera automáticamente del código del curso.'}</p>
            </div>

            {/* Descripción */}
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
                placeholder="Describe el curso..."
              />
            </div>

            {/* Imagen del Curso */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-3 dark:text-neutral-100">
                Imagen del Curso <span className="text-neutral-500 font-normal text-xs">(Opcional)</span>
              </label>

              {!imagePreview ? (
                /* Zona de subida */
                <div className="relative">
                  <input
                    type="file"
                    id="courseImage"
                    name="courseImage"
                    accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <label
                    htmlFor="courseImage"
                    className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                      errors.courseImage
                        ? 'border-red-300 bg-red-500 hover:bg-red-600'
                        : 'border-violet-300 bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30 hover:from-violet-700 hover:to-violet-600'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                      <div className={`p-4 rounded-full mb-4 ${
                        errors.courseImage ? 'bg-red-100' : 'bg-violet-100'
                      }`}>
                        <FaCloudUploadAlt className={`w-12 h-12 ${
                          errors.courseImage ? 'text-red-500' : 'text-violet-500'
                        }`} />
                      </div>
                      <p className="mb-2 text-sm font-semibold text-neutral-100">
                        <span className="text-violet-200">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-neutral-100 text-center">
                        PNG, JPG, SVG (Tamaño ideal: 1200×800)
                      </p>
                      <p className="text-xs text-neutral-100 mt-1">
                        Máximo 1 MB
                      </p>
                    </div>
                  </label>

                  {/* Mensaje de error */}
                  {errors.courseImage && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <FaExclamationCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-red-700">{errors.courseImage}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Preview de la imagen */
                <div className="space-y-3">
                  <div className="relative group">
                    <div className="relative border-2 border-blue-200 rounded-xl overflow-hidden bg-neutral-900 shadow-lg">
                      <img
                        src={imagePreview}
                        alt="Preview del curso"
                        className="w-full h-80 object-cover"
                      />
                      {/* Overlay con información */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center gap-2 text-white">
                            <FaImage className="w-4 h-4" />
                            <span className="text-sm font-medium">Imagen del curso cargada</span>
                          </div>
                        </div>
                      </div>
                      {/* Badge de éxito */}
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                        <FaCheckCircle className="w-3.5 h-3.5" />
                        <span className="font-semibold">Imagen lista</span>
                      </div>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3">
                    <label
                      htmlFor="courseImage"
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer border border-blue-200"
                    >
                      <FaImage className="w-4 h-4" />
                      <span className="text-sm font-medium">Cambiar imagen</span>
                    </label>
                    <input
                      type="file"
                      id="courseImage"
                      name="courseImage"
                      accept="image/jpeg,image/jpg,image/png,image/svg+xml"
                      onChange={handleImageChange}
                      disabled={loading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors border border-red-200 disabled:opacity-50"
                    >
                      <FaTrash className="w-4 h-4" />
                      <span className="text-sm font-medium">Eliminar</span>
                    </button>
                  </div>

                  {/* Información adicional */}
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <p className="text-xs text-blue-700 flex items-center gap-2">
                      <FaCheckCircle className="w-3.5 h-3.5" />
                      La imagen se subirá a Moodle cuando guardes el curso
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Opciones */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Opciones</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Habilitar Finalización */}
            <div className="flex items-center gap-3 border border-neutral-300 dark:border-dark-border rounded-lg p-3">
              <input
                type="checkbox"
                id="enableCompletion"
                name="enableCompletion"
                checked={formData.enableCompletion}
                onChange={handleChange}
                disabled={loading}
                className="w-4 h-4 accent-purple-600 border-neutral-300 rounded focus:ring-2 focus:ring-purple-100"
              />
              <label htmlFor="enableCompletion" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer flex-1">
                Habilitar control de finalización
              </label>
            </div>

            {/* Estado (solo en modo edición) */}
            {isEditMode && (
              <div className="flex items-center gap-3 border border-neutral-300 dark:border-dark-border rounded-lg p-3">
                <input
                  type="checkbox"
                  id="estado"
                  name="estado"
                  checked={formData.estado}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 accent-purple-600 border-neutral-300 rounded focus:ring-2 focus:ring-purple-100"
                />
                <label htmlFor="estado" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer flex-1">
                  Curso activo
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Fechas */}
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Fechas del Curso</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
            {/* Fecha de Inicio */}
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Fecha de Inicio
              </label>
              <input
                type="date"
                id="fechaInicio"
                name="fechaInicio"
                value={formData.fechaInicio}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading}
                min={!isEditMode ? getTodayDate() : undefined}
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
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Por defecto es el día de hoy</p>
            </div>

            {/* Fecha de Fin */}
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Fecha de Fin
              </label>
              <input
                type="date"
                id="fechaFin"
                name="fechaFin"
                value={formData.fechaFin}
                onChange={handleChange}
                onBlur={handleBlur}
                disabled={loading || !formData.enableCompletion}
                min={formData.fechaInicio || getTodayDate()}
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
              {!formData.enableCompletion ? (
                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  Debes habilitar el control de finalización para establecer una fecha de fin
                </p>
              ) : (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Debe ser posterior a la fecha de inicio</p>
              )}
            </div>
          </div>
        </div>

        {/* Horarios del Curso */}
        {isEditMode && id ? (
          <HorariosCursoManager
            cursoId={id}
            sucursalId={formData.idSucursal}
            disabled={loading}
          />
        ) : (
          <HorariosFormSection
            horarios={horariosLocales}
            onChange={setHorariosLocales}
            sucursalId={formData.idSucursal}
            disabled={loading}
          />
        )}

        {/* Footer con botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
          <button
            type="button"
            onClick={() => navigate('/cursos')}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <CgSpinner className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                {isEditMode ? 'Guardar Cambios' : 'Crear Curso'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};
