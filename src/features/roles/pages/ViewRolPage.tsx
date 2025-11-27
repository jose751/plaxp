import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaShieldAlt, FaClock, FaCheckCircle, FaTimesCircle, FaKey, FaEdit } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerRolConPermisosApi } from '../api/rolesApi';
import type { RolConPermisos } from '../types/role.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const ViewRolPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [rol, setRol] = useState<RolConPermisos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchRolDetails();
    }
  }, [id]);

  const fetchRolDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await obtenerRolConPermisosApi(id);
      setRol(response.data);
    } catch (err: any) {
      console.error('Error al obtener rol:', err);
      setError(err.message || 'Error al cargar los detalles del rol');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-teal-600 dark:text-teal-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del rol...</p>
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
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">Error al cargar el rol</p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/roles')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Roles
          </button>
        </div>
      </div>
    );
  }

  if (!rol) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/roles')}
          className="flex items-center gap-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Roles</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/30">
              <FaShieldAlt className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detalles del Rol</h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Información completa del rol y sus permisos</p>
            </div>
          </div>
          {hasPermission('roles.editar') && (
            <button
              onClick={() => navigate(`/roles/edit/${rol.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
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
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">ID:</span>
              <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">#{rol.id}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{rol.nombre}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{rol.descripcion}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${
                rol.esSuperadmin
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
              }`}
            >
              {rol.esSuperadmin ? <FaCheckCircle className="w-3 h-3" /> : <FaShieldAlt className="w-3 h-3" />}
              {rol.esSuperadmin ? 'Superadmin' : 'Estándar'}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${
                rol.estado
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {rol.estado ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
              {rol.estado ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Creación
              </label>
              <div className="flex items-center gap-2 text-primary dark:text-teal-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formatDate(rol.creadoEn)}</span>
              </div>
            </div>

            {!rol.esSuperadmin && rol.permisos && rol.permisos.length > 0 && (
              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                  Permisos Asignados
                </label>
                <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                  <FaKey className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                  <span className="text-sm">{rol.permisos.length} permisos</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permisos */}
      {!rol.esSuperadmin && rol.permisos && rol.permisos.length > 0 && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <FaKey className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Permisos del Rol</h3>
          </div>

          <div className="space-y-4">
            {Object.entries(
              rol.permisos.reduce((acc, permiso) => {
                if (!acc[permiso.modulo]) {
                  acc[permiso.modulo] = [];
                }
                acc[permiso.modulo].push(permiso);
                return acc;
              }, {} as Record<string, typeof rol.permisos>)
            ).map(([modulo, permisosDelModulo]) => (
              <div key={modulo} className="border border-neutral-200 dark:border-dark-border rounded-lg p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{modulo}</h4>
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2.5 py-1 rounded-md border border-neutral-200 dark:border-dark-border self-start">
                    {permisosDelModulo.length} {permisosDelModulo.length === 1 ? 'permiso' : 'permisos'}
                  </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
                  {permisosDelModulo.map(permiso => (
                    <div key={permiso.id} className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/20 px-3 py-2 rounded-md">
                      <FaCheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="break-words">{permiso.descripcion || permiso.codigo}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!rol.esSuperadmin && (!rol.permisos || rol.permisos.length === 0) && (
        <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-dark-border rounded-lg p-6 md:p-8 text-center">
          <FaKey className="w-8 h-8 md:w-10 md:h-10 text-neutral-400 dark:text-neutral-500 mx-auto mb-3" />
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Este rol no tiene permisos asignados</p>
          {hasPermission('roles.gestionar_permisos') && (
            <button
              onClick={() => navigate(`/roles/edit/${rol.id}`)}
              className="px-4 py-2 text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 font-medium transition-colors"
            >
              Asignar permisos
            </button>
          )}
        </div>
      )}
    </div>
  );
};
