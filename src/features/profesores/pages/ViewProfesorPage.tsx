import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaCheckCircle, FaTimesCircle, FaEnvelope, FaPhone, FaIdCard, FaMapMarkerAlt, FaChalkboardTeacher, FaKey, FaEdit, FaCalendar, FaGlobe, FaBuilding } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerProfesorPorIdApi } from '../api/profesoresApi';
import type { Profesor } from '../types/profesor.types';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const ViewProfesorPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [profesor, setProfesor] = useState<Profesor | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProfesorDetails();
      fetchSucursales();
    }
  }, [id]);

  const fetchProfesorDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await obtenerProfesorPorIdApi(id);
      if (response.success) {
        setProfesor(response.data);
      } else {
        setError('Error al cargar los detalles del profesor');
      }
    } catch (err: any) {
      console.error('Error al obtener profesor:', err);
      setError(err.message || 'Error al cargar los detalles del profesor');
    } finally {
      setLoading(false);
    }
  };

  const fetchSucursales = async () => {
    try {
      const response = await obtenerTodasSucursalesApi();
      if (response.success) {
        setSucursales(response.data);
      }
    } catch (err: any) {
      console.error('Error al obtener sucursales:', err);
    }
  };

  const getSucursalNombre = (sucursalId?: string): string => {
    if (!sucursalId) return 'N/A';
    const sucursal = sucursales.find(s => s.id === sucursalId);
    return sucursal?.nombre || 'Sucursal no encontrada';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBirthDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-cyan-600 dark:text-cyan-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del profesor...</p>
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
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">Error al cargar el profesor</p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/profesores')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Profesores
          </button>
        </div>
      </div>
    );
  }

  if (!profesor) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/profesores')}
          className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Profesores</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md shadow-cyan-500/30">
              <FaChalkboardTeacher className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detalles del Profesor</h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Información completa del profesor</p>
            </div>
          </div>
          {hasPermission('profesores.editar') && (
            <button
              onClick={() => navigate(`/profesores/edit/${profesor.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
            >
              <FaEdit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* Información básica */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">ID:</span>
              <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">#{profesor.id}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {profesor.nombre} {profesor.primerApellido} {profesor.segundoApellido || ''}
            </h2>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${
              profesor.estado
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {profesor.estado ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
            {profesor.estado ? 'Activo' : 'Inactivo'}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Correo Electrónico
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaEnvelope className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm break-all">{profesor.correo}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">Teléfono</label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaPhone className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{profesor.telefono || 'N/A'}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Identificación
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaIdCard className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{profesor.identificacion}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Nacimiento
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaCalendar className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{formatBirthDate(profesor.fechaNacimiento)}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border lg:col-span-2">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Dirección
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaMapMarkerAlt className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{profesor.direccion || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asignación de Sucursales */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaBuilding className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Asignación de Sucursales</h3>
        </div>

        <div className="space-y-4">
          {/* Sucursal Principal */}
          <div className="pb-4 border-b border-neutral-200 dark:border-dark-border">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
              Sucursal Principal
            </label>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg">
                <FaBuilding className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                <span className="text-sm font-medium text-cyan-900 dark:text-cyan-100">
                  {getSucursalNombre(profesor.idSucursalPrincipal)}
                </span>
                <span className="ml-2 text-xs px-2 py-0.5 bg-cyan-600 text-white rounded-full font-semibold">
                  Principal
                </span>
              </div>
            </div>
          </div>

          {/* Sucursales Adicionales */}
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-3">
              Sucursales Asignadas ({profesor.idSucursales?.length || 0})
            </label>
            {profesor.idSucursales && profesor.idSucursales.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {profesor.idSucursales.map((sucursalId) => {
                  const sucursal = sucursales.find(s => s.id === sucursalId);
                  const isPrincipal = sucursalId === profesor.idSucursalPrincipal;

                  return (
                    <div
                      key={sucursalId}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${
                        isPrincipal
                          ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800'
                          : 'bg-neutral-50 dark:bg-dark-bg border-neutral-200 dark:border-dark-border'
                      }`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <FaBuilding className={`w-4 h-4 ${
                          isPrincipal
                            ? 'text-cyan-600 dark:text-cyan-400'
                            : 'text-neutral-500 dark:text-neutral-400'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${
                            isPrincipal
                              ? 'text-cyan-900 dark:text-cyan-100'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}>
                            {sucursal?.nombre || 'Sucursal no encontrada'}
                          </p>
                          {isPrincipal && (
                            <span className="text-xs px-2 py-0.5 bg-cyan-600 text-white rounded-full font-semibold">
                              Principal
                            </span>
                          )}
                        </div>
                        {sucursal?.direccion && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                            {sucursal.direccion}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-lg">
                <FaBuilding className="w-4 h-4 text-neutral-400" />
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                  No hay sucursales asignadas
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Información de Moodle */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaGlobe className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Información de Moodle</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
              Usuario Moodle
            </label>
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
              <FaChalkboardTeacher className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
              <span className="text-sm font-mono">{profesor.nombreUsuario || 'N/A'}</span>
            </div>
          </div>

          <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">ID Moodle</label>
            <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
              <FaKey className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
              <span className="text-sm font-mono">{profesor.idMoodle || 'No sincronizado'}</span>
            </div>
          </div>

          {profesor.contrasenaTemporal && (
            <div className="md:col-span-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <label className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wide block mb-2">
                Contraseña Temporal
              </label>
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                <FaKey className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <span className="text-sm font-mono font-semibold">{profesor.contrasenaTemporal}</span>
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                ⚠️ El profesor debe cambiar esta contraseña en su primer acceso a Moodle
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Información de Auditoría */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <FaClock className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Información de Auditoría</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
              Fecha de Creación
            </label>
            <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDate(profesor.creadoEn)}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
              Última Modificación
            </label>
            <p className="text-sm text-neutral-900 dark:text-neutral-100">{formatDate(profesor.modificadoEn)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
