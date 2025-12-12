import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaUser,
  FaUserTie,
  FaUsers,
  FaStar,
  FaPhone,
  FaEnvelope,
  FaBriefcase,
  FaPlus,
  FaTimes,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  obtenerArbolFamiliarApi,
  crearRelacionContactoApi,
  eliminarRelacionContactoApi,
  establecerPagadorDefaultApi,
  listarContactosApi,
} from '../api/crmApi';
import type {
  ArbolFamiliarRelacion,
  ArbolFamiliarContacto,
  TipoRelacionContacto,
  CrmContacto,
} from '../types/crm.types';
import {
  TIPO_RELACION_LABELS,
  ETAPA_CICLO_VIDA_LABELS,
} from '../types/crm.types';

interface ArbolFamiliarProps {
  contactoId: string;
  onRelacionChange?: () => void;
}

// Iconos por tipo de relación
const getRelacionIcon = (tipo: TipoRelacionContacto) => {
  switch (tipo) {
    case 'PADRE_DE':
    case 'MADRE_DE':
    case 'TUTOR_DE':
      return FaUserTie;
    case 'HERMANO_DE':
      return FaUsers;
    case 'CONYUGUE_DE':
      return FaUsers;
    case 'EMPLEADO_DE':
    case 'REPRESENTANTE_DE':
      return FaBriefcase;
    default:
      return FaUser;
  }
};

// Colores por tipo de relación
const getRelacionColor = (tipo: TipoRelacionContacto) => {
  switch (tipo) {
    case 'PADRE_DE':
      return '#3B82F6'; // blue
    case 'MADRE_DE':
      return '#EC4899'; // pink
    case 'TUTOR_DE':
      return '#8B5CF6'; // purple
    case 'HERMANO_DE':
      return '#F97316'; // orange
    case 'CONYUGUE_DE':
      return '#EF4444'; // red
    case 'EMPLEADO_DE':
    case 'REPRESENTANTE_DE':
      return '#22C55E'; // green
    default:
      return '#6B7280'; // gray
  }
};

