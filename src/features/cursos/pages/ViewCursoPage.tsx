import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FaArrowLeft,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaEdit,
  FaLayerGroup,
  FaCode,
  FaLink,
  FaHashtag,
  FaCalendarAlt,
  FaBuilding,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerCursoPorIdApi } from '../api/cursosApi';
import { obtenerCategoriaPorIdApi } from '../../categorias/api/categoriasApi';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Curso } from '../types/curso.types';
import type { Categoria } from '../../categorias/types/categoria.types';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

export const ViewCursoPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCursoDetails();
    }
  }, [id]);

  const fetchCursoDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Cargar curso y sucursales en paralelo
      const [cursoResponse, sucursalesResponse] = await Promise.all([
        obtenerCursoPorIdApi(id),
        obtenerTodasSucursalesApi(),
      ]);

      setCurso(cursoResponse.data);

      if (sucursalesResponse.success) {
        setSucursales(sucursalesResponse.data);
      }

      // Cargar la categoría
      if (cursoResponse.data.categoriaId) {
        try {
          const catResponse = await obtenerCategoriaPorIdApi(cursoResponse.data.categoriaId);
          setCategoria(catResponse.data);
        } catch (catErr) {
          console.error('Error al cargar categoría:', catErr);
        }
      }
    } catch (err: any) {
      console.error('Error al obtener curso:', err);
      setError(err.message || 'Error al cargar los detalles del curso');
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
    });
  };

  const formatDateTime = (dateString: string) => {
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
        <CgSpinner className="w-12 h-12 text-primary dark:text-purple-400 animate-spin mb-3" />
        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Cargando información del curso...</p>
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
          <p className="text-neutral-900 dark:text-neutral-100 font-semibold mb-2">Error al cargar el curso</p>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center mb-6">{error}</p>
          <button
            onClick={() => navigate('/cursos')}
            className="px-5 py-2 bg-neutral-600 text-white text-sm font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Volver a Cursos
          </button>
        </div>
      </div>
    );
  }

  if (!curso) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/cursos')}
          className="flex items-center gap-2 text-primary dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4 transition-colors font-medium"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm">Volver a Gestión de Cursos</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">Detalles del Curso</h1>
              <p className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 mt-1">Información completa del curso</p>
            </div>
          </div>
          {hasPermission('cursos.editar') && (
            <button
              onClick={() => navigate(`/cursos/edit/${curso.id}`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30 text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all w-full md:w-auto"
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
              <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">#{curso.id}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-neutral-100 mb-1">{curso.nombre}</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{curso.nombreCorto}</p>
            {curso.descripcion && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-3">{curso.descripcion}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium ${
                curso.estado
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
              }`}
            >
              {curso.estado ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
              {curso.estado ? 'Activo' : 'Inactivo'}
            </div>
            {curso.sincronizadoMoodle && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-700">
                <FaCheckCircle className="w-3 h-3" />
                Sincronizado Moodle
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-200 dark:border-dark-border">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Código del Curso
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaCode className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm font-mono">{curso.codigo}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Código URL
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaHashtag className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm font-mono">{curso.slug}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Categoría
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaLayerGroup className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{categoria ? categoria.nombre : 'Cargando...'}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Sucursal
              </label>
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100">
                <FaBuilding className="w-4 h-4 text-neutral-400 dark:text-neutral-500 flex-shrink-0" />
                <span className="text-sm">{getSucursalNombre(curso.idSucursal)}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Control de Finalización
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                    curso.enableCompletion
                      ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
                      : 'bg-neutral-50 dark:bg-neutral-800/20 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-dark-border'
                  }`}
                >
                  {curso.enableCompletion ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
                  {curso.enableCompletion ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Fecha de Creación
              </label>
              <div className="flex items-center gap-2 text-primary dark:text-purple-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formatDateTime(curso.creadoEn)}</span>
              </div>
            </div>

            <div className="pb-3 md:pb-0 border-b md:border-b-0 border-neutral-200 dark:border-dark-border">
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Última Actualización
              </label>
              <div className="flex items-center gap-2 text-primary dark:text-purple-400">
                <FaClock className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{formatDateTime(curso.modificadoEn)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fechas del Curso */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md mb-6">
        <div className="flex items-center gap-2 mb-5">
          <FaCalendarAlt className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
          <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Fechas del Curso</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
              Fecha de Inicio
            </label>
            <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-dark-border rounded-lg px-3 py-2">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{formatDate(curso.fechaInicio)}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
              Fecha de Fin
            </label>
            <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-dark-border rounded-lg px-3 py-2">
              <span className="text-sm text-neutral-700 dark:text-neutral-300">{formatDate(curso.fechaFin)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Integración con Moodle */}
      {(curso.idMoodle || curso.sincronizadoMoodle) && (
        <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-100 dark:border-dark-border p-4 md:p-6 shadow-md">
          <div className="flex items-center gap-2 mb-5">
            <FaLink className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
            <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Integración con Moodle</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curso.idMoodle && (
              <div>
                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                  ID de Moodle
                </label>
                <div className="bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200 dark:border-dark-border rounded-lg px-3 py-2">
                  <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300">{curso.idMoodle}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide block mb-2">
                Estado de Sincronización
              </label>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                  curso.sincronizadoMoodle
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-neutral-50 dark:bg-neutral-800/20 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-dark-border'
                }`}
              >
                {curso.sincronizadoMoodle ? (
                  <FaCheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <FaTimesCircle className="w-3.5 h-3.5" />
                )}
                {curso.sincronizadoMoodle ? 'Sincronizado' : 'No sincronizado'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
