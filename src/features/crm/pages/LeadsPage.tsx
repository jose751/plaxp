import { useState, useEffect, useCallback, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTimes,
  FaUser,
  FaChild,
  FaHandshake,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption
} from '../../../shared/components/PaginatedDataTable';
import { listarLeadsApi, listarEtapasApi, crearLeadApi } from '../api/crmApi';
import { listarCursosApi } from '../../cursos/api/cursosApi';
import type { CrmLead, CrmEtapa } from '../types/crm.types';
import type { Curso } from '../../cursos/types/curso.types';
import { RelacionContacto, MedioContactoPreferido } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

// Estado inicial del formulario
const initialLeadForm = {
  // Contacto (solo se usa si relación no es PROPIO)
  contactoNombre: '',
  contactoApellido: '',
  contactoTelefono: '',
  contactoEmail: '',
  contactoRelacion: RelacionContacto.PROPIO as string,
  medioContactoPreferido: '' as string,
  // Alumno
  alumnoNombre: '',
  alumnoApellido: '',
  alumnoFechaNacimiento: '',
  // Negociación
  cursoId: '',
  origen: '',
  montoEstimado: '',
  etapaId: '',
};

// Opciones de origen
const ORIGENES = [
  'Facebook',
  'Instagram',
  'WhatsApp',
  'Referido',
  'Google',
  'Página web',
  'Presencial',
  'Otro',
];

// Interfaz de Lead extendida para el componente de tabla
interface LeadTableItem extends BaseItem {
  id: string;
  contacto: JSX.Element;
  nombreContacto: string;
  alumno: string;
  telefono: string;
  correo: string;
  etapa: JSX.Element;
  origen: string;
  fechaCreacion: string;
}

// Definir columnas
const columns: ColumnDefinition<LeadTableItem>[] = [
  { key: 'contacto', header: 'Contacto' },
  { key: 'alumno', header: 'Alumno' },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'correo', header: 'Correo' },
  { key: 'etapa', header: 'Etapa' },
  { key: 'origen', header: 'Origen' },
];

