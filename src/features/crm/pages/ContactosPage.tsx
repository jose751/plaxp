import { useState, useEffect, useCallback, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTimes,
  FaUser,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaStar,
  FaUserCheck,
  FaMagic,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
  type StatusOption
} from '../../../shared/components/PaginatedDataTable';
import {
  listarContactosApi,
  crearContactoApi,
  verificarDuplicadoContactoApi,
} from '../api/crmApi';
import type {
  CrmContacto,
  CrearContactoData,
  RelacionResponsable,
} from '../types/crm.types';
import {
  MedioContactoPreferido,
} from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';
import SmartEntryModal from '../components/SmartEntryModal';

// Estado inicial del formulario
const initialContactoForm = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  telefonoSecundario: '',
  fechaNacimiento: '',
  medioContactoPreferido: '' as string,
  origen: '',
  fuente: '',
  notas: '',
  // Responsable
  tieneResponsable: false,
  responsableNombre: '',
  responsableApellido: '',
  responsableTelefono: '',
  responsableCorreo: '',
  responsableRelacion: 'PADRE' as RelacionResponsable,
};

// Fuentes de adquisición
const FUENTES = [
  'Facebook',
  'Instagram',
  'WhatsApp',
  'Google',
  'Referido',
  'Presencial',
  'Sitio web',
  'Otro',
];

// Interfaz de Contacto extendida para el componente de tabla
interface ContactoTableItem extends BaseItem {
  id: string;
  contacto: JSX.Element;
  nombreCompleto: string;
  telefono: string;
  whatsapp: JSX.Element;
  correo: string;
  estado: JSX.Element;
  oportunidades: JSX.Element;
  fuente: string;
}

// URL del logo de WhatsApp
const WHATSAPP_LOGO = 'https://static.vecteezy.com/system/resources/previews/021/491/992/original/whatsapp-logo-tansparent-free-png.png';

// Función para limpiar número de teléfono para WhatsApp
const cleanPhoneForWhatsApp = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Definir columnas
const columns: ColumnDefinition<ContactoTableItem>[] = [
  { key: 'whatsapp', header: '' },
  { key: 'contacto', header: 'Contacto' },
  { key: 'telefono', header: 'Teléfono' },
  { key: 'correo', header: 'Correo' },
  { key: 'estado', header: 'Estado' },
  { key: 'oportunidades', header: 'Oportunidades' },
  { key: 'fuente', header: 'Fuente' },
];

