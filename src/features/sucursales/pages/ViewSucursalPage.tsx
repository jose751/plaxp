import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaBuilding, FaClock, FaCheckCircle, FaTimesCircle, FaEdit, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerSucursalPorIdApi } from '../api/sucursalesApi';
import type { Sucursal } from '../types/sucursal.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const ViewSucursalPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [sucursal, setSucursal] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchSucursalDetails();
    }
  }, [id]);

  const fetchSucursalDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await obtenerSucursalPorIdApi(id);
      setSucursal(response.data);
    } catch (err: any) {
      console.error('Error al obtener sucursal:', err);
      setError(err.message || 'Error al cargar los detalles de la sucursal');
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
        <CgSpinner className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información de la sucursal...</p>
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
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">Error al cargar la sucursal</p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/sucursales')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Sucursales
          </button>
        </div>
      </div>
    );
  }

  if (!sucursal) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <button
          onClick={() => navigate('/sucursales')}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Sucursales</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30">
              <FaBuilding className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detalles de la Sucursal</h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Información completa de la sucursal</p>
            </div>
          </div>
          {hasPermission('sucursales.editar') && (
            <button
              onClick={() => navigate(`/sucursales/edit/${sucursal.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
            >
              <FaEdit className="w-4 h-4" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{sucursal.nombre}</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium self-start ${
                sucursal.estado === 1
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {sucursal.estado === 1 ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
              {sucursal.estado === 1 ? 'Activo' : 'Inactivo'}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {sucursal.direccion && (
              <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                  Dirección
                </label>
                <div className="flex items-start gap-2">
                  <FaMapMarkerAlt className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{sucursal.direccion}</span>
                </div>
              </div>
            )}

            {sucursal.telefono && (
              <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                  Teléfono
                </label>
                <div className="flex items-center gap-2">
                  <FaPhone className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{sucursal.telefono}</span>
                </div>
              </div>
            )}

            {sucursal.correo && (
              <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                  Correo Electrónico
                </label>
                <div className="flex items-center gap-2">
                  <FaEnvelope className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{sucursal.correo}</span>
                </div>
              </div>
            )}

            <div className="pb-3 md:pb-0">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Creación
              </label>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formatDate(sucursal.creadoEn)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
