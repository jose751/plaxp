import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiArrowLeft,
  HiUserGroup,
  HiAcademicCap,
  HiUserAdd,
  HiTrash,
  HiSearch,
  HiCheck,
  HiBookOpen,
  HiClipboardList,
  HiCalendar,
  HiChevronLeft,
  HiChevronRight,
  HiSave,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle,
} from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import {
  obtenerParticipantesCursoApi,
  desinscribirEstudianteApi,
  inscribirEstudiantesApi,
} from '../../inscripciones/api/inscripcionesApi';
import { listarEstudiantesApi } from '../../estudiantes/api/estudiantesApi';
import {
  obtenerAsistenciaFechaApi,
  guardarAsistenciasCursoApi,
  listarAsistenciasCursoApi,
} from '../api/asistenciasApi';
import type { Inscripcion, ProfesorAsignado, CursoInfo } from '../../inscripciones/types/inscripcion.types';
import type { Estudiante } from '../../estudiantes/types/estudiante.types';
import type { EstudianteAsistencia, EstadoAsistencia, ResumenAsistenciaDia, AsistenciaIndividualData, Asistencia } from '../types/curso.types';

type TabType = 'estudiantes' | 'profesores' | 'agregar' | 'asistencias';

// Información de una fecha con asistencias
interface FechaAsistenciaInfo {
  fecha: string;
  totalRegistros: number;
  esBorrador: boolean; // Si hay menos registros que estudiantes
}