export const ArbolFamiliar = ({ contactoId, onRelacionChange }: ArbolFamiliarProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contacto, setContacto] = useState<ArbolFamiliarContacto | null>(null);
  const [relaciones, setRelaciones] = useState<ArbolFamiliarRelacion[]>([]);

  // Modal para agregar relación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [buscandoContactos, setBuscandoContactos] = useState(false);
  const [contactosDisponibles, setContactosDisponibles] = useState<CrmContacto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [nuevoTipoRelacion, setNuevoTipoRelacion] = useState<TipoRelacionContacto>('PADRE_DE');
  const [contactoSeleccionado, setContactoSeleccionado] = useState<CrmContacto | null>(null);
  const [guardando, setGuardando] = useState(false);

  // Cargar árbol familiar
  const cargarArbol = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerArbolFamiliarApi(contactoId);
      if (response.success) {
        setContacto(response.data.contacto);
        setRelaciones(response.data.relaciones);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el árbol familiar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarArbol();
  }, [contactoId]);

  // Buscar contactos para agregar relación
  useEffect(() => {
    if (!modalAbierto) return;

    const timeout = setTimeout(async () => {
      if (busqueda.length < 2) {
        setContactosDisponibles([]);
        return;
      }

      setBuscandoContactos(true);
      try {
        const response = await listarContactosApi({
          busqueda,
          limite: 10,
          activo: true,
        });
        if (response.success) {
          // Excluir el contacto actual y los que ya tienen relación
          const idsExcluir = [contactoId, ...relaciones.map(r => r.contactoRelacionado.id)];
          setContactosDisponibles(
            response.data.filter(c => !idsExcluir.includes(c.id))
          );
        }
      } catch {
        setContactosDisponibles([]);
      } finally {
        setBuscandoContactos(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [busqueda, modalAbierto, contactoId, relaciones]);

  // Agregar relación
  const handleAgregarRelacion = async () => {
    if (!contactoSeleccionado) return;

    try {
      setGuardando(true);
      await crearRelacionContactoApi(contactoId, {
        contactoRelacionadoId: contactoSeleccionado.id,
        tipoRelacion: nuevoTipoRelacion,
      });
      setModalAbierto(false);
      setBusqueda('');
      setContactoSeleccionado(null);
      cargarArbol();
      onRelacionChange?.();
    } catch (err: any) {
      setError(err.message || 'Error al crear la relación');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar relación
  const handleEliminarRelacion = async (relacionId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta relación?')) return;

    try {
      await eliminarRelacionContactoApi(relacionId);
      cargarArbol();
      onRelacionChange?.();
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la relación');
    }
  };

  // Establecer pagador default
  const handleEstablecerPagador = async (relacionId: string) => {
    try {
      await establecerPagadorDefaultApi(relacionId);
      cargarArbol();
      onRelacionChange?.();
    } catch (err: any) {
      setError(err.message || 'Error al establecer pagador');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <CgSpinner className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        <button
          onClick={cargarArbol}
          className="mt-2 text-sm text-red-600 dark:text-red-400 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!contacto) return null;

  return (
    <div className="space-y-4">
      {/* Contacto principal */}
      <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg"
            style={{ backgroundColor: contacto.esCliente ? '#22C55E' : '#3B82F6' }}
          >
            {contacto.nombre.charAt(0).toUpperCase()}
            {contacto.apellido.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {contacto.nombreCompleto}
            </h3>
            <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                contacto.esCliente
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
                {ETAPA_CICLO_VIDA_LABELS[contacto.etapaCicloVida]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Relaciones */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
          <FaUsers className="w-4 h-4" />
          Relaciones ({relaciones.length})
        </h4>
        <button
          onClick={() => setModalAbierto(true)}
          className="text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
        >
          <FaPlus className="w-3 h-3" />
          Agregar
        </button>
      </div>

      {relaciones.length === 0 ? (
        <div className="text-center py-8 bg-neutral-50 dark:bg-dark-bg rounded-lg">
          <FaUsers className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No hay relaciones registradas
          </p>
          <button
            onClick={() => setModalAbierto(true)}
            className="mt-2 text-sm text-primary hover:text-primary-dark font-medium"
          >
            Agregar primera relación
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {relaciones.map((rel) => {
            const Icon = getRelacionIcon(rel.tipoRelacion);
            const color = getRelacionColor(rel.tipoRelacion);

            return (
              <div
                key={rel.id}
                className="bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${color}15`,
                          color: color,
                          border: `1px solid ${color}40`,
                        }}
                      >
                        {rel.tipoRelacionLabel}
                      </span>
                      {rel.esPagadorDefault && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <FaStar className="w-2.5 h-2.5" />
                          Pagador
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => navigate(`/crm/contactos/view/${rel.contactoRelacionado.id}`)}
                      className="text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:text-primary transition-colors"
                    >
                      {rel.contactoRelacionado.nombreCompleto}
                    </button>

                    <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                      {rel.contactoRelacionado.telefono && (
                        <span className="flex items-center gap-1">
                          <FaPhone className="w-3 h-3" />
                          {rel.contactoRelacionado.telefono}
                        </span>
                      )}
                      {rel.contactoRelacionado.correo && (
                        <span className="flex items-center gap-1">
                          <FaEnvelope className="w-3 h-3" />
                          {rel.contactoRelacionado.correo}
                        </span>
                      )}
                    </div>

                    {rel.contactoRelacionado.oportunidadesAbiertas > 0 && (
                      <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 dark:text-amber-400">
                        <FaBriefcase className="w-3 h-3" />
                        {rel.contactoRelacionado.oportunidadesAbiertas} oportunidad(es) abierta(s)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {!rel.esPagadorDefault && (
                      <button
                        onClick={() => handleEstablecerPagador(rel.id)}
                        className="p-2 text-neutral-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        title="Establecer como pagador"
                      >
                        <FaStar className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEliminarRelacion(rel.id)}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar relación"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para agregar relación */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                Agregar Relación
              </h3>
              <button
                onClick={() => {
                  setModalAbierto(false);
                  setBusqueda('');
                  setContactoSeleccionado(null);
                }}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Tipo de relación */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Tipo de relación
                </label>
                <select
                  value={nuevoTipoRelacion}
                  onChange={(e) => setNuevoTipoRelacion(e.target.value as TipoRelacionContacto)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100"
                >
                  {Object.entries(TIPO_RELACION_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Buscar contacto */}
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Buscar contacto
                </label>
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Escribe nombre, teléfono o correo..."
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100"
                />
              </div>

              {/* Resultados de búsqueda */}
              {buscandoContactos ? (
                <div className="flex items-center justify-center py-4">
                  <CgSpinner className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : contactosDisponibles.length > 0 ? (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {contactosDisponibles.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setContactoSeleccionado(c)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        contactoSeleccionado?.id === c.id
                          ? 'bg-primary/10 border border-primary/30'
                          : 'hover:bg-neutral-100 dark:hover:bg-dark-hover'
                      }`}
                    >
                      <div className="font-medium text-neutral-900 dark:text-neutral-100">
                        {c.nombreCompleto}
                      </div>
                      {(c.telefono || c.correo) && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {c.telefono || c.correo}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : busqueda.length >= 2 ? (
                <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                  No se encontraron contactos
                </p>
              ) : null}

              {/* Contacto seleccionado */}
              {contactoSeleccionado && (
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    Seleccionado: {contactoSeleccionado.nombreCompleto}
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 px-4 py-3 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setModalAbierto(false);
                  setBusqueda('');
                  setContactoSeleccionado(null);
                }}
                className="flex-1 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarRelacion}
                disabled={!contactoSeleccionado || guardando}
                className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {guardando && <CgSpinner className="w-4 h-4 animate-spin" />}
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArbolFamiliar;
