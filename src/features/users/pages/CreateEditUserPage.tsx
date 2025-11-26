import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaCheckCircle, FaExclamationCircle, FaSave, FaCamera } from 'react-icons/fa';
import { HiX } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { crearUsuarioApi, actualizarUsuarioApi, obtenerUsuarioPorIdApi } from '../api/UsersApi';
import { RoleSelect } from '../components/RoleSelect';
import { SucursalSelect, MultipleSucursalSelect } from '../../sucursales';
import type { UsuarioDetalle } from '../types/user.types';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';

export const CreateEditUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    idRol: '',
    estado: true,
    idSucursalPrincipal: '',
    idSucursales: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Guardando datos...');

  // Estado para la foto
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPathFoto, setCurrentPathFoto] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar usuario si es modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadUserData(id);
    }
  }, [isEditMode, id]);

  const loadUserData = async (userId: string) => {
    setLoadingUser(true);
    try {
      const response = await obtenerUsuarioPorIdApi(userId);
      if (response.success) {
        const user: UsuarioDetalle = response.data;
        setFormData({
          nombre: user.nombre,
          correo: user.correo,
          contrasena: '',
          idRol: user.idRol || '',
          estado: user.estado === 'activo' || user.estado === '1',
          idSucursalPrincipal: user.idSucursalPrincipal || '',
          idSucursales: user.idSucursales || [],
        });
        // Cargar foto actual si existe
        if (user.pathFoto) {
          setCurrentPathFoto(user.pathFoto);
        }
      } else {
        setApiError('Error al cargar la información del usuario');
      }
    } catch (error) {
      console.error('Error al cargar usuario:', error);
      setApiError('Error al cargar la información del usuario');
    } finally {
      setLoadingUser(false);
    }
  };

  const validateField = (name: string, value: string) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value.trim()) {
          error = 'El nombre es requerido';
        } else if (value.trim().length < 3) {
          error = 'El nombre debe tener al menos 3 caracteres';
        }
        break;
      case 'correo':
        if (!value.trim()) {
          error = 'El correo es requerido';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'El correo no es válido';
        }
        break;
      case 'contrasena':
        if (isEditMode) {
          if (value && value.length < 6) {
            error = 'La contraseña debe tener al menos 6 caracteres';
          }
        } else {
          if (!value || value.length < 6) {
            error = 'La contraseña debe tener al menos 6 caracteres';
          }
        }
        break;
      case 'idRol':
        if (!value) {
          error = 'Debes seleccionar un rol';
        }
        break;
      case 'idSucursalPrincipal':
        if (!value) {
          error = 'Debes seleccionar una sucursal principal';
        }
        break;
    }

    return error;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setApiError(null);
  };

  const handleRoleChange = (roleId: string) => {
    setFormData(prev => ({ ...prev, idRol: roleId }));
    const error = validateField('idRol', roleId);
    setErrors(prev => ({ ...prev, idRol: error }));
    setApiError(null);
  };

  const handleSucursalPrincipalChange = (value: string) => {
    setFormData(prev => ({ ...prev, idSucursalPrincipal: value }));
    const error = validateField('idSucursalPrincipal', value);
    setErrors(prev => ({ ...prev, idSucursalPrincipal: error }));
    setApiError(null);
  };

  const handleSucursalesChange = (value: string[]) => {
    setFormData(prev => ({ ...prev, idSucursales: value }));
    setApiError(null);
  };

  // Handlers para la foto
  const handleFotoClick = () => {
    fileInputRef.current?.click();
  };

  const processFile = useCallback((file: File) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setApiError('El archivo debe ser una imagen');
      return;
    }
    // Validar tamaño (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setApiError('La imagen no debe superar los 5MB');
      return;
    }
    setFoto(file);
    setPreviewUrl(URL.createObjectURL(file));
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
    setCurrentPathFoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers
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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const fieldsToValidate = ['nombre', 'correo', 'contrasena', 'idRol', 'idSucursalPrincipal'];

    fieldsToValidate.forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData] as string);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setLoadingMessage(isEditMode ? 'Actualizando usuario...' : 'Creando usuario...');

    try {
      let response;

      if (isEditMode && id) {
        const updateData: any = {
          nombre: formData.nombre,
          correo: formData.correo,
          idRol: formData.idRol,
          estado: formData.estado ? 1 : 0,
          idSucursalPrincipal: formData.idSucursalPrincipal,
          idSucursales: formData.idSucursales && formData.idSucursales.length > 0 ? formData.idSucursales : undefined,
        };

        if (formData.contrasena) {
          updateData.contrasena = formData.contrasena;
        }

        response = await actualizarUsuarioApi(id, updateData, foto || undefined);
      } else {
        response = await crearUsuarioApi({
          nombre: formData.nombre,
          correo: formData.correo,
          idRol: formData.idRol,
          contrasena: formData.contrasena,
          estado: formData.estado ? 1 : 0,
          idSucursalPrincipal: formData.idSucursalPrincipal,
          idSucursales: formData.idSucursales && formData.idSucursales.length > 0 ? formData.idSucursales : undefined,
        }, foto || undefined);
      }

      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/usuarios');
        }, 2000);
      } else {
        setApiError(response.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el usuario`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} usuario:`, error);
      setApiError(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el usuario. Por favor, intente nuevamente.`);
      setLoading(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del usuario...</p>
      </div>
    );
  }

  return (
    <>
      <LoadingOverlay
        isVisible={loading}
        message={loadingMessage}
        isSuccess={showSuccess}
        successMessage={isEditMode ? '¡Usuario actualizado exitosamente!' : '¡Usuario creado exitosamente!'}
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/usuarios')}
            disabled={loading}
            className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-colors disabled:opacity-50 font-medium"
          >
            <FaArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver a Usuarios</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/30">
              <FaUser className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {isEditMode ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                {isEditMode ? 'Modifica la información del usuario' : 'Completa los datos para crear un nuevo usuario en el sistema'}
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
                {isEditMode ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente'}
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
          {/* Input oculto para foto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFotoChange}
            className="hidden"
          />

          {/* Card principal con foto y datos básicos */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border shadow-md overflow-hidden">
            {/* Header con foto - diseño limpio */}
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 px-4 md:px-6 py-5 border-b border-purple-100 dark:border-purple-900/30">
              <div className="flex items-center gap-5">
                {/* Avatar con zona de drop */}
                <div
                  className={`relative group flex-shrink-0 ${isDragging ? 'scale-105' : ''} transition-transform`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {/* Avatar */}
                  <div
                    onClick={handleFotoClick}
                    className={`relative w-24 h-24 rounded-full cursor-pointer overflow-hidden ${
                      isDragging
                        ? 'ring-4 ring-purple-400 ring-offset-2 dark:ring-offset-dark-card'
                        : 'ring-4 ring-white dark:ring-dark-card shadow-lg'
                    } transition-all`}
                  >
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : currentPathFoto ? (
                      <img src={currentPathFoto} alt="Foto actual" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white text-3xl font-semibold">
                          {formData.nombre ? formData.nombre.charAt(0).toUpperCase() : 'U'}
                        </span>
                      </div>
                    )}

                    {/* Overlay con ícono */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}>
                      <FaCamera className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Botón eliminar foto */}
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

                {/* Texto y botón */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
                    {isEditMode ? 'Editar perfil' : 'Nuevo usuario'}
                  </h3>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                    JPG, PNG o WebP • Máx. 5MB
                  </p>
                  <button
                    type="button"
                    onClick={handleFotoClick}
                    disabled={loading}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-dark-bg border border-purple-200 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <FaCamera className="w-4 h-4" />
                    {(previewUrl || currentPathFoto) ? 'Cambiar foto' : 'Subir foto'}
                  </button>
                </div>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                {/* Nombre */}
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                      errors.nombre
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                        : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                    } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                    placeholder="Ej: Juan Pérez"
                  />
                  {errors.nombre && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <FaExclamationCircle className="w-3 h-3" />
                      {errors.nombre}
                    </p>
                  )}
                </div>

                {/* Correo */}
                <div>
                  <label htmlFor="correo" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Correo electrónico <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="correo"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    disabled={loading || isEditMode}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                      errors.correo
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                        : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                    } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                    placeholder="Ej: juan@empresa.com"
                  />
                  {errors.correo && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <FaExclamationCircle className="w-3 h-3" />
                      {errors.correo}
                    </p>
                  )}
                  {isEditMode && (
                    <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      El correo no puede ser modificado
                    </p>
                  )}
                </div>

                {/* Contraseña */}
                <div>
                  <label htmlFor="contrasena" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Contraseña {!isEditMode && <span className="text-red-500">*</span>}
                    {isEditMode && <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal ml-1">(opcional)</span>}
                  </label>
                  <input
                    type="password"
                    id="contrasena"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    disabled={loading}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                      errors.contrasena
                        ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                        : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
                    } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errors.contrasena && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                      <FaExclamationCircle className="w-3 h-3" />
                      {errors.contrasena}
                    </p>
                  )}
                  {isEditMode && (
                    <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                      Dejar vacío para mantener la contraseña actual
                    </p>
                  )}
                </div>

                {/* Rol */}
                <RoleSelect
                  value={formData.idRol}
                  onChange={handleRoleChange}
                  disabled={loading}
                  error={errors.idRol}
                  required={true}
                />
              </div>
            </div>
          </div>

          {/* Asignación de Sucursales */}
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Asignación de Sucursales</h2>

            <div className="space-y-4">
              {/* Sucursal Principal */}
              <div>
                <SucursalSelect
                  value={formData.idSucursalPrincipal}
                  onChange={handleSucursalPrincipalChange}
                  error={errors.idSucursalPrincipal}
                  disabled={loading}
                  required
                  label="Sucursal Principal"
                  placeholder="Seleccionar sucursal principal"
                />
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1.5">
                  Esta será la sucursal por defecto del usuario
                </p>
              </div>

              {/* Sucursales Adicionales */}
              <div>
                <MultipleSucursalSelect
                  value={formData.idSucursales}
                  onChange={handleSucursalesChange}
                  sucursalPrincipal={formData.idSucursalPrincipal}
                  disabled={loading || !formData.idSucursalPrincipal}
                  label="Sucursales Adicionales"
                  helpText="Selecciona todas las sucursales donde el usuario puede trabajar. La sucursal principal se incluye automáticamente."
                />
                {!formData.idSucursalPrincipal && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1">
                    <FaExclamationCircle className="w-3 h-3" />
                    Primero selecciona la sucursal principal
                  </p>
                )}
              </div>

              {/* Estado como checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.checked }))}
                    disabled={loading}
                    className="w-4 h-4 text-purple-600 bg-white dark:bg-dark-bg border-neutral-300 dark:border-dark-border rounded focus:ring-purple-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Usuario activo
                  </span>
                </label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 ml-7">
                  Los usuarios inactivos no pueden iniciar sesión en el sistema
                </p>
              </div>
            </div>
          </div>

          {/* Footer con botones */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
            <button
              type="button"
              onClick={() => navigate('/usuarios')}
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <CgSpinner className="w-4 h-4 animate-spin" />
                  {isEditMode ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4" />
                  {isEditMode ? 'Guardar Cambios' : 'Crear Usuario'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
