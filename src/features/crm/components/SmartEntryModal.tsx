import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaTimes,
  FaUser,
  FaUserTie,
  FaPhone,
  FaEnvelope,
  FaChild,
  FaBriefcase,
  FaStickyNote,
  FaCheck,
  FaExclamationTriangle,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import {
  smartEntryApi,
  verificarDuplicadoEnterpriseApi,
  listarPipelinesApi,
} from '../api/crmApi';
import type {
  SmartEntryData,
  SmartEntryResult,
  CrmPipeline,
} from '../types/crm.types';

interface SmartEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: SmartEntryResult) => void;
}

// Estado inicial del formulario
const initialFormState = {
  // Responsable (quien paga)
  responsableNombre: '',
  responsableApellido: '',
  responsableCorreo: '',
  responsableTelefono: '',

  // Alumno
  alumnoEsMismaPersona: true,
  alumnoNombre: '',
  alumnoApellido: '',
  alumnoFechaNacimiento: '',
  alumnoCorreo: '',
  alumnoTelefono: '',

  // Negocio/Oportunidad
  negocioTitulo: '',
  negocioPipelineId: '',
  negocioMontoEstimado: '',
  negocioFuente: '',

  // Nota inicial
  notaInicial: '',
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

export const SmartEntryModal = ({ isOpen, onClose, onSuccess }: SmartEntryModalProps) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SmartEntryResult | null>(null);

  // Verificación de duplicados
  const [checkingDuplicado, setCheckingDuplicado] = useState(false);
  const [duplicadoWarning, setDuplicadoWarning] = useState<{
    id: string;
    nombreCompleto: string;
    propietario: { id: string; nombre: string } | null;
    mensaje: string | null;
  } | null>(null);

  // Pipelines disponibles
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [loadingPipelines, setLoadingPipelines] = useState(true);

  // Cargar pipelines al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setLoadingPipelines(true);
      listarPipelinesApi()
        .then((response) => {
          if (response.success) {
            setPipelines(response.data);
            // Seleccionar el pipeline default
            const defaultPipeline = response.data.find(p => p.esDefault);
            if (defaultPipeline) {
              setForm(prev => ({ ...prev, negocioPipelineId: defaultPipeline.id }));
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoadingPipelines(false));
    }
  }, [isOpen]);

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setForm(initialFormState);
      setError(null);
      setSuccess(null);
      setDuplicadoWarning(null);
    }
  }, [isOpen]);

  // Verificar duplicados cuando cambia correo o teléfono del responsable
  const verificarDuplicado = useCallback(async (correo?: string, telefono?: string) => {
    if (!correo && !telefono) {
      setDuplicadoWarning(null);
      return;
    }

    setCheckingDuplicado(true);
    try {
      const response = await verificarDuplicadoEnterpriseApi(correo, telefono);
      if (response.duplicado && response.contacto) {
        setDuplicadoWarning({
          id: response.contacto.id,
          nombreCompleto: response.contacto.nombreCompleto,
          propietario: response.contacto.propietario,
          mensaje: response.mensaje,
        });
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
      if (form.responsableCorreo || form.responsableTelefono) {
        verificarDuplicado(form.responsableCorreo, form.responsableTelefono);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.responsableCorreo, form.responsableTelefono, verificarDuplicado]);

  const handleSubmit = async () => {
    if (!form.responsableNombre.trim()) {
      setError('El nombre del responsable es requerido');
      return;
    }
    if (!form.negocioTitulo.trim()) {
      setError('El título de la oportunidad es requerido');
      return;
    }
    if (!form.alumnoEsMismaPersona && !form.alumnoNombre.trim()) {
      setError('El nombre del alumno es requerido');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: SmartEntryData = {
        responsable: {
          nombre: form.responsableNombre.trim(),
          apellido: form.responsableApellido.trim() || undefined,
          correo: form.responsableCorreo.trim() || undefined,
          telefono: form.responsableTelefono.trim() || undefined,
        },
        alumno: {
          esMismaPersona: form.alumnoEsMismaPersona,
          nombre: form.alumnoEsMismaPersona ? undefined : form.alumnoNombre.trim(),
          apellido: form.alumnoEsMismaPersona ? undefined : form.alumnoApellido.trim() || undefined,
          fechaNacimiento: form.alumnoEsMismaPersona ? undefined : form.alumnoFechaNacimiento || undefined,
          correo: form.alumnoEsMismaPersona ? undefined : form.alumnoCorreo.trim() || undefined,
          telefono: form.alumnoEsMismaPersona ? undefined : form.alumnoTelefono.trim() || undefined,
        },
        negocio: {
          titulo: form.negocioTitulo.trim(),
          pipelineId: form.negocioPipelineId || undefined,
          montoEstimado: form.negocioMontoEstimado ? parseFloat(form.negocioMontoEstimado) : undefined,
          fuente: form.negocioFuente || undefined,
        },
        notaInicial: form.notaInicial.trim() || undefined,
      };

      const response = await smartEntryApi(payload);

      if (response.success) {
        setSuccess(response.data);
        onSuccess?.(response.data);
      } else {
        setError('Error al procesar la entrada');
      }
    } catch (err: any) {
      setError(err.message || 'Error al procesar la entrada');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Vista de éxito
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <FaCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Entrada Creada Exitosamente
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              Se han creado los siguientes registros:
            </p>

            <div className="text-left bg-neutral-50 dark:bg-dark-bg rounded-lg p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2">
                <FaUserTie className="w-4 h-4 text-blue-500" />
                <span className="text-sm">
                  <strong>Responsable:</strong> {success.responsable.nombreCompleto}
                  {success.responsable.esNuevo && (
                    <span className="ml-1 text-xs text-green-600">(nuevo)</span>
                  )}
                </span>
              </div>

              {success.alumno && (
                <div className="flex items-center gap-2">
                  <FaChild className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">
                    <strong>Alumno:</strong> {success.alumno.nombreCompleto}
                    {success.alumno.esNuevo && (
                      <span className="ml-1 text-xs text-green-600">(nuevo)</span>
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <FaBriefcase className="w-4 h-4 text-amber-500" />
                <span className="text-sm">
                  <strong>Oportunidad:</strong> {success.oportunidad.titulo}
                  <span className="ml-1 text-xs text-neutral-500">
                    ({success.oportunidad.etapa})
                  </span>
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
              >
                Cerrar
              </button>
              <button
                onClick={() => navigate(`/crm/oportunidades`)}
                className="flex-1 px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
              >
                Ver Oportunidades
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border bg-gradient-to-r from-primary/10 to-transparent">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Smart Entry
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Crear contacto(s) + oportunidad en un solo paso
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Error */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-2">
              <FaExclamationTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Advertencia de duplicado */}
          {duplicadoWarning && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {duplicadoWarning.mensaje || `Ya existe un contacto: ${duplicadoWarning.nombreCompleto}`}
              </p>
              {duplicadoWarning.propietario && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  Propietario actual: {duplicadoWarning.propietario.nombre}
                </p>
              )}
              <button
                onClick={() => navigate(`/crm/contactos/view/${duplicadoWarning.id}`)}
                className="text-sm text-amber-600 dark:text-amber-400 underline mt-1"
              >
                Ver contacto existente
              </button>
            </div>
          )}

          {/* SECCIÓN: Responsable */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <FaUserTie className="w-4 h-4" />
              <h4 className="text-sm font-bold">Responsable (quien paga)</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.responsableNombre}
                  onChange={(e) => setForm(prev => ({ ...prev, responsableNombre: e.target.value }))}
                  placeholder="Nombre"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  value={form.responsableApellido}
                  onChange={(e) => setForm(prev => ({ ...prev, responsableApellido: e.target.value }))}
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
                  value={form.responsableTelefono}
                  onChange={(e) => setForm(prev => ({ ...prev, responsableTelefono: e.target.value }))}
                  placeholder="+506 8888-8888"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  <FaEnvelope className="inline w-3 h-3 mr-1" />
                  Correo
                </label>
                <input
                  type="email"
                  value={form.responsableCorreo}
                  onChange={(e) => setForm(prev => ({ ...prev, responsableCorreo: e.target.value }))}
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
          </div>

          {/* SECCIÓN: Alumno */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <FaChild className="w-4 h-4" />
                <h4 className="text-sm font-bold">Alumno/Estudiante</h4>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.alumnoEsMismaPersona}
                  onChange={(e) => setForm(prev => ({ ...prev, alumnoEsMismaPersona: e.target.checked }))}
                  className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30 focus:ring-2 cursor-pointer"
                />
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  El responsable es el alumno
                </span>
              </label>
            </div>

            {!form.alumnoEsMismaPersona && (
              <div className="space-y-3 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Nombre <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.alumnoNombre}
                      onChange={(e) => setForm(prev => ({ ...prev, alumnoNombre: e.target.value }))}
                      placeholder="Nombre del alumno"
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={form.alumnoApellido}
                      onChange={(e) => setForm(prev => ({ ...prev, alumnoApellido: e.target.value }))}
                      placeholder="Apellido"
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
                    value={form.alumnoFechaNacimiento}
                    onChange={(e) => setForm(prev => ({ ...prev, alumnoFechaNacimiento: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN: Oportunidad */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <FaBriefcase className="w-4 h-4" />
              <h4 className="text-sm font-bold">Oportunidad de Negocio</h4>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Título de la oportunidad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.negocioTitulo}
                onChange={(e) => setForm(prev => ({ ...prev, negocioTitulo: e.target.value }))}
                placeholder="Ej: Interés en curso de inglés"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Pipeline
                </label>
                <select
                  value={form.negocioPipelineId}
                  onChange={(e) => setForm(prev => ({ ...prev, negocioPipelineId: e.target.value }))}
                  disabled={loadingPipelines}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50"
                >
                  {loadingPipelines ? (
                    <option>Cargando...</option>
                  ) : (
                    pipelines.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.esDefault && '(default)'}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  Fuente
                </label>
                <select
                  value={form.negocioFuente}
                  onChange={(e) => setForm(prev => ({ ...prev, negocioFuente: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Seleccionar...</option>
                  {FUENTES.map((f) => (
                    <option key={f} value={f}>{f}</option>
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
                value={form.negocioMontoEstimado}
                onChange={(e) => setForm(prev => ({ ...prev, negocioMontoEstimado: e.target.value }))}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* SECCIÓN: Nota inicial */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
              <FaStickyNote className="w-4 h-4" />
              <h4 className="text-sm font-bold">Nota inicial (opcional)</h4>
            </div>
            <textarea
              value={form.notaInicial}
              onChange={(e) => setForm(prev => ({ ...prev, notaInicial: e.target.value }))}
              placeholder="Agregar una nota sobre esta oportunidad..."
              rows={3}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-lg transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              saving ||
              !form.responsableNombre.trim() ||
              !form.negocioTitulo.trim() ||
              (!form.alumnoEsMismaPersona && !form.alumnoNombre.trim())
            }
            className="flex-1 px-4 py-2.5 text-sm bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
            <FaUser className="w-4 h-4" />
            Crear Todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartEntryModal;
