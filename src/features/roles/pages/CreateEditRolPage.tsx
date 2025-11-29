import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt, FaCheckCircle, FaExclamationCircle, FaSave, FaCheck, FaTimes, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { crearRolApi, actualizarRolApi, asignarPermisosApi, obtenerRolConPermisosApi } from '../api/rolesApi';
import { obtenerPermisosEmpresaApi } from '../../permisos';
import type { CrearRolData } from '../types/role.types';
import type { Permiso } from '../../permisos';
import { LoadingOverlay } from '../../../shared/components/LoadingOverlay';

export const CreateEditRolPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<CrearRolData>({
    nombre: '',
    descripcion: '',
    esSuperadmin: false,
    estado: true,
  });

  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([]);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [loadingRol, setLoadingRol] = useState(false);
  const [expandedModulos, setExpandedModulos] = useState<Set<string>>(new Set());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('Guardando datos...');

  // Cargar rol si es modo edición
  useEffect(() => {
    if (isEditMode && id) {
      loadRolData(id);
    }
  }, [isEditMode, id]);

  // Cargar permisos
  useEffect(() => {
    fetchPermisos();
  }, []);

  const loadRolData = async (rolId: string) => {
    setLoadingRol(true);
    try {
      const response = await obtenerRolConPermisosApi(rolId);
      const rol = response.data;

      setFormData({
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        esSuperadmin: rol.esSuperadmin,
        estado: rol.estado,
      });

      if (rol.permisos && rol.permisos.length > 0) {
        const permisosIds = rol.permisos.map(p => p.id);
        setSelectedPermisos(permisosIds);
      }
    } catch (error) {
      console.error('Error al cargar rol:', error);
      setApiError('Error al cargar la información del rol');
    } finally {
      setLoadingRol(false);
    }
  };

  const fetchPermisos = async () => {
    setLoadingPermisos(true);
    try {
      const response = await obtenerPermisosEmpresaApi();
      if (response.success) {
        setPermisos(response.data.filter(p => p.habilitado));
      }
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    } finally {
      setLoadingPermisos(false);
    }
  };

  // Agrupar permisos por módulo
  const permisosPorModulo = permisos.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = [];
    }
    acc[permiso.modulo].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);

  const modulos = Object.keys(permisosPorModulo).sort();

  const totalPermisosSeleccionados = selectedPermisos.length;
  const totalPermisos = permisos.length;

  const toggleModuloExpanded = (modulo: string) => {
    setExpandedModulos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(modulo)) {
        newSet.delete(modulo);
      } else {
        newSet.add(modulo);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    setExpandedModulos(new Set(modulos));
  };

  const collapseAll = () => {
    setExpandedModulos(new Set());
  };

  const selectAll = () => {
    setSelectedPermisos(permisos.map(p => p.id));
  };

  const deselectAll = () => {
    setSelectedPermisos([]);
  };

  const validateField = (name: string, value: string | boolean) => {
    let error = '';

    switch (name) {
      case 'nombre':
        if (!value || (typeof value === 'string' && value.trim().length < 3)) {
          error = 'El nombre debe tener al menos 3 caracteres';
        }
        break;
      case 'descripcion':
        if (!value || (typeof value === 'string' && value.trim().length < 10)) {
          error = 'La descripción debe tener al menos 10 caracteres';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    console.log(`🔄 Campo cambiado: ${name} = ${fieldValue} (tipo: ${type})`);
    setFormData(prev => ({ ...prev, [name]: fieldValue }));

    if (errors[name] !== undefined) {
      validateField(name, fieldValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handlePermisoToggle = (permisoId: string) => {
    setSelectedPermisos(prev =>
      prev.includes(permisoId)
        ? prev.filter(id => id !== permisoId)
        : [...prev, permisoId]
    );
  };

  const handleModuloToggle = (modulo: string) => {
    const permisosDelModulo = permisosPorModulo[modulo].map(p => p.id);
    const todosSeleccionados = permisosDelModulo.every(id => selectedPermisos.includes(id));

    if (todosSeleccionados) {
      setSelectedPermisos(prev => prev.filter(id => !permisosDelModulo.includes(id)));
    } else {
      setSelectedPermisos(prev => [...new Set([...prev, ...permisosDelModulo])]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    const nombreValid = validateField('nombre', formData.nombre);
    const descripcionValid = validateField('descripcion', formData.descripcion);

    if (!nombreValid || !descripcionValid) {
      return;
    }

    setLoading(true);
    setLoadingMessage(isEditMode ? 'Actualizando rol...' : 'Creando rol...');

    try {
      let response;
      let rolId: string;

      console.log('📤 Enviando datos del rol:', formData);

      if (isEditMode && id) {
        response = await actualizarRolApi(id, formData);
        rolId = id;
      } else {
        response = await crearRolApi(formData);
        rolId = response.data.id;
      }

      if (response.success) {
        if (selectedPermisos.length > 0) {
          setLoadingMessage('Asignando permisos...');
          await asignarPermisosApi(rolId, { permisoIds: selectedPermisos });
        }

        setShowSuccess(true);

        setTimeout(() => {
          navigate('/roles');
        }, 2000);
      } else {
        setApiError(`Error al ${isEditMode ? 'actualizar' : 'crear'} el rol`);
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`Error al ${isEditMode ? 'actualizar' : 'crear'} rol:`, error);
      setApiError(error.message || `Error al ${isEditMode ? 'actualizar' : 'crear'} el rol. Por favor, intente nuevamente.`);
      setLoading(false);
    }
  };

  if (loadingRol) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del rol...</p>
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
        successMessage={isEditMode ? '¡Rol actualizado exitosamente!' : '¡Rol creado exitosamente!'}
      />

      <div className="w-full min-h-screen bg-gray-100 dark:bg-dark-bg">
        {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/roles')}
          disabled={loading}
          className="flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4 transition-colors disabled:opacity-50 font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Roles</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/30">
            <FaShieldAlt className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {isEditMode ? 'Editar Rol' : 'Crear Nuevo Rol'}
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {isEditMode ? 'Modifica la información y permisos del rol' : 'Completa los datos para crear un nuevo rol en el sistema'}
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
              {isEditMode ? 'Rol actualizado exitosamente' : 'Rol creado exitosamente'}
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

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
            {/* Nombre */}
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Nombre del Rol <span className="text-red-500">*</span>
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
                placeholder="Ej: Administrador"
              />
              {errors.nombre && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <FaExclamationCircle className="w-3 h-3" />
                  {errors.nombre}
                </p>
              )}
            </div>

            {/* Superadmin Checkbox */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Privilegios
              </label>
              <div className="flex items-center gap-2 border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg rounded-lg p-3 h-[42px]">
                <input
                  type="checkbox"
                  id="esSuperadmin"
                  name="esSuperadmin"
                  checked={formData.esSuperadmin}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 accent-teal-600 border-neutral-300 rounded focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed"
                />
                <label htmlFor="esSuperadmin" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Superadministrador (acceso total)
                </label>
              </div>
            </div>

            {/* Estado Checkbox */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                Estado
              </label>
              <div className="flex items-center gap-2 border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg rounded-lg p-3 h-[42px]">
                <input
                  type="checkbox"
                  id="estado"
                  name="estado"
                  checked={formData.estado}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-4 h-4 accent-green-600 border-neutral-300 rounded focus:ring-2 focus:ring-green-100 disabled:cursor-not-allowed"
                />
                <label htmlFor="estado" className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Activo
                </label>
              </div>
            </div>
          </div>

          {/* Descripción */}
          <div className="mt-5 lg:col-span-2 xl:col-span-3">
            <label htmlFor="descripcion" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={loading}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all resize-none bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 ${
                errors.descripcion
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
                  : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
              } disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed`}
              placeholder="Describe las responsabilidades y alcance de este rol..."
            />
            {errors.descripcion && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                <FaExclamationCircle className="w-3 h-3" />
                {errors.descripcion}
              </p>
            )}
          </div>
        </div>

        {/* Permisos */}
        {!formData.esSuperadmin && (
          <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
            {/* Header con contador y acciones */}
            <div className="flex flex-col gap-4 mb-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Permisos del Rol</h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Selecciona los permisos que tendrá este rol
                  </p>
                </div>
                {!loadingPermisos && totalPermisos > 0 && (
                  <div className="flex items-center gap-2">
                    <div className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
                      totalPermisosSeleccionados === totalPermisos
                        ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400'
                        : totalPermisosSeleccionados > 0
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-600 dark:text-neutral-400'
                    }`}>
                      {totalPermisosSeleccionados} / {totalPermisos}
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de acciones rápidas */}
              {!loadingPermisos && modulos.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800/30 rounded-lg border border-neutral-200 dark:border-dark-border">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mr-1">Acciones:</span>
                  <button
                    type="button"
                    onClick={selectAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 border border-teal-200 dark:border-teal-800 transition-colors"
                  >
                    <FaCheck className="w-3 h-3" />
                    Seleccionar todos
                  </button>
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800 transition-colors"
                  >
                    <FaTimes className="w-3 h-3" />
                    Quitar todos
                  </button>
                  <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600 mx-1" />
                  <button
                    type="button"
                    onClick={expandAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-dark-bg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 border border-neutral-300 dark:border-dark-border transition-colors"
                  >
                    <FaChevronDown className="w-3 h-3" />
                    Expandir
                  </button>
                  <button
                    type="button"
                    onClick={collapseAll}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white dark:bg-dark-bg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 border border-neutral-300 dark:border-dark-border transition-colors"
                  >
                    <FaChevronUp className="w-3 h-3" />
                    Colapsar
                  </button>
                </div>
              )}
            </div>

            {loadingPermisos ? (
              <div className="flex items-center justify-center py-12">
                <CgSpinner className="w-8 h-8 text-teal-600 animate-spin" />
              </div>
            ) : modulos.length === 0 ? (
              <p className="text-neutral-500 dark:text-neutral-400 text-center py-8 text-sm">No hay permisos disponibles</p>
            ) : (
              <div className="space-y-3">
                {modulos.map(modulo => {
                  const permisosDelModulo = permisosPorModulo[modulo];
                  const todosSeleccionados = permisosDelModulo.every(p => selectedPermisos.includes(p.id));
                  const algunoSeleccionado = permisosDelModulo.some(p => selectedPermisos.includes(p.id));
                  const countSeleccionados = permisosDelModulo.filter(p => selectedPermisos.includes(p.id)).length;
                  const isExpanded = expandedModulos.has(modulo);

                  return (
                    <div
                      key={modulo}
                      className={`rounded-xl border transition-all duration-200 ${
                        todosSeleccionados
                          ? 'border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/10'
                          : algunoSeleccionado
                          ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10'
                          : 'border-neutral-200 dark:border-dark-border bg-white dark:bg-dark-bg'
                      }`}
                    >
                      {/* Header del módulo */}
                      <div
                        className="flex items-center gap-3 p-4 cursor-pointer select-none"
                        onClick={() => toggleModuloExpanded(modulo)}
                      >
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModuloToggle(modulo);
                          }}
                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                            todosSeleccionados
                              ? 'bg-teal-500 text-white'
                              : algunoSeleccionado
                              ? 'bg-amber-500 text-white'
                              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                          }`}
                        >
                          {todosSeleccionados ? (
                            <FaCheck className="w-3 h-3" />
                          ) : algunoSeleccionado ? (
                            <div className="w-2 h-0.5 bg-white rounded" />
                          ) : null}
                        </button>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                            {modulo}
                          </h3>
                        </div>

                        <div className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                          todosSeleccionados
                            ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400'
                            : algunoSeleccionado
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                            : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-500 dark:text-neutral-400'
                        }`}>
                          {countSeleccionados}/{permisosDelModulo.length}
                        </div>

                        <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                          <FaChevronDown className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                        </div>
                      </div>

                      {/* Permisos del módulo */}
                      {isExpanded && (
                        <div className="px-4 pb-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                            {permisosDelModulo.map(permiso => {
                              const isSelected = selectedPermisos.includes(permiso.id);
                              return (
                                <button
                                  key={permiso.id}
                                  type="button"
                                  onClick={() => handlePermisoToggle(permiso.id)}
                                  className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition-all duration-150 ${
                                    isSelected
                                      ? 'bg-teal-100 dark:bg-teal-900/30 border-2 border-teal-400 dark:border-teal-600'
                                      : 'bg-neutral-50 dark:bg-neutral-800/50 border-2 border-transparent hover:border-neutral-300 dark:hover:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700/50'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                                    isSelected
                                      ? 'bg-teal-500 text-white'
                                      : 'bg-neutral-200 dark:bg-neutral-700'
                                  }`}>
                                    {isSelected && <FaCheck className="w-3 h-3" />}
                                  </div>
                                  <span className={`text-sm truncate ${
                                    isSelected
                                      ? 'text-teal-900 dark:text-teal-100 font-medium'
                                      : 'text-neutral-700 dark:text-neutral-300'
                                  }`}>
                                    {permiso.descripcion || permiso.codigo}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer con botones */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4 border-t border-neutral-200 dark:border-dark-border">
          <button
            type="button"
            onClick={() => navigate('/roles')}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors disabled:opacity-50 w-full sm:w-auto text-center"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-medium rounded-lg hover:shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            {loading ? (
              <>
                <CgSpinner className="w-4 h-4 animate-spin" />
                {isEditMode ? 'Actualizando...' : 'Creando...'}
              </>
            ) : (
              <>
                <FaSave className="w-4 h-4" />
                {isEditMode ? 'Guardar Cambios' : 'Crear Rol'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};