export const VerGrupoCursoPage = () => {
  const { id: cursoId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('estudiantes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Datos del curso
  const [curso, setCurso] = useState<CursoInfo | null>(null);
  const [estudiantes, setEstudiantes] = useState<Inscripcion[]>([]);
  const [profesores, setProfesores] = useState<ProfesorAsignado[]>([]);

  // Para agregar estudiantes
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Estudiante[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedEstudiantes, setSelectedEstudiantes] = useState<string[]>([]);
  const [inscribiendoLoading, setInscribiendoLoading] = useState(false);

  // Para eliminar
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  // Para asistencias
  const [fechaAsistencia, setFechaAsistencia] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [estudiantesAsistencia, setEstudiantesAsistencia] = useState<EstudianteAsistencia[]>([]);
  const [resumenAsistencia, setResumenAsistencia] = useState<ResumenAsistenciaDia | null>(null);
  const [asistenciasModificadas, setAsistenciasModificadas] = useState<Map<string, EstadoAsistencia>>(new Map());
  const [loadingAsistencia, setLoadingAsistencia] = useState(false);
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(false);

  // Historial de fechas con asistencias
  const [historialFechas, setHistorialFechas] = useState<FechaAsistenciaInfo[]>([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  // Cargar datos del grupo
  const loadGroupData = useCallback(async () => {
    if (!cursoId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await obtenerParticipantesCursoApi(cursoId);
      if (response.success) {
        setCurso(response.data.curso);
        setEstudiantes(response.data.estudiantes);
        setProfesores(response.data.profesores);
      } else {
        setError('Error al cargar los datos del grupo');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar los datos del grupo');
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    if (cursoId) {
      loadGroupData();
    }
  }, [cursoId, loadGroupData]);

  // Buscar estudiantes para agregar
  const handleSearchEstudiantes = async () => {
    if (!searchTerm.trim()) return;

    setSearchLoading(true);
    try {
      const response = await listarEstudiantesApi({
        q: searchTerm,
        estado: true,
        limit: 20,
      });

      if (response.success) {
        // Filtrar los que ya están inscritos
        const estudiantesInscritos = estudiantes.map((e) => e.estudianteId);
        const disponibles = response.data.estudiantes.filter(
          (e) => !estudiantesInscritos.includes(e.id)
        );
        setSearchResults(disponibles);
      }
    } catch (err: any) {
      console.error('Error buscando estudiantes:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Toggle selección de estudiante
  const toggleEstudianteSelection = (estudianteId: string) => {
    setSelectedEstudiantes((prev) =>
      prev.includes(estudianteId)
        ? prev.filter((id) => id !== estudianteId)
        : [...prev, estudianteId]
    );
  };

  // Inscribir estudiantes seleccionados
  const handleInscribirEstudiantes = async () => {
    if (selectedEstudiantes.length === 0 || !cursoId) return;

    setInscribiendoLoading(true);
    setError(null);

    try {
      const response = await inscribirEstudiantesApi({
        cursoId,
        estudiantes: selectedEstudiantes.map((id) => ({ estudianteId: id })),
      });

      if (response.success) {
        setSuccessMessage(`${selectedEstudiantes.length} estudiante(s) inscrito(s) exitosamente`);
        setSelectedEstudiantes([]);
        setSearchResults([]);
        setSearchTerm('');
        await loadGroupData();
        setActiveTab('estudiantes');

        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Error al inscribir estudiantes');
      }
    } catch (err: any) {
      setError(err.message || 'Error al inscribir estudiantes');
    } finally {
      setInscribiendoLoading(false);
    }
  };

  // Eliminar estudiante del curso
  const handleEliminarEstudiante = async (inscripcionId: string) => {
    setEliminandoId(inscripcionId);
    setError(null);

    try {
      const response = await desinscribirEstudianteApi(inscripcionId);
      if (response.success) {
        setSuccessMessage('Estudiante eliminado del curso exitosamente');
        await loadGroupData();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Error al eliminar estudiante del curso');
      }
    } catch (err: any) {
      setError(err.message || 'Error al eliminar estudiante del curso');
    } finally {
      setEliminandoId(null);
    }
  };

  // Cargar asistencia de una fecha
  const loadAsistenciaFecha = useCallback(async () => {
    if (!cursoId || !fechaAsistencia) return;

    setLoadingAsistencia(true);
    try {
      const response = await obtenerAsistenciaFechaApi(cursoId, fechaAsistencia);
      if (response.success && response.data.estudiantes.length > 0) {
        setEstudiantesAsistencia(response.data.estudiantes);
        setResumenAsistencia(response.data.resumen);
        setAsistenciasModificadas(new Map());
      } else {
        // Si la API no devuelve estudiantes, usar los estudiantes inscritos del curso
        const estudiantesDelCurso: EstudianteAsistencia[] = estudiantes.map((inscripcion) => ({
          estudianteId: inscripcion.estudianteId,
          estudianteNombre: `${inscripcion.estudiante?.nombre || ''} ${inscripcion.estudiante?.primerApellido || ''} ${inscripcion.estudiante?.segundoApellido || ''}`.trim(),
          asistencia: null,
        }));
        setEstudiantesAsistencia(estudiantesDelCurso);
        setResumenAsistencia({
          total: estudiantesDelCurso.length,
          presentes: 0,
          ausentes: 0,
          tardanzas: 0,
          justificados: 0,
          permisos: 0,
          sinRegistro: estudiantesDelCurso.length,
        });
        setAsistenciasModificadas(new Map());
      }
    } catch (err: any) {
      console.error('Error cargando asistencia:', err);
      // En caso de error, también usar los estudiantes del curso
      const estudiantesDelCurso: EstudianteAsistencia[] = estudiantes.map((inscripcion) => ({
        estudianteId: inscripcion.estudianteId,
        estudianteNombre: `${inscripcion.estudiante?.nombre || ''} ${inscripcion.estudiante?.primerApellido || ''} ${inscripcion.estudiante?.segundoApellido || ''}`.trim(),
        asistencia: null,
      }));
      setEstudiantesAsistencia(estudiantesDelCurso);
      setResumenAsistencia({
        total: estudiantesDelCurso.length,
        presentes: 0,
        ausentes: 0,
        tardanzas: 0,
        justificados: 0,
        permisos: 0,
        sinRegistro: estudiantesDelCurso.length,
      });
    } finally {
      setLoadingAsistencia(false);
    }
  }, [cursoId, fechaAsistencia, estudiantes]);

  // Cargar historial de fechas con asistencias
  const loadHistorialFechas = useCallback(async () => {
    if (!cursoId) return;

    setLoadingHistorial(true);
    try {
      const response = await listarAsistenciasCursoApi(cursoId);
      if (response.success && response.data) {
        // Agrupar las asistencias por fecha
        const fechasMap = new Map<string, number>();
        response.data.forEach((asistencia: Asistencia) => {
          const fecha = asistencia.fecha.split('T')[0];
          fechasMap.set(fecha, (fechasMap.get(fecha) || 0) + 1);
        });

        // Convertir a array y ordenar por fecha descendente
        const fechasArray: FechaAsistenciaInfo[] = Array.from(fechasMap.entries())
          .map(([fecha, totalRegistros]) => ({
            fecha,
            totalRegistros,
            esBorrador: totalRegistros < estudiantes.length, // Es borrador si hay menos registros que estudiantes
          }))
          .sort((a, b) => b.fecha.localeCompare(a.fecha));

        setHistorialFechas(fechasArray);
      }
    } catch (err: any) {
      console.error('Error cargando historial de asistencias:', err);
    } finally {
      setLoadingHistorial(false);
    }
  }, [cursoId, estudiantes.length]);

  // Cargar asistencia cuando cambia la fecha o se activa la pestaña
  useEffect(() => {
    if (activeTab === 'asistencias' && cursoId) {
      loadAsistenciaFecha();
      loadHistorialFechas();
    }
  }, [activeTab, fechaAsistencia, cursoId, loadAsistenciaFecha, loadHistorialFechas]);

  // Cambiar estado de asistencia de un estudiante
  const handleCambiarAsistencia = (estudianteId: string, nuevoEstado: EstadoAsistencia) => {
    setAsistenciasModificadas((prev) => {
      const newMap = new Map(prev);
      newMap.set(estudianteId, nuevoEstado);
      return newMap;
    });
  };

  // Obtener el estado actual de un estudiante (modificado o original)
  const getEstadoEstudiante = (est: EstudianteAsistencia): EstadoAsistencia | null => {
    if (asistenciasModificadas.has(est.estudianteId)) {
      return asistenciasModificadas.get(est.estudianteId)!;
    }
    return est.asistencia?.estado || null;
  };

  // Guardar asistencias
  const handleGuardarAsistencias = async () => {
    if (!cursoId || estudiantesAsistencia.length === 0) return;

    setGuardandoAsistencia(true);
    setError(null);

    try {
      const asistencias: AsistenciaIndividualData[] = [];

      // Agregar todas las asistencias (modificadas, originales, o PRESENTE por defecto)
      estudiantesAsistencia.forEach((est) => {
        const estadoModificado = asistenciasModificadas.get(est.estudianteId);
        const estadoFinal = estadoModificado || est.asistencia?.estado || 'PRESENTE';

        asistencias.push({
          estudianteId: est.estudianteId,
          estado: estadoFinal,
        });
      });

      if (asistencias.length > 0) {
        const response = await guardarAsistenciasCursoApi(cursoId, fechaAsistencia, { asistencias });
        if (response.success) {
          setSuccessMessage('Asistencias guardadas correctamente');
          setAsistenciasModificadas(new Map());
          await loadAsistenciaFecha();
          setTimeout(() => setSuccessMessage(null), 3000);
        } else {
          setError('Error al guardar asistencias');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar asistencias');
    } finally {
      setGuardandoAsistencia(false);
    }
  };

  // Marcar todos con un estado
  const marcarTodos = (estado: EstadoAsistencia) => {
    const newMap = new Map<string, EstadoAsistencia>();
    estudiantesAsistencia.forEach((est) => {
      newMap.set(est.estudianteId, estado);
    });
    setAsistenciasModificadas(newMap);
  };

  // Obtener fecha de hoy en formato YYYY-MM-DD
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Verificar si una fecha es futura
  const esFechaFutura = (fecha: string) => {
    const today = getTodayString();
    return fecha > today;
  };

  // Verificar si es la fecha actual
  const esFechaActual = (fecha: string) => {
    const today = getTodayString();
    return fecha === today;
  };

  // Cambiar fecha (solo permite ir a fechas pasadas o actuales)
  const cambiarFecha = (dias: number) => {
    const fecha = new Date(fechaAsistencia);
    fecha.setDate(fecha.getDate() + dias);
    const nuevaFecha = fecha.toISOString().split('T')[0];

    // No permitir fechas futuras
    if (esFechaFutura(nuevaFecha)) {
      return;
    }

    setFechaAsistencia(nuevaFecha);
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Colores por estado
  const getEstadoColor = (estado: EstadoAsistencia | null) => {
    switch (estado) {
      case 'PRESENTE':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300 dark:border-green-700';
      case 'AUSENTE':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700';
      case 'TARDANZA':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
      case 'JUSTIFICADO':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      case 'PERMISO':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300 dark:border-purple-700';
      default:
        return 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-300 dark:border-neutral-600';
    }
  };

  const getEstadoLabel = (estado: EstadoAsistencia | null) => {
    switch (estado) {
      case 'PRESENTE': return 'Presente';
      case 'AUSENTE': return 'Ausente';
      case 'TARDANZA': return 'Tardanza';
      case 'JUSTIFICADO': return 'Justificado';
      case 'PERMISO': return 'Permiso';
      default: return 'Sin registrar';
    }
  };

  const estadosAsistencia: EstadoAsistencia[] = ['PRESENTE', 'AUSENTE', 'TARDANZA', 'JUSTIFICADO', 'PERMISO'];

  const tabs = [
    { key: 'estudiantes' as TabType, label: 'Estudiantes', icon: HiUserGroup, count: estudiantes.length },
    { key: 'profesores' as TabType, label: 'Profesores', icon: HiAcademicCap, count: profesores.length },
    { key: 'asistencias' as TabType, label: 'Asistencias', icon: HiClipboardList },
    { key: 'agregar' as TabType, label: 'Agregar Estudiantes', icon: HiUserAdd },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <CgSpinner className="animate-spin text-5xl text-primary mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400 text-lg">Cargando grupo del curso...</p>
      </div>
    );
  }

  return (
    <div className="w-full font-sans px-2 md:px-0">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/cursos')}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors mb-4"
        >
          <HiArrowLeft className="w-5 h-5" />
          <span>Volver a Cursos</span>
        </button>

        <div className="flex items-center gap-4">
          <div className="p-2 bg-neutral-100 dark:bg-dark-hover rounded-lg border border-neutral-200 dark:border-dark-border">
            <HiBookOpen className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
              {curso?.nombre || 'Cargando...'}
            </h1>
            {curso?.codigo && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Código: {curso.codigo}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
          {successMessage}
        </div>
      )}

      {/* Card principal */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-sm border border-neutral-200 dark:border-dark-border overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-dark-border px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                  activeTab === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-neutral-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div className="p-6">
          {/* Tab: Estudiantes */}
          {activeTab === 'estudiantes' && (
            <div className="space-y-4">
              {estudiantes.length === 0 ? (
                <div className="text-center py-12">
                  <HiUserGroup className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    No hay estudiantes inscritos
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                    Este curso aún no tiene estudiantes inscritos.
                  </p>
                  <button
                    onClick={() => setActiveTab('agregar')}
                    className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
                  >
                    <HiUserAdd className="w-4 h-4" />
                    Agregar estudiantes
                  </button>
                </div>
              ) : (
                <>
                  {/* Vista Desktop - Tabla */}
                  <div className="hidden md:block overflow-hidden">
                    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                      <table className="w-full table-auto border-separate border-spacing-y-1.5">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-200 dark:bg-dark-border text-gray-600 dark:text-neutral-300 uppercase text-xs leading-normal tracking-wide shadow-md">
                            <th className="py-2 px-5 text-left font-bold first:pl-6">Nombre</th>
                            <th className="py-2 px-5 text-left font-bold">Correo</th>
                            <th className="py-2 px-5 text-left font-bold">Identificación</th>
                            <th className="py-2 px-5 text-center font-bold">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="text-neutral-700 dark:text-neutral-300 text-sm">
                          {estudiantes.map((inscripcion, index) => (
                            <tr
                              key={inscripcion.id}
                              className={`hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-xl border-l-4 border-transparent hover:border-primary ${
                                index % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-neutral-50/50 dark:bg-dark-bg'
                              }`}
                            >
                              <td className="py-2.5 px-5 text-left first:pl-6">
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {inscripcion.estudiante?.nombre} {inscripcion.estudiante?.primerApellido} {inscripcion.estudiante?.segundoApellido || ''}
                                </span>
                              </td>
                              <td className="py-2.5 px-5 text-left">
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {inscripcion.estudiante?.correo}
                                </span>
                              </td>
                              <td className="py-2.5 px-5 text-left">
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {inscripcion.estudiante?.identificacion || '-'}
                                </span>
                              </td>
                              <td className="py-2.5 px-5 text-center">
                                <button
                                  onClick={() => handleEliminarEstudiante(inscripcion.id)}
                                  disabled={eliminandoId === inscripcion.id}
                                  className="text-red-500 hover:text-white transition-all duration-200 p-1.5 hover:bg-red-500 rounded-lg shadow hover:shadow-md disabled:opacity-50"
                                  title="Eliminar del curso"
                                >
                                  {eliminandoId === inscripcion.id ? (
                                    <CgSpinner className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <HiTrash className="w-4 h-4" />
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Vista Móvil - Cards */}
                  <div className="md:hidden space-y-4">
                    {estudiantes.map((inscripcion) => (
                      <div
                        key={inscripcion.id}
                        className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-neutral-200 dark:border-dark-border hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 overflow-hidden"
                      >
                        <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>
                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-dark-border">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                {inscripcion.estudiante?.nombre} {inscripcion.estudiante?.primerApellido} {inscripcion.estudiante?.segundoApellido || ''}
                              </div>
                            </div>
                            <button
                              onClick={() => handleEliminarEstudiante(inscripcion.id)}
                              disabled={eliminandoId === inscripcion.id}
                              className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="Eliminar del curso"
                            >
                              {eliminandoId === inscripcion.id ? (
                                <CgSpinner className="w-4 h-4 animate-spin" />
                              ) : (
                                <HiTrash className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="px-5 py-4 space-y-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5">
                              Correo
                            </span>
                            <div className="text-sm text-neutral-800 dark:text-neutral-200">
                              {inscripcion.estudiante?.correo}
                            </div>
                          </div>
                          {inscripcion.estudiante?.identificacion && (
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5">
                                Identificación
                              </span>
                              <div className="text-sm text-neutral-800 dark:text-neutral-200">
                                {inscripcion.estudiante.identificacion}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Profesores */}
          {activeTab === 'profesores' && (
            <div className="space-y-4">
              {profesores.length === 0 ? (
                <div className="text-center py-12">
                  <HiAcademicCap className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    No hay profesores asignados
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Este curso aún no tiene profesores asignados.
                  </p>
                </div>
              ) : (
                <>
                  {/* Vista Desktop - Tabla */}
                  <div className="hidden md:block overflow-hidden">
                    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
                      <table className="w-full table-auto border-separate border-spacing-y-1.5">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-200 dark:bg-dark-border text-gray-600 dark:text-neutral-300 uppercase text-xs leading-normal tracking-wide shadow-md">
                            <th className="py-2 px-5 text-left font-bold first:pl-6">Nombre</th>
                            <th className="py-2 px-5 text-left font-bold">Correo</th>
                          </tr>
                        </thead>
                        <tbody className="text-neutral-700 dark:text-neutral-300 text-sm">
                          {profesores.map((profesor, index) => (
                            <tr
                              key={profesor.id}
                              className={`hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-xl border-l-4 border-transparent hover:border-primary ${
                                index % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-neutral-50/50 dark:bg-dark-bg'
                              }`}
                            >
                              <td className="py-2.5 px-5 text-left first:pl-6">
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {profesor.nombre} {profesor.primerApellido} {profesor.segundoApellido || ''}
                                </span>
                              </td>
                              <td className="py-2.5 px-5 text-left">
                                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                  {profesor.correo}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Vista Móvil - Cards */}
                  <div className="md:hidden space-y-4">
                    {profesores.map((profesor) => (
                      <div
                        key={profesor.id}
                        className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-neutral-200 dark:border-dark-border hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 overflow-hidden"
                      >
                        <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>
                        <div className="px-5 py-4 border-b border-neutral-100 dark:border-dark-border">
                          <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                            {profesor.nombre} {profesor.primerApellido} {profesor.segundoApellido || ''}
                          </div>
                        </div>
                        <div className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5">
                              Correo
                            </span>
                            <div className="text-sm text-neutral-800 dark:text-neutral-200">
                              {profesor.correo}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab: Asistencias */}
          {activeTab === 'asistencias' && (
            <div className="space-y-6">
              {/* Selector de fecha */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cambiarFecha(-1)}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                    title="Día anterior"
                  >
                    <HiChevronLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                  <div className="flex items-center gap-2">
                    <HiCalendar className="w-5 h-5 text-primary" />
                    <input
                      type="date"
                      value={fechaAsistencia}
                      onChange={(e) => {
                        // No permitir fechas futuras
                        if (!esFechaFutura(e.target.value)) {
                          setFechaAsistencia(e.target.value);
                        }
                      }}
                      max={getTodayString()}
                      className="px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <button
                    onClick={() => cambiarFecha(1)}
                    disabled={esFechaActual(fechaAsistencia)}
                    className={`p-2 rounded-lg transition-colors ${
                      esFechaActual(fechaAsistencia)
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-neutral-100 dark:hover:bg-dark-hover'
                    }`}
                    title={esFechaActual(fechaAsistencia) ? 'No puedes ir a fechas futuras' : 'Día siguiente'}
                  >
                    <HiChevronRight className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  {/* Indicador de estado de la fecha actual */}
                  {resumenAsistencia && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      resumenAsistencia.sinRegistro === 0
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : resumenAsistencia.sinRegistro === resumenAsistencia.total
                        ? 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {resumenAsistencia.sinRegistro === 0 ? (
                        <>
                          <HiCheckCircle className="w-3.5 h-3.5" />
                          <span>Guardado</span>
                        </>
                      ) : resumenAsistencia.sinRegistro === resumenAsistencia.total ? (
                        <>
                          <HiExclamationCircle className="w-3.5 h-3.5" />
                          <span>Sin registrar</span>
                        </>
                      ) : (
                        <>
                          <HiExclamationCircle className="w-3.5 h-3.5" />
                          <span>Borrador</span>
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 capitalize">
                    {formatearFecha(fechaAsistencia)}
                  </p>
                </div>
              </div>

              {/* Historial de fechas guardadas */}
              <div className="bg-neutral-50 dark:bg-dark-hover rounded-xl p-4 border border-neutral-200 dark:border-dark-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                    <HiClock className="w-4 h-4" />
                    Fechas con Asistencias Guardadas
                  </h3>
                  {loadingHistorial && <CgSpinner className="w-4 h-4 animate-spin text-primary" />}
                </div>
                {historialFechas.length === 0 ? (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                    No hay asistencias registradas aún. Selecciona una fecha y guarda las asistencias.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {historialFechas.map((fechaInfo) => (
                      <button
                        key={fechaInfo.fecha}
                        onClick={() => {
                          if (!esFechaFutura(fechaInfo.fecha)) {
                            setFechaAsistencia(fechaInfo.fecha);
                          }
                        }}
                        disabled={esFechaFutura(fechaInfo.fecha)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          fechaAsistencia === fechaInfo.fecha
                            ? 'bg-primary text-white shadow-md'
                            : esFechaFutura(fechaInfo.fecha)
                            ? 'bg-neutral-200 dark:bg-neutral-700 opacity-50 cursor-not-allowed'
                            : 'bg-white dark:bg-dark-card hover:bg-primary/10 dark:hover:bg-primary/20 border border-neutral-200 dark:border-dark-border text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {fechaInfo.esBorrador ? (
                          <HiExclamationCircle className={`w-4 h-4 ${
                            fechaAsistencia === fechaInfo.fecha ? 'text-white/80' : 'text-yellow-500'
                          }`} />
                        ) : (
                          <HiCheckCircle className={`w-4 h-4 ${
                            fechaAsistencia === fechaInfo.fecha ? 'text-white/80' : 'text-green-500'
                          }`} />
                        )}
                        <span>
                          {new Date(fechaInfo.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className={`text-xs ${
                          fechaAsistencia === fechaInfo.fecha ? 'text-white/70' : 'text-neutral-500 dark:text-neutral-400'
                        }`}>
                          ({fechaInfo.totalRegistros})
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Resumen del día */}
              {resumenAsistencia && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="bg-neutral-100 dark:bg-dark-hover rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">{resumenAsistencia.total}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Total</p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{resumenAsistencia.presentes}</p>
                    <p className="text-xs text-green-600 dark:text-green-500">Presentes</p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{resumenAsistencia.ausentes}</p>
                    <p className="text-xs text-red-600 dark:text-red-500">Ausentes</p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{resumenAsistencia.tardanzas}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-500">Tardanzas</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{resumenAsistencia.justificados}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">Justificados</p>
                  </div>
                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{resumenAsistencia.permisos}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-500">Permisos</p>
                  </div>
                </div>
              )}

              {/* Acciones rápidas */}
              <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-neutral-200 dark:border-dark-border">
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Marcar todos como:</span>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      marcarTodos(e.target.value as EstadoAsistencia);
                      e.target.value = '';
                    }
                  }}
                  defaultValue=""
                  className="px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                >
                  <option value="" disabled>Seleccionar estado...</option>
                  {estadosAsistencia.map((estado) => (
                    <option key={estado} value={estado}>{getEstadoLabel(estado)}</option>
                  ))}
                </select>
              </div>

              {/* Lista de estudiantes */}
              {loadingAsistencia ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <CgSpinner className="animate-spin text-4xl text-primary mb-3" />
                  <p className="text-neutral-600 dark:text-neutral-400">Cargando asistencia...</p>
                </div>
              ) : estudiantesAsistencia.length === 0 ? (
                <div className="text-center py-12">
                  <HiClipboardList className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    No hay estudiantes inscritos
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Agrega estudiantes al curso para registrar asistencia.
                  </p>
                </div>
              ) : (
                <>
                  {/* Vista Desktop - Tabla */}
                  <div className="hidden md:block overflow-hidden">
                    <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 500px)' }}>
                      <table className="w-full table-auto border-separate border-spacing-y-1.5">
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-gray-200 dark:bg-dark-border text-gray-600 dark:text-neutral-300 uppercase text-xs leading-normal tracking-wide shadow-md">
                            <th className="py-2 px-5 text-left font-bold first:pl-6">Estudiante</th>
                            <th className="py-2 px-5 text-center font-bold" style={{ width: '180px' }}>Estado</th>
                          </tr>
                        </thead>
                        <tbody className="text-neutral-700 dark:text-neutral-300 text-sm">
                          {estudiantesAsistencia.map((est, index) => {
                            const estadoActual = getEstadoEstudiante(est) || 'PRESENTE';
                            const modificado = asistenciasModificadas.has(est.estudianteId);
                            return (
                              <tr
                                key={est.estudianteId}
                                className={`transition-all duration-200 shadow-sm ${
                                  modificado ? 'ring-2 ring-primary/50' : ''
                                } ${
                                  index % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-neutral-50/50 dark:bg-dark-bg'
                                }`}
                              >
                                <td className="py-2.5 px-5 text-left first:pl-6">
                                  <span className="font-medium text-neutral-800 dark:text-neutral-200">
                                    {est.estudianteNombre}
                                  </span>
                                </td>
                                <td className="py-2.5 px-5">
                                  <div className="flex items-center justify-center">
                                    <select
                                      value={estadoActual}
                                      onChange={(e) => handleCambiarAsistencia(est.estudianteId, e.target.value as EstadoAsistencia)}
                                      className={`w-full px-3 py-1.5 text-sm font-medium rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${getEstadoColor(estadoActual)}`}
                                    >
                                      {estadosAsistencia.map((estado) => (
                                        <option key={estado} value={estado}>{getEstadoLabel(estado)}</option>
                                      ))}
                                    </select>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Vista Móvil - Cards */}
                  <div className="md:hidden space-y-3">
                    {estudiantesAsistencia.map((est) => {
                      const estadoActual = getEstadoEstudiante(est) || 'PRESENTE';
                      const modificado = asistenciasModificadas.has(est.estudianteId);
                      return (
                        <div
                          key={est.estudianteId}
                          className={`bg-white dark:bg-dark-card rounded-xl shadow-sm border border-neutral-200 dark:border-dark-border overflow-hidden ${
                            modificado ? 'ring-2 ring-primary/50' : ''
                          }`}
                        >
                          <div className={`h-1 ${getEstadoColor(estadoActual).split(' ')[0]}`}></div>
                          <div className="px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-medium text-neutral-900 dark:text-neutral-100 text-sm flex-1">
                                {est.estudianteNombre}
                              </span>
                              <select
                                value={estadoActual}
                                onChange={(e) => handleCambiarAsistencia(est.estudianteId, e.target.value as EstadoAsistencia)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${getEstadoColor(estadoActual)}`}
                              >
                                {estadosAsistencia.map((estado) => (
                                  <option key={estado} value={estado}>{getEstadoLabel(estado)}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Botón de guardar */}
              {estudiantesAsistencia.length > 0 && (
                <div className="sticky bottom-0 bg-white dark:bg-dark-card border-t border-neutral-200 dark:border-dark-border -mx-6 px-6 py-4 mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      {asistenciasModificadas.size > 0 ? (
                        <><span className="font-semibold text-primary">{asistenciasModificadas.size}</span> cambio(s) pendiente(s)</>
                      ) : (
                        <span>{estudiantesAsistencia.length} estudiante(s)</span>
                      )}
                    </p>
                    <button
                      onClick={handleGuardarAsistencias}
                      disabled={guardandoAsistencia}
                      className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                    >
                      {guardandoAsistencia ? (
                        <>
                          <CgSpinner className="w-5 h-5 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <HiSave className="w-5 h-5" />
                          Guardar Asistencias
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab: Agregar */}
          {activeTab === 'agregar' && (
            <div className="space-y-6">
              {/* Buscador */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar estudiante por nombre, correo o identificación..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchEstudiantes()}
                    className="w-full pl-12 pr-4 py-3 border border-neutral-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-base"
                  />
                  <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                </div>
                <button
                  onClick={handleSearchEstudiantes}
                  disabled={searchLoading || !searchTerm.trim()}
                  className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {searchLoading ? (
                    <CgSpinner className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <HiSearch className="w-5 h-5" />
                      Buscar
                    </>
                  )}
                </button>
              </div>

              {/* Resultados de búsqueda */}
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                    {searchResults.length} estudiante(s) encontrado(s) - Selecciona los que deseas inscribir
                  </p>
                  <div className="grid gap-2 max-h-96 overflow-y-auto pr-2">
                    {searchResults.map((estudiante) => (
                      <div
                        key={estudiante.id}
                        onClick={() => toggleEstudianteSelection(estudiante.id)}
                        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${
                          selectedEstudiantes.includes(estudiante.id)
                            ? 'bg-primary/10 border-2 border-primary shadow-md'
                            : 'bg-neutral-50 dark:bg-dark-hover border-2 border-transparent hover:border-neutral-200 dark:hover:border-dark-border hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedEstudiantes.includes(estudiante.id)
                              ? 'bg-primary text-white'
                              : 'bg-neutral-200 dark:bg-dark-border text-neutral-600 dark:text-neutral-400'
                          }`}>
                            <span className="font-semibold text-sm">
                              {estudiante.nombre?.charAt(0) || '?'}
                              {estudiante.primerApellido?.charAt(0) || ''}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900 dark:text-white">
                              {estudiante.nombre} {estudiante.primerApellido} {estudiante.segundoApellido || ''}
                            </p>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {estudiante.correo}
                            </p>
                          </div>
                        </div>
                        {selectedEstudiantes.includes(estudiante.id) && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
                            <HiCheck className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botón de inscribir */}
              {selectedEstudiantes.length > 0 && (
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-primary/5 to-purple-500/5 rounded-xl border border-primary/20">
                  <div>
                    <p className="font-semibold text-neutral-900 dark:text-white">
                      {selectedEstudiantes.length} estudiante(s) seleccionado(s)
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      Haz clic en inscribir para agregarlos al curso
                    </p>
                  </div>
                  <button
                    onClick={handleInscribirEstudiantes}
                    disabled={inscribiendoLoading}
                    className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg"
                  >
                    {inscribiendoLoading ? (
                      <>
                        <CgSpinner className="w-5 h-5 animate-spin" />
                        Inscribiendo...
                      </>
                    ) : (
                      <>
                        <HiUserAdd className="w-5 h-5" />
                        Inscribir Estudiantes
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Mensaje si no hay resultados */}
              {searchTerm && searchResults.length === 0 && !searchLoading && (
                <div className="text-center py-12">
                  <HiSearch className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                    No se encontraron estudiantes disponibles
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                    Intenta con otro término de búsqueda
                  </p>
                </div>
              )}

              {/* Estado inicial */}
              {!searchTerm && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <HiUserAdd className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                    Busca estudiantes para inscribir
                  </p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-500 mt-1">
                    Usa el buscador para encontrar estudiantes por nombre, correo o identificación
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerGrupoCursoPage;
