import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaClock, FaCheckCircle, FaTimesCircle, FaEdit, FaEye, FaEyeSlash, FaLayerGroup, FaSitemap, FaHashtag } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerCategoriaPorIdApi } from '../api/categoriasApi';
import type { Categoria } from '../types/categoria.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const ViewCategoriaPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCategoriaDetails();
    }
  }, [id]);

  const fetchCategoriaDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await obtenerCategoriaPorIdApi(id);
      setCategoria(response.data);
    } catch (err: any) {
      console.error('Error al obtener categoría:', err);
      setError(err.message || 'Error al cargar los detalles de la categoría');
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
        <CgSpinner className="w-12 h-12 text-primary dark:text-amber-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información de la categoría...</p>
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
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">Error al cargar la categoría</p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/categorias')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Categorías
          </button>
        </div>
      </div>
    );
  }

  if (!categoria) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/categorias')}
          className="flex items-center gap-2 text-primary dark:text-amber-400 hover:text-purple-700 dark:hover:text-amber-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Categorías de Cursos</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/30">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detalles de la Categoría de Curso</h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Información completa de la categoría</p>
            </div>
          </div>
          {hasPermission('categorias.editar') && (
            <button
              onClick={() => navigate(`/categorias/edit/${categoria.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto shadow-md"
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
              <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">#{categoria.id}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{categoria.nombre}</h2>
            {categoria.descripcion && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{categoria.descripcion}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                categoria.activo
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {categoria.activo ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
              {categoria.activo ? 'Activo' : 'Inactivo'}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                categoria.esVisible
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700'
                  : 'bg-neutral-50 dark:bg-neutral-800/20 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-dark-border'
              }`}
            >
              {categoria.esVisible ? <FaEye className="w-3 h-3" /> : <FaEyeSlash className="w-3 h-3" />}
              {categoria.esVisible ? 'Visible' : 'Oculto'}
            </div>
            {categoria.permiteCursos && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700">
                <FaCheckCircle className="w-3 h-3" />
                Permite Cursos
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Código
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaHashtag className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm font-mono">{categoria.slug}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Nivel
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaLayerGroup className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">Nivel {categoria.nivel}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Orden
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaSitemap className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{categoria.orden}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Creación
              </label>
              <div className="flex items-center gap-2 text-primary dark:text-amber-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formatDate(categoria.creadoEn)}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Última Actualización
              </label>
              <div className="flex items-center gap-2 text-primary dark:text-amber-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formatDate(categoria.actualizadoEn)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información jerárquica */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-5">
          <FaSitemap className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Jerarquía</h3>
        </div>

        <div className="space-y-5">
          {/* Categoría Padre */}
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
              Categoría Padre
            </label>
            {categoria.padre ? (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">{categoria.padre.nombre}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">/{categoria.padre.slug} • Nivel {categoria.padre.nivel}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/categorias/view/${categoria.padre?.id}`)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                  >
                    <FaEye className="w-3 h-3" />
                    Ver
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-dark-border rounded-lg px-3 py-2">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Raíz (sin categoría padre)</span>
              </div>
            )}
          </div>

          {/* Categorías Hijas */}
          {categoria.hijos && categoria.hijos.length > 0 && (
            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Subcategorías ({categoria.hijos.length})
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categoria.hijos.map((hijo) => (
                  <div
                    key={hijo.id}
                    className="bg-gradient-to-r from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-3 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-purple-900 dark:text-purple-300 truncate">{hijo.nombre}</p>
                        <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">/{hijo.slug} • Nivel {hijo.nivel}</p>
                      </div>
                      <button
                        onClick={() => navigate(`/categorias/view/${hijo.id}`)}
                        className="ml-2 text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 flex-shrink-0"
                      >
                        <FaEye className="w-3 h-3" />
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Integración con Moodle */}
      {(categoria.idMoodle || categoria.sincronizadoMoodle) && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <FaLayerGroup className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Integración con Moodle</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoria.idMoodle && (
              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                  ID de Moodle
                </label>
                <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-dark-border rounded-lg px-3 py-2">
                  <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">{categoria.idMoodle}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Estado de Sincronización
              </label>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  categoria.sincronizadoMoodle
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-neutral-50 dark:bg-neutral-800/20 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-dark-border'
                }`}
              >
                {categoria.sincronizadoMoodle ? (
                  <FaCheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <FaTimesCircle className="w-3.5 h-3.5" />
                )}
                {categoria.sincronizadoMoodle ? 'Sincronizado' : 'No sincronizado'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
