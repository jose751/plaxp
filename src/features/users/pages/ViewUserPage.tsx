import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaEnvelope, FaShieldAlt, FaClock, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaEdit, FaBuilding } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerUsuarioPorIdApi } from '../api/UsersApi';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { UsuarioDetalle } from '../types/user.types';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { UserAvatar } from '../components/UserAvatar';

export const ViewUserPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<UsuarioDetalle | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Cargar usuario y sucursales en paralelo
      const [usuarioResponse, sucursalesResponse] = await Promise.all([
        obtenerUsuarioPorIdApi(id),
        obtenerTodasSucursalesApi(),
      ]);

      if (usuarioResponse.success) {
        setUsuario(usuarioResponse.data);
      } else {
        setError('Error al cargar los detalles del usuario');
      }

      if (sucursalesResponse.success) {
        setSucursales(sucursalesResponse.data);
      }
    } catch (err: any) {
      console.error('Error al obtener datos:', err);
      setError(err.message || 'Error al cargar los detalles del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Función para obtener el nombre de la sucursal por ID
  const getSucursalNombre = (sucursalId?: string): string => {
    if (!sucursalId) return 'N/A';
    const sucursal = sucursales.find(s => s.id === sucursalId);
    return sucursal?.nombre || sucursalId;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <CgSpinner className="w-12 h-12 text-purple-600 dark:text-purple-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del usuario...</p>
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
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">Error al cargar el usuario</p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/usuarios')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Usuarios
          </button>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return null;
  }

  const isActive = usuario.estado === 'activo' || usuario.estado === '1';

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/usuarios')}
          className="flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Usuarios</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/30">
              <FaUser className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detalles del Usuario</h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Información completa del usuario</p>
            </div>
          </div>
          <button
            onClick={() => navigate(`/usuarios/edit/${usuario.id}`)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
          >
            <FaEdit className="w-4 h-4" />
            Editar
          </button>
        </div>
      </div>

      {/* Información Principal */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            {/* Avatar grande */}
            <UserAvatar
              nombre={usuario.nombre}
              pathFoto={usuario.pathFoto}
              size="xl"
              className="shadow-lg ring-4 ring-white dark:ring-dark-card"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">ID:</span>
                <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">#{usuario.id}</span>
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{usuario.nombre}</h2>
              <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400 text-sm">
                <FaEnvelope className="w-4 h-4" />
                <span>{usuario.correo}</span>
              </div>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${
              isActive
                ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {isActive ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
            {isActive ? 'Activo' : 'Inactivo'}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Creación
              </label>
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FaCalendarAlt className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formatDate(usuario.creadoEn)}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Último Acceso
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaClock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{formatDate(usuario.ultimoLogin)}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Última Modificación
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaEdit className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{formatDate(usuario.fechaModificacion)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rol */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-900/30 dark:to-teal-800/30">
            <FaShieldAlt className="w-4 h-4 text-teal-700 dark:text-teal-400" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Rol y Permisos</h3>
        </div>
        <div className="bg-gradient-to-r from-teal-50 to-teal-100/50 dark:from-teal-900/20 dark:to-teal-800/20 border border-teal-200 dark:border-teal-800 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-neutral-700 dark:text-neutral-300">Rol asignado:</span>
            <span className="text-sm font-bold text-teal-700 dark:text-teal-400">{usuario.nombreRol}</span>
          </div>
        </div>
      </div>

      {/* Sucursales */}
      {(usuario.idSucursalPrincipal || (usuario.idSucursales && usuario.idSucursales.length > 0)) && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30">
              <FaBuilding className="w-4 h-4 text-blue-700 dark:text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Sucursales</h3>
          </div>

          <div className="space-y-3">
            {usuario.idSucursalPrincipal && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">Sucursal Principal:</span>
                  <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    {getSucursalNombre(usuario.idSucursalPrincipal)}
                  </span>
                </div>
              </div>
            )}

            {usuario.idSucursales && usuario.idSucursales.length > 0 && (
              <div className="bg-neutral-50 dark:bg-neutral-800/30 border border-neutral-200 dark:border-dark-border rounded-lg px-4 py-3">
                <div className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">Sucursales Adicionales:</div>
                <div className="flex flex-wrap gap-2">
                  {usuario.idSucursales.map((sucursalId, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-md text-sm text-neutral-700 dark:text-neutral-300"
                    >
                      {getSucursalNombre(sucursalId)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
