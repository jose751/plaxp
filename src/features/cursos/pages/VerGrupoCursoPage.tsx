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
} from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import {
  obtenerParticipantesCursoApi,
  desinscribirEstudianteApi,
  inscribirEstudiantesApi,
} from '../../inscripciones/api/inscripcionesApi';
import { listarEstudiantesApi } from '../../estudiantes/api/estudiantesApi';
import type { Inscripcion, ProfesorAsignado, CursoInfo } from '../../inscripciones/types/inscripcion.types';
import type { Estudiante } from '../../estudiantes/types/estudiante.types';

type TabType = 'estudiantes' | 'profesores' | 'agregar';

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

  const tabs = [
    { key: 'estudiantes' as TabType, label: 'Estudiantes', icon: HiUserGroup, count: estudiantes.length },
    { key: 'profesores' as TabType, label: 'Profesores', icon: HiAcademicCap, count: profesores.length },
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