// Componente principal
export const ContactosPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Filtro "Solo mis contactos"
  const [soloMios, setSoloMios] = useState(false);

  // Modal de Contacto simple
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contactoForm, setContactoForm] = useState(initialContactoForm);
  const [duplicadoWarning, setDuplicadoWarning] = useState<{ id: string; nombre: string } | null>(null);
  const [checkingDuplicado, setCheckingDuplicado] = useState(false);

  // Modal de Smart Entry
  const [smartEntryOpen, setSmartEntryOpen] = useState(false);

  // Verificar duplicados cuando cambia correo o teléfono
  const verificarDuplicado = useCallback(async (correo?: string, telefono?: string) => {
    if (!correo && !telefono) {
      setDuplicadoWarning(null);
      return;
    }

    setCheckingDuplicado(true);
    try {
      const response = await verificarDuplicadoContactoApi(correo, telefono);
      if (response.duplicado && response.contacto) {
        setDuplicadoWarning(response.contacto);
      } else {
        setDuplicadoWarning(null);
      }
    } catch {
      setDuplicadoWarning(null);
    } finally {
      setCheckingDuplicado(false);
    }
  }, []);

  // Debounce para verificar duplicados
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (contactoForm.correo || contactoForm.telefono) {
        verificarDuplicado(contactoForm.correo, contactoForm.telefono);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [contactoForm.correo, contactoForm.telefono, verificarDuplicado]);

  // Opciones de estado
  const statusOptions: StatusOption[] = [
    { label: 'Todos', value: 'todos', color: 'gray' },
    { label: 'Prospectos', value: 'prospectos', color: 'blue' },
    { label: 'Clientes', value: 'clientes', color: 'green' },
  ];

  /**
   * Función para obtener contactos desde la API
   */
  const fetchContactos = async (
    page: number,
    limit: number,
    query: string,
    status?: string,
    additionalFilters?: Record<string, any>
  ): Promise<PaginatedResponse<ContactoTableItem>> => {
    try {
      let esCliente: boolean | undefined = undefined;
      if (status === 'prospectos') esCliente = false;
      if (status === 'clientes') esCliente = true;

      const response = await listarContactosApi({
        pagina: page,
        limite: limit,
        busqueda: query || undefined,
        esCliente,
        activo: additionalFilters?.incluirInactivos ? undefined : true,
        soloMios: soloMios || undefined,
      });

      if (!response.success) {
        throw new Error('Error al obtener contactos');
      }

      // Transformar los datos de la API al formato de la tabla
      const transformedData: ContactoTableItem[] = response.data.map((contacto: CrmContacto) => {
        const esCliente = contacto.esCliente;
        const colorEstado = esCliente ? '#22C55E' : '#3B82F6';

        // Badge de contacto con iniciales
        const contactoCell = (
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
              style={{ backgroundColor: colorEstado }}
            >
              {contacto.nombre.charAt(0).toUpperCase()}
              {contacto.apellido.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="font-medium text-neutral-900 dark:text-neutral-100">
                {contacto.nombreCompleto}
              </span>
              {contacto.responsable && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  Resp: {contacto.responsable.nombre} ({contacto.responsable.relacion})
                </span>
              )}
            </div>
          </div>
        );

        // Badge de estado
        const estadoBadge = (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm"
            style={{
              backgroundColor: `${colorEstado}15`,
              color: colorEstado,
              borderColor: `${colorEstado}40`
            }}
          >
            {esCliente ? (
              <>
                <FaStar className="w-2.5 h-2.5" />
                Cliente
              </>
            ) : (
              <>
                <FaUser className="w-2.5 h-2.5" />
                Prospecto
              </>
            )}
          </span>
        );

        // Badge de oportunidades
        const stats = contacto.estadisticas;
        const oportunidadesBadge = stats ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
              {stats.abiertas} abiertas
            </span>
            {stats.ganadas > 0 && (
              <span className="text-xs text-green-600 font-medium">
                ({stats.ganadas} ganadas)
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-neutral-400">-</span>
        );

        // Botón de WhatsApp
        const telefono = contacto.telefono;
        const whatsappCell = telefono ? (
          <a
            href={`https://wa.me/${cleanPhoneForWhatsApp(telefono)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden hover:scale-125 transition-transform"
            title={`Enviar WhatsApp a ${telefono}`}
          >
            <img
              src={WHATSAPP_LOGO}
              alt="WhatsApp"
              className="w-16 h-16 object-cover scale-150"
            />
          </a>
        ) : (
          <span className="text-neutral-300 dark:text-neutral-600 text-sm">-</span>
        );

        return {
          id: contacto.id,
          contacto: contactoCell,
          nombreCompleto: contacto.nombreCompleto,
          telefono: contacto.telefono || '-',
          whatsapp: whatsappCell,
          correo: contacto.correo || '-',
          estado: estadoBadge,
          oportunidades: oportunidadesBadge,
          fuente: contacto.fuente || '-',
        };
      });

      return {
        data: transformedData,
        total: response.paginacion.total,
        page: response.paginacion.pagina,
        limit: response.paginacion.limite,
      };
    } catch (error: any) {
      console.error('Error al obtener contactos:', error);
      throw new Error(error.message || 'Error al cargar los contactos');
    }
  };

  const handleView = (contacto: ContactoTableItem) => {
    navigate(`/crm/contactos/view/${contacto.id}`);
  };

  const handleCreateNew = () => {
    setContactoForm(initialContactoForm);
    setDuplicadoWarning(null);
    setModalOpen(true);
  };

  const handleEdit = (contacto: ContactoTableItem) => {
    navigate(`/crm/contactos/view/${contacto.id}`);
  };

  const handleSaveContacto = async () => {
    if (!contactoForm.nombre.trim() || !contactoForm.apellido.trim()) {
      return;
    }

    try {
      setSaving(true);

      const payload: CrearContactoData = {
        nombre: contactoForm.nombre.trim(),
        apellido: contactoForm.apellido.trim(),
        correo: contactoForm.correo.trim() || undefined,
        telefono: contactoForm.telefono.trim() || undefined,
        telefonoSecundario: contactoForm.telefonoSecundario.trim() || undefined,
        fechaNacimiento: contactoForm.fechaNacimiento || undefined,
        medioContactoPreferido: contactoForm.medioContactoPreferido as any || undefined,
        origen: contactoForm.origen.trim() || undefined,
        fuente: contactoForm.fuente || undefined,
        notas: contactoForm.notas.trim() || undefined,
      };

      // Agregar responsable si existe
      if (contactoForm.tieneResponsable && contactoForm.responsableNombre.trim()) {
        payload.responsable = {
          nombre: contactoForm.responsableNombre.trim(),
          apellido: contactoForm.responsableApellido.trim() || undefined,
          telefono: contactoForm.responsableTelefono.trim() || undefined,
          correo: contactoForm.responsableCorreo.trim() || undefined,
          relacion: contactoForm.responsableRelacion,
        };
      }

      const response = await crearContactoApi(payload);
      if (response.success) {
        setModalOpen(false);
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err: any) {
      console.error('Error al guardar contacto:', err);
    } finally {
      setSaving(false);
    }
  };

  // Renderizar filtros adicionales
  const renderAdditionalFilters = (
    filters: Record<string, any>,
    setFilters: (filters: Record<string, any>) => void
  ) => {
    return (
      <div className="flex items-center gap-3">
        {/* Filtro: Solo mis contactos */}
        <label className="flex items-center gap-2 bg-white dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg px-4 py-2.5 cursor-pointer hover:border-primary/50 transition-all shadow-md">
          <input
            type="checkbox"
            checked={soloMios}
            onChange={(e) => {
              setSoloMios(e.target.checked);
              setRefreshTrigger(prev => prev + 1);
            }}
            className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30 focus:ring-2 cursor-pointer"
          />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
            Solo mis contactos
          </span>
        </label>

        {/* Filtro: Incluir inactivos */}
        <label className="flex items-center gap-2 bg-white dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg px-4 py-2.5 cursor-pointer hover:border-primary/50 transition-all shadow-md">
          <input
            type="checkbox"
            checked={filters.incluirInactivos || false}
            onChange={(e) => setFilters({ ...filters, incluirInactivos: e.target.checked })}
            className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30 focus:ring-2 cursor-pointer"
          />
          <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
            Incluir inactivos
          </span>
        </label>
      </div>
    );
  };

  // Renderizar botón Smart Entry para el header
  const renderHeaderActions = () => {
    if (!hasPermission('crm.crear')) return null;
    return (
      <button
        onClick={() => setSmartEntryOpen(true)}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-all shadow-md hover:shadow-lg text-sm"
      >
        <FaMagic className="w-4 h-4" />
        <span className="hidden sm:inline">Smart Entry</span>
      </button>
    );
  };

  return (
    <>
      <PaginatedDataTable
        title="Contactos"
        columns={columns}
        fetchDataFunction={fetchContactos}
        onRowClick={handleView}
        onCreateNew={hasPermission('crm.crear') ? handleCreateNew : undefined}
        onEdit={hasPermission('crm.editar') ? handleEdit : undefined}
        onView={handleView}
        statusOptions={statusOptions}
        refreshTrigger={refreshTrigger}
        renderAdditionalFilters={renderAdditionalFilters}
        additionalFilters={{ incluirInactivos: false }}
        headerActions={renderHeaderActions()}
      />

      {/* Modal de Nuevo Contacto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
              <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Nuevo Contacto
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                <FaTimes className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
              {/* Advertencia de duplicado */}
              {duplicadoWarning && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Ya existe un contacto con estos datos: <strong>{duplicadoWarning.nombre}</strong>
                  </p>
                  <button
                    onClick={() => navigate(`/crm/contactos/view/${duplicadoWarning.id}`)}
                    className="text-sm text-amber-600 dark:text-amber-400 underline mt-1"
                  >
                    Ver contacto existente
                  </button>
                </div>
              )}

              {/* Sección: Datos del Contacto */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <FaUser className="w-4 h-4" />
                  <h4 className="text-sm font-semibold">Datos del Contacto</h4>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contactoForm.nombre}
                      onChange={(e) => setContactoForm(prev => ({ ...prev, nombre: e.target.value }))}
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
                      value={contactoForm.apellido}
                      onChange={(e) => setContactoForm(prev => ({ ...prev, apellido: e.target.value }))}
                      placeholder="Apellido"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      <FaPhone className="inline w-3 h-3 mr-1" />
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={contactoForm.telefono}
                      onChange={(e) => setContactoForm(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="+506 8888-8888"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      <FaEnvelope className="inline w-3 h-3 mr-1" />
                      Correo electrónico
                    </label>
                    <input
                      type="email"
                      value={contactoForm.correo}
                      onChange={(e) => setContactoForm(prev => ({ ...prev, correo: e.target.value }))}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                {checkingDuplicado && (
                  <p className="text-xs text-neutral-500 flex items-center gap-1">
                    <CgSpinner className="w-3 h-3 animate-spin" />
                    Verificando duplicados...
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Fecha de nacimiento
                  </label>
                  <input
                    type="date"
                    value={contactoForm.fechaNacimiento}
                    onChange={(e) => setContactoForm(prev => ({ ...prev, fechaNacimiento: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
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
                        onClick={() => setContactoForm(prev => ({
                          ...prev,
                          medioContactoPreferido: prev.medioContactoPreferido === opcion.value ? '' : opcion.value
                        }))}
                        className={`
                          px-2 py-2 rounded-lg text-xs font-medium transition-all border
                          ${contactoForm.medioContactoPreferido === opcion.value
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

                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Fuente de adquisición
                  </label>
                  <select
                    value={contactoForm.fuente}
                    onChange={(e) => setContactoForm(prev => ({ ...prev, fuente: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="">Seleccionar...</option>
                    {FUENTES.map((fuente) => (
                      <option key={fuente} value={fuente}>
                        {fuente}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sección: Responsable (padre/tutor) */}
              <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-dark-border">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={contactoForm.tieneResponsable}
                    onChange={(e) => setContactoForm(prev => ({ ...prev, tieneResponsable: e.target.checked }))}
                    className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30 focus:ring-2 cursor-pointer"
                  />
                  <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                    <FaUserTie className="w-4 h-4" />
                    <span className="text-sm font-semibold">Agregar Responsable (padre/tutor)</span>
                  </div>
                </label>

                {contactoForm.tieneResponsable && (
                  <div className="space-y-3 pl-7">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={contactoForm.responsableNombre}
                          onChange={(e) => setContactoForm(prev => ({ ...prev, responsableNombre: e.target.value }))}
                          placeholder="Nombre del responsable"
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Relación
                        </label>
                        <select
                          value={contactoForm.responsableRelacion}
                          onChange={(e) => setContactoForm(prev => ({ ...prev, responsableRelacion: e.target.value as RelacionResponsable }))}
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        >
                          <option value="PADRE">Padre</option>
                          <option value="MADRE">Madre</option>
                          <option value="TUTOR">Tutor</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Teléfono
                        </label>
                        <input
                          type="tel"
                          value={contactoForm.responsableTelefono}
                          onChange={(e) => setContactoForm(prev => ({ ...prev, responsableTelefono: e.target.value }))}
                          placeholder="+506 8888-8888"
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                          Correo
                        </label>
                        <input
                          type="email"
                          value={contactoForm.responsableCorreo}
                          onChange={(e) => setContactoForm(prev => ({ ...prev, responsableCorreo: e.target.value }))}
                          placeholder="correo@ejemplo.com"
                          className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="space-y-3 pt-3 border-t border-neutral-200 dark:border-dark-border">
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={contactoForm.notas}
                  onChange={(e) => setContactoForm(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Agregar notas sobre el contacto..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-neutral-200 dark:border-dark-border flex-shrink-0">
              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                className="flex-1 px-3 sm:px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveContacto}
                disabled={
                  saving ||
                  !contactoForm.nombre.trim() ||
                  !contactoForm.apellido.trim() ||
                  !!duplicadoWarning
                }
                className="flex-1 px-3 sm:px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
              >
                {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
                <FaUserCheck className="w-4 h-4" />
                Crear Contacto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Smart Entry */}
      <SmartEntryModal
        isOpen={smartEntryOpen}
        onClose={() => setSmartEntryOpen(false)}
        onSuccess={() => {
          setSmartEntryOpen(false);
          setRefreshTrigger(prev => prev + 1);
        }}
      />
    </>
  );
};
