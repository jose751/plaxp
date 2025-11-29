import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaExclamationCircle, FaSave, FaGraduationCap, FaCheckCircle, FaCamera, FaVideo } from 'react-icons/fa';
import { HiX } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { crearEstudianteApi, actualizarEstudianteApi, obtenerEstudiantePorIdApi } from '../api/estudiantesApi';
import type { CrearEstudianteData, Estudiante } from '../types/estudiante.types';
import { CredentialsScreen } from '../components';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';
import { SucursalSelect } from '../../sucursales';

export const CreateEditEstudiantePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CrearEstudianteData>({
    nombre: '',
    primerApellido: '',
    segundoApellido: '',
    correo: '',
    telefono: '',
    fechaNacimiento: '',
    nombreUsuario: '',
    contrasenaTemporal: '',
    identificacion: '',
    direccion: '',
    idSucursal: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingEstudiante, setLoadingEstudiante] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showCredentials, setShowCredentials] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<Estudiante | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Guardando datos...');

  // Estado para la foto
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPathFoto, setCurrentPathFoto] = useState<string | null>(null);
  const [eliminarFoto, setEliminarFoto] = useState(false); // Flag para indicar que se debe eliminar la foto
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para la cámara
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Cargar estudiante si es modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadEstudianteData(id);
    }
  }, [isEditMode, id]);

  const loadEstudianteData = async (estudianteId: string) => {
    setLoadingEstudiante(true);
    try {
      const response = await obtenerEstudiantePorIdApi(estudianteId);
      const estudiante = response.data;

      setFormData({
        nombre: estudiante.nombre,
        primerApellido: estudiante.primerApellido,
        segundoApellido: estudiante.segundoApellido || '',
        correo: estudiante.correo,
        telefono: estudiante.telefono || '',
        fechaNacimiento: estudiante.fechaNacimiento || '',
        nombreUsuario: estudiante.nombreUsuario || '',
        contrasenaTemporal: estudiante.contrasenaTemporal || '',
        identificacion: estudiante.identificacion || '',
        direccion: estudiante.direccion || '',
        idSucursal: estudiante.idSucursal || '',
      });
      // Cargar foto actual si existe
      if (estudiante.pathFoto) {
        setCurrentPathFoto(estudiante.pathFoto);
      }
    } catch (error) {
      console.error('Error al cargar estudiante:', error);
      setApiError('Error al cargar la información del estudiante');
    } finally {
      setLoadingEstudiante(false);
    }
  };


  // Validación en tiempo real
  const validateField = (name: string, value: string | boolean) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          error = 'El nombre debe tener al menos 2 caracteres';
        }
        break;
      case 'primerApellido':
        if (!value || (typeof value === 'string' && value.trim().length < 2)) {
          error = 'El primer apellido debe tener al menos 2 caracteres';
        }
        break;
      case 'correo':
        if (typeof value === 'string') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!value || !emailRegex.test(value)) {
            error = 'Ingrese un correo electrónico válido';
          }
        }
        break;
      case 'telefono':
        if (typeof value === 'string' && value && value.length < 8) {
          error = 'El teléfono debe tener al menos 8 dígitos';
        }
        break;
      case 'identificacion':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'La identificación es obligatoria';
        }
        break;
      case 'idSucursal':
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          error = 'La sucursal es obligatoria';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (errors[name] !== undefined) {
      validateField(name, fieldValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  // Handlers para la foto
  const handleFotoClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setApiError('El archivo debe ser una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApiError('La imagen no debe superar los 5MB');
      return;
    }
    setFoto(file);
    setPreviewUrl(URL.createObjectURL(file));
    setEliminarFoto(false); // Si se agrega nueva foto, no eliminar
    setApiError(null);
  }, []);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveFoto = () => {
    setFoto(null);
    setPreviewUrl(null);
    // Si había una foto existente, marcar para eliminar
    if (currentPathFoto) {
      setEliminarFoto(true);
    }
    setCurrentPathFoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Funciones para la cámara
  const openCamera = async () => {
    setCameraError(null);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });

      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error: any) {
      console.error('Error al acceder a la cámara:', error);
      if (error.name === 'NotAllowedError') {
        setCameraError('Permiso de cámara denegado. Por favor, permite el acceso a la cámara.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No se encontró ninguna cámara en el dispositivo.');
      } else {
        setCameraError('Error al acceder a la cámara. Intenta de nuevo.');
      }
    }
  };

  const closeCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCameraError(null);
  }, [cameraStream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar el canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir el canvas a blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          // Crear un archivo desde el blob
          const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFoto(file);
          setPreviewUrl(URL.createObjectURL(file));
          setCurrentPathFoto(null);
          closeCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [closeCamera]);

  // Limpiar stream al desmontar
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Obtener nombre completo para el avatar
  const getNombreCompleto = () => {
    return `${formData.nombre} ${formData.primerApellido}`.trim() || 'E';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const nombreValid = validateField('nombre', formData.nombre);
    const primerApellidoValid = validateField('primerApellido', formData.primerApellido);
    const correoValid = validateField('correo', formData.correo);
    const identificacionValid = validateField('identificacion', formData.identificacion);
    const sucursalValid = validateField('idSucursal', formData.idSucursal);

    const allValid = nombreValid && primerApellidoValid && correoValid && identificacionValid && sucursalValid;

    if (!allValid) {
      return;
    }

    setLoading(true);

    try {
      let response;

      if (isEditMode && id) {
        setLoadingMessage('Actualizando estudiante...');

        const updateData: any = {
          nombre: formData.nombre,
          primerApellido: formData.primerApellido,
          segundoApellido: formData.segundoApellido || undefined,
          correo: formData.correo,
          telefono: formData.telefono || undefined,
          fechaNacimiento: formData.fechaNacimiento || undefined,
          nombreUsuario: formData.nombreUsuario || undefined,
          identificacion: formData.identificacion,
          direccion: formData.direccion || undefined,
          idSucursal: formData.idSucursal,
        };

        response = await actualizarEstudianteApi(id, updateData, foto || undefined, eliminarFoto);
      } else {
        setLoadingMessage('Creando estudiante...');

        const createData: CrearEstudianteData = {
          nombre: formData.nombre,
          primerApellido: formData.primerApellido,
          segundoApellido: formData.segundoApellido || undefined,
          correo: formData.correo,
          telefono: formData.telefono || undefined,
          fechaNacimiento: formData.fechaNacimiento || undefined,
          nombreUsuario: formData.nombreUsuario || undefined,
          contrasenaTemporal: formData.contrasenaTemporal || undefined,
          identificacion: formData.identificacion,
          direccion: formData.direccion || undefined,
          idSucursal: formData.idSucursal,
        };

        response = await crearEstudianteApi(createData, foto || undefined);
      }

      if (response.success) {
        if (isEditMode) {
          setShowSuccess(true);
          setTimeout(() => {
            navigate('/estudiantes');
          }, 2000);
        } else {
          // Para modo creación, ocultar loading y mostrar credenciales
          setLoading(false);
          setCreatedStudent(response.data);
          setShowCredentials(true);
        }
      } else {
        setApiError(response.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el estudiante`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} estudiante:`, error);
      setApiError(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el estudiante. Por favor, intente nuevamente.`);
      setLoading(false);
    }
  };

  if (loadingEstudiante) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del estudiante...</p>
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
        successMessage={isEditMode ? '¡Estudiante actualizado exitosamente!' : '¡Estudiante creado exitosamente!'}
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/estudiantes')}
          disabled={loading}
          className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mb-4 transition-colors disabled:opacity-50 font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Estudiantes</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30">
            <FaGraduationCap className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {isEditMode ? 'Editar Estudiante' : 'Crear Nuevo Estudiante'}
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Modifica la información del estudiante' : 'Completa los datos para crear un nuevo estudiante'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message (Edit Mode) */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
          <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900 dark:text-green-200">Estudiante actualizado exitosamente</p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">Redirigiendo...</p>
          </div>
        </div>
      )}

      {/* Credentials Screen (Create Mode) */}
      {showCredentials && createdStudent && <CredentialsScreen student={createdStudent} />}

      {/* Form (hidden when showing credentials) */}
      {!showCredentials && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <FaExclamationCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-900 dark:text-red-200">{apiError}</p>
            </div>
          )}

          {/* Input oculto para foto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="hidden"
          />

          {/* Datos Personales con foto integrada */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border shadow-md overflow-hidden">
            {/* Header con foto */}
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-900/20 dark:to-indigo-800/10 px-4 md:px-6 py-5 border-b border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-5">
                {/* Avatar con zona de drop */}
                <div
                  className={`relative group flex-shrink-0 ${isDragging ? 'scale-105' : ''} transition-transform`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div
                    onClick={handleFotoClick}
                    className={`relative w-24 h-24 rounded-full cursor-pointer overflow-hidden ${
                      isDragging
                        ? 'ring-4 ring-indigo-400 ring-offset-2 dark:ring-offset-dark-card'
                        : 'ring-4 ring-white dark:ring-dark-card shadow-lg'
                    } transition-all`}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : currentPathFoto ? (
                      <img src={currentPathFoto} alt="Foto actual" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <span className="text-white text-3xl font-semibold">
                          {getNombreCompleto().charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <FaCamera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  {(previewUrl || currentPathFoto) && (
                    <button
                      type="button"
                      onClick={handleRemoveFoto}
                      disabled={loading}
                      className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-50"
                      title="Eliminar foto"
                    >
                      <HiX className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    {isEditMode ? 'Editar estudiante' : 'Nuevo estudiante'}
                  </h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    JPG, PNG o WebP • Máx. 5MB
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleFotoClick}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-white dark:bg-dark-bg border border-indigo-200 dark:border-indigo-700 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <FaCamera className="w-4 h-4" />
                      {(previewUrl || currentPathFoto) ? 'Cambiar foto' : 'Subir foto'}
                    </button>
                    <button
                      type="button"
                      onClick={openCamera}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 dark:text-green-300 bg-white dark:bg-dark-bg border border-green-200 dark:border-green-700 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                      <FaVideo className="w-4 h-4" />
                      Tomar foto
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="p-4 md:p-6">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Datos Personales</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
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
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.nombre
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                  placeholder="Ej: Juan"
                />
                {errors.nombre && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.nombre}
                  </p>
                )}
              </div>

              {/* Primer Apellido */}
              <div>
                <label htmlFor="primerApellido" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Primer Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="primerApellido"
                  name="primerApellido"
                  value={formData.primerApellido}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.primerApellido
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                  placeholder="Ej: Pérez"
                />
                {errors.primerApellido && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.primerApellido}
                  </p>
                )}
              </div>

              {/* Segundo Apellido */}
              <div>
                <label htmlFor="segundoApellido" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Segundo Apellido
                </label>
                <input
                  type="text"
                  id="segundoApellido"
                  name="segundoApellido"
                  value={formData.segundoApellido}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                  placeholder="Ej: García"
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  id="fechaNacimiento"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                />
              </div>

              {/* Identificación */}
              <div>
                <label htmlFor="identificacion" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Número de Identificación <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="identificacion"
                  name="identificacion"
                  value={formData.identificacion}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.identificacion
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                  placeholder="Ej: 123456789"
                />
                {errors.identificacion && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.identificacion}
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
              </div>
            </div>
          </div>

          {/* Datos de Contacto */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Datos de Contacto</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {/* Correo */}
              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Correo Electrónico <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="correo"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.correo
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                  placeholder="estudiante@ejemplo.com"
                />
                {errors.correo && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.correo}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  disabled={loading}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                    errors.telefono
                      ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                      : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                  } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                  placeholder="88888888"
                />
                {errors.telefono && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    {errors.telefono}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Dirección</h2>

            <div>
              <label htmlFor="direccion" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Dirección Completa
              </label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-100 dark:focus:ring-neutral-800 focus:border-neutral-400 dark:focus:border-neutral-600 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed"
                placeholder="Ej: San José, Barrio Amón, 100m norte del Parque Morazán"
              />
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              onClick={() => navigate('/estudiantes')}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {isEditMode ? 'Guardar Cambios' : 'Crear Estudiante'}
                </>
              )}
            </button>
          </div>
        </form>
      )}
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <FaVideo className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Tomar Foto
                </h3>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="p-2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                    <FaExclamationCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-xs">
                    {cameraError}
                  </p>
                  <button
                    type="button"
                    onClick={closeCamera}
                    className="mt-4 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="relative aspect-[4/3] bg-neutral-900 rounded-xl overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    {!cameraStream && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <CgSpinner className="w-10 h-10 text-white animate-spin" />
                      </div>
                    )}
                    {/* Overlay frame guide */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-8 border-2 border-white/30 rounded-full"></div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <p className="text-xs text-center text-neutral-500 dark:text-neutral-400">
                    Centra tu rostro en el círculo y presiona "Capturar"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!cameraError && (
              <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-neutral-900/50">
                <button
                  type="button"
                  onClick={closeCamera}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!cameraStream}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-br from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-green-500/30"
                >
                  <FaCamera className="w-4 h-4" />
                  Capturar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden canvas for capturing photo */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
    </>
  );
};