// Componente principal
export const LeadsPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [etapas, setEtapas] = useState<CrmEtapa[]>([]);
  const [loadingEtapas, setLoadingEtapas] = useState(false);

  // Modal de Lead
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [leadForm, setLeadForm] = useState(initialLeadForm);

  // Cursos para selección
  const [cursos, setCursos] = useState<Curso[]>([]);

  // Cargar etapas y cursos al montar el componente
  useEffect(() => {
    const loadEtapas = async () => {
      setLoadingEtapas(true);
      try {
        const response = await listarEtapasApi();
        if (response.success) {
          setEtapas(response.data);
          // Seleccionar la primera etapa por defecto
          if (response.data.length > 0) {
            setLeadForm(prev => ({ ...prev, etapaId: response.data[0].id }));
          }
        }
      } catch (error) {
        console.error('Error al cargar etapas:', error);
      } finally {
        setLoadingEtapas(false);
      }
    };

    loadEtapas();
  }, []);

  const fetchCursos = useCallback(async () => {
    try {
      const response = await listarCursosApi({ estado: 'activo' });
      if (response.success && response.data?.cursos) {
        setCursos(response.data.cursos);
      }
    } catch (err) {
      console.error('Error loading cursos:', err);
    }
  }, []);

  useEffect(() => {
    fetchCursos();
  }, [fetchCursos]);

  // Generar opciones de estado basadas en etapas
  const statusOptions: StatusOption[] = [
    { label: 'Todas las etapas', value: 'todos', color: 'gray' },
    ...etapas.map(etapa => ({
      label: etapa.nombre,
      value: etapa.id,
      color: 'purple'
    }))
  ];

  /**
   * Función para obtener leads desde la API
   */
  const fetchLeads = async (
    page: number,
    limit: number,
    query: string,
    status?: string,
    additionalFilters?: Record<string, any>
  ): Promise<PaginatedResponse<LeadTableItem>> => {
    try {
      const response = await listarLeadsApi({
        pagina: page,
        limite: limit,
        busqueda: query || undefined,
        etapaId: status === 'todos' ? undefined : status,
        soloMisLeads: additionalFilters?.soloMisLeads || undefined,
      });

      if (!response.success) {
        throw new Error('Error al obtener leads');
      }

      // Transformar los datos de la API al formato de la tabla
      const transformedData: LeadTableItem[] = response.data.map((lead: CrmLead) => {
        const nombreContacto = `${lead.contacto.nombre} ${lead.contacto.apellido}`;
        const nombreAlumno = `${lead.alumno.nombre} ${lead.alumno.apellido}`;

        // Obtener color de la etapa
        const etapaInfo = lead.negociacion.etapa;
        const etapaColor = etapaInfo?.color || '#6366F1';

        // Badge de contacto con iniciales
        const contactoCell = (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
              style={{ backgroundColor: etapaColor }}
            >
              {lead.contacto.nombre.charAt(0).toUpperCase()}
              {lead.contacto.apellido.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {nombreContacto}
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {lead.contacto.relacion === 'PROPIO' ? 'Propio' : lead.contacto.relacion}
              </span>
            </div>
          </div>
        );

        // Badge de etapa
        const etapaBadge = (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm"
            style={{
              backgroundColor: `${etapaColor}15`,
              color: etapaColor,
              borderColor: `${etapaColor}40`
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: etapaColor }}
            />
            {etapaInfo?.nombre || 'Sin etapa'}
          </span>
        );

        return {
          id: lead.id,
          contacto: contactoCell,
          nombreContacto,
          alumno: nombreAlumno,
          telefono: lead.contacto.telefono || 'N/A',
          correo: lead.contacto.email || 'N/A',
          etapa: etapaBadge,
          origen: lead.negociacion.origen || 'Manual',
          fechaCreacion: new Date(lead.fechaCreacion).toLocaleDateString('es-ES'),
        };
      });

      return {
        data: transformedData,
        total: response.paginacion.total,
        page: response.paginacion.pagina,
        limit: response.paginacion.limite,
      };
    } catch (error: any) {
      console.error('Error al obtener leads:', error);
      throw new Error(error.message || 'Error al cargar los leads');
    }
  };

  const handleView = (lead: LeadTableItem) => {
    navigate(`/crm/leads/${lead.id}`);
  };

  const handleCreateNew = () => {
    // Resetear formulario y abrir modal
    setLeadForm({
      ...initialLeadForm,
      etapaId: etapas.length > 0 ? etapas[0].id : ''
    });
    setLeadModalOpen(true);
  };

  const handleEdit = (lead: LeadTableItem) => {
    navigate(`/crm/leads/${lead.id}`);
  };

  const handleSaveLead = async () => {
    // Siempre requerimos datos del contacto
    if (!leadForm.contactoNombre.trim() || !leadForm.contactoApellido.trim()) {
      return;
    }
    // Requerimos etapa
    if (!leadForm.etapaId) {
      return;
    }

    try {
      setLeadSaving(true);

      const esPropio = leadForm.contactoRelacion === RelacionContacto.PROPIO;

      // Si es PROPIO (estudiante contacta directamente), los datos del alumno = datos del contacto
      // Si NO es PROPIO (padre/madre/otro), los datos del alumno pueden estar vacíos o ser diferentes
      const alumnoNombre = esPropio
        ? leadForm.contactoNombre.trim()
        : (leadForm.alumnoNombre.trim() || 'Por definir');
      const alumnoApellido = esPropio
        ? leadForm.contactoApellido.trim()
        : (leadForm.alumnoApellido.trim() || 'Por definir');

      // Construir payload según estructura del API
      const payload = {
        contacto: {
          nombre: leadForm.contactoNombre.trim(),
          apellido: leadForm.contactoApellido.trim(),
          telefono: leadForm.contactoTelefono.trim() || undefined,
          email: leadForm.contactoEmail.trim() || undefined,
          relacion: leadForm.contactoRelacion as any,
          medioPreferido: leadForm.medioContactoPreferido || undefined,
        },
        alumno: {
          nombre: alumnoNombre,
          apellido: alumnoApellido,
          fechaNacimiento: leadForm.alumnoFechaNacimiento || undefined,
        },
        negociacion: {
          cursoId: leadForm.cursoId || undefined,
          origen: leadForm.origen || undefined,
          etapaId: leadForm.etapaId,
          montoEstimado: leadForm.montoEstimado ? parseFloat(leadForm.montoEstimado) : undefined,
        },
      };

      const response = await crearLeadApi(payload);
      if (response.success) {
        setLeadModalOpen(false);
        setRefreshTrigger(prev => prev + 1); // Refrescar tabla
      }
    } catch (err: any) {
      console.error('Error al guardar lead:', err);
    } finally {
      setLeadSaving(false);
    }
  };

  // Renderizar filtro de "Solo mis leads"
  const renderMisLeadsFilter = (
    filters: Record<string, any>,
    setFilters: (filters: Record<string, any>) => void
  ) => {
    return (
      <label className="flex items-center gap-2 bg-white dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg px-4 py-2.5 cursor-pointer hover:border-primary/50 transition-all shadow-md">
        <input
          type="checkbox"
          checked={filters.soloMisLeads || false}
          onChange={(e) => setFilters({ ...filters, soloMisLeads: e.target.checked })}
          className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30 focus:ring-2 cursor-pointer"
          disabled={loadingEtapas}
        />
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
          Solo mis leads
        </span>
      </label>
    );
  };

  return (
    <>
      <PaginatedDataTable
        title="Leads"
        columns={columns}
        fetchDataFunction={fetchLeads}
        onRowClick={handleView}
        onCreateNew={hasPermission('crm.crear') ? handleCreateNew : undefined}
        onEdit={hasPermission('crm.editar') ? handleEdit : undefined}
        onView={handleView}
        statusOptions={statusOptions}
        refreshTrigger={refreshTrigger}
        renderAdditionalFilters={renderMisLeadsFilter}
        additionalFilters={{ soloMisLeads: false }}
      />

      {/* Lead Modal */}
      {leadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Nuevo Prospecto
              </h3>
              <button
                onClick={() => setLeadModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
              {/* Sección: Contacto (PRIMERO) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <FaUser className="w-4 h-4" />
                  <h4 className="text-sm font-semibold">Datos del Contacto</h4>
                </div>

                {/* Tipo de relación */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    ¿Quién realiza el contacto? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: RelacionContacto.PROPIO, label: 'Estudiante' },
                      { value: RelacionContacto.PADRE, label: 'Padre' },
                      { value: RelacionContacto.MADRE, label: 'Madre' },
                      { value: RelacionContacto.OTRO, label: 'Otro' },
                    ].map((opcion) => (
                      <button
                        key={opcion.value}
                        type="button"
                        onClick={() => setLeadForm(prev => ({ ...prev, contactoRelacion: opcion.value }))}
                        className={`
                          px-2 py-2 rounded-lg text-xs font-medium transition-all border
                          ${leadForm.contactoRelacion === opcion.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-dark-border hover:border-primary/50'
                          }
                        `}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nombre y Apellido del contacto */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leadForm.contactoNombre}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoNombre: e.target.value }))}
                      placeholder="Nombre"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Apellido <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={leadForm.contactoApellido}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoApellido: e.target.value }))}
                      placeholder="Apellido"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Teléfono y email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={leadForm.contactoTelefono}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoTelefono: e.target.value }))}
                      placeholder="+506 8888-8888"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={leadForm.contactoEmail}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, contactoEmail: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Medio de contacto preferido */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Medio de contacto preferido
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { value: MedioContactoPreferido.TELEFONO, label: 'Teléfono' },
                      { value: MedioContactoPreferido.WHATSAPP, label: 'WhatsApp' },
                      { value: MedioContactoPreferido.CORREO, label: 'Correo' },
                      { value: MedioContactoPreferido.PRESENCIAL, label: 'Presencial' },
                    ].map((opcion) => (
                      <button
                        key={opcion.value}
                        type="button"
                        onClick={() => setLeadForm(prev => ({
                          ...prev,
                          medioContactoPreferido: prev.medioContactoPreferido === opcion.value ? '' : opcion.value
                        }))}
                        className={`
                          px-2 py-2 rounded-lg text-xs font-medium transition-all border
                          ${leadForm.medioContactoPreferido === opcion.value
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-dark-border hover:border-primary/50'
                          }
                        `}
                      >
                        {opcion.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sección: Estudiante (solo si NO es el propio estudiante quien contacta) */}
              {leadForm.contactoRelacion !== RelacionContacto.PROPIO && (
                <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-dark-border">
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <FaChild className="w-4 h-4" />
                    <h4 className="text-sm font-semibold">Datos del Estudiante</h4>
                    <span className="text-xs text-neutral-400">(opcional)</span>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Si aún no tienes los datos del estudiante, puedes dejarlos vacíos y completarlos después.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={leadForm.alumnoNombre}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, alumnoNombre: e.target.value }))}
                        placeholder="Nombre del estudiante"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Apellido
                      </label>
                      <input
                        type="text"
                        value={leadForm.alumnoApellido}
                        onChange={(e) => setLeadForm(prev => ({ ...prev, alumnoApellido: e.target.value }))}
                        placeholder="Apellido del estudiante"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Fecha de nacimiento
                    </label>
                    <input
                      type="date"
                      value={leadForm.alumnoFechaNacimiento}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, alumnoFechaNacimiento: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* Sección: Negociación */}
              <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-dark-border">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <FaHandshake className="w-4 h-4" />
                  <h4 className="text-sm font-semibold">Negociación</h4>
                </div>

                {/* Etapa */}
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Etapa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={leadForm.etapaId}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, etapaId: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Seleccionar etapa...</option>
                    {etapas.map((etapa) => (
                      <option key={etapa.id} value={etapa.id}>
                        {etapa.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Curso de interés
                    </label>
                    <select
                      value={leadForm.cursoId}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, cursoId: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Seleccionar...</option>
                      {cursos.map((curso) => (
                        <option key={curso.id} value={curso.id}>
                          {curso.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Origen
                    </label>
                    <select
                      value={leadForm.origen}
                      onChange={(e) => setLeadForm(prev => ({ ...prev, origen: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value="">Seleccionar...</option>
                      {ORIGENES.map((origen) => (
                        <option key={origen} value={origen}>
                          {origen}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Monto estimado
                  </label>
                  <input
                    type="number"
                    value={leadForm.montoEstimado}
                    onChange={(e) => setLeadForm(prev => ({ ...prev, montoEstimado: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-200 dark:border-dark-border flex-shrink-0">
              <button
                onClick={() => setLeadModalOpen(false)}
                disabled={leadSaving}
                className="flex-1 px-3 sm:px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLead}
                disabled={
                  leadSaving ||
                  !leadForm.contactoNombre.trim() ||
                  !leadForm.contactoApellido.trim() ||
                  !leadForm.etapaId
                }
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {leadSaving && <CgSpinner className="w-4 h-4 animate-spin" />}
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
