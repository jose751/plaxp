import { useState, useEffect } from 'react';
import {
  HiX,
  HiUser,
  HiAcademicCap,
  HiCurrencyDollar,
} from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { crearLeadApi, actualizarLeadApi } from '../api/crmApi';
import { listarCursosApi } from '../../cursos/api/cursosApi';
import type { CrmLead, CrmEtapa } from '../types/crm.types';
import type { Curso } from '../../cursos/types/curso.types';
import { RelacionContacto, MedioContactoPreferido } from '../types/crm.types';
import type { MedioContactoPreferido as MedioContactoPreferidoType } from '../types/crm.types';

interface LeadFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  etapa: CrmEtapa | null;
  lead?: CrmLead | null;
  mode: 'create' | 'edit';
}

const initialLeadForm = {
  contactoNombre: '',
  contactoApellido: '',
  contactoTelefono: '',
  contactoEmail: '',
  contactoRelacion: RelacionContacto.PROPIO as string,
  medioContactoPreferido: '' as string,
  alumnoNombre: '',
  alumnoApellido: '',
  alumnoFechaNacimiento: '',
  cursoId: '',
  origen: '',
  montoEstimado: '',
};

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

export const LeadFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  etapa,
  lead,
  mode,
}: LeadFormModalProps) => {
  const [form, setForm] = useState(initialLeadForm);
  const [saving, setSaving] = useState(false);
  const [cursos, setCursos] = useState<Curso[]>([]);

  // Cargar cursos
  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const response = await listarCursosApi({ estado: 'activo' });
        if (response.success && response.data?.cursos) {
          setCursos(response.data.cursos);
        }
      } catch (err) {
        console.error('Error loading cursos:', err);
      }
    };
    fetchCursos();
  }, []);

  // Cargar datos del lead si es edición
  useEffect(() => {
    if (mode === 'edit' && lead) {
      setForm({
        contactoNombre: lead.contacto.nombre || '',
        contactoApellido: lead.contacto.apellido || '',
        contactoTelefono: lead.contacto.telefono || '',
        contactoEmail: lead.contacto.email || '',
        contactoRelacion: lead.contacto.relacion || RelacionContacto.PROPIO,
        medioContactoPreferido: lead.contacto.medioPreferido || '',
        alumnoNombre: lead.alumno.nombre || '',
        alumnoApellido: lead.alumno.apellido || '',
        alumnoFechaNacimiento: lead.alumno.fechaNacimiento?.split('T')[0] || '',
        cursoId: lead.negociacion.cursoId || '',
        origen: lead.negociacion.origen || '',
        montoEstimado: lead.negociacion.montoEstimado?.toString() || '',
      });
    } else {
      setForm(initialLeadForm);
    }
  }, [mode, lead, isOpen]);

  const handleSave = async () => {
    if (!form.contactoNombre.trim() || !form.contactoApellido.trim()) {
      return;
    }

    try {
      setSaving(true);

      const esPropio = form.contactoRelacion === RelacionContacto.PROPIO;

      const alumnoNombre = esPropio
        ? form.contactoNombre.trim()
        : (form.alumnoNombre.trim() || 'Por definir');
      const alumnoApellido = esPropio
        ? form.contactoApellido.trim()
        : (form.alumnoApellido.trim() || 'Por definir');

      const payload = {
        contacto: {
          nombre: form.contactoNombre.trim(),
          apellido: form.contactoApellido.trim(),
          telefono: form.contactoTelefono.trim() || undefined,
          email: form.contactoEmail.trim() || undefined,
          relacion: form.contactoRelacion as any,
          medioPreferido: (form.medioContactoPreferido || undefined) as MedioContactoPreferidoType | undefined,
        },
        alumno: {
          nombre: alumnoNombre,
          apellido: alumnoApellido,
          fechaNacimiento: form.alumnoFechaNacimiento || undefined,
        },
        negociacion: {
          cursoId: form.cursoId || undefined,
          origen: form.origen || undefined,
          etapaId: etapa?.id || '',
          montoEstimado: form.montoEstimado ? parseFloat(form.montoEstimado) : undefined,
        },
      };

      if (mode === 'create' && etapa) {
        const response = await crearLeadApi(payload);
        if (response.success) {
          onSuccess();
          onClose();
        }
      } else if (mode === 'edit' && lead) {
        const updatePayload = {
          contacto: payload.contacto,
          alumno: payload.alumno,
          negociacion: {
            cursoId: payload.negociacion.cursoId,
            origen: payload.negociacion.origen,
            montoEstimado: payload.negociacion.montoEstimado,
          },
        };
        const response = await actualizarLeadApi(lead.id, updatePayload);
        if (response.success) {
          onSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Error al guardar lead:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              {mode === 'create' ? 'Nuevo Prospecto' : 'Editar Prospecto'}
            </h3>
            {etapa && (
              <p className="text-sm text-neutral-500 flex items-center gap-2 mt-0.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: etapa.color }}
                />
                {etapa.nombre}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Sección: Contacto */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <HiUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-semibold">Datos del Contacto</h4>
            </div>

            {/* Tipo de relación */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                ¿Quién realiza el contacto?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: RelacionContacto.PROPIO, label: 'Propio' },
                  { value: RelacionContacto.PADRE, label: 'Padre' },
                  { value: RelacionContacto.MADRE, label: 'Madre' },
                  { value: RelacionContacto.OTRO, label: 'Otro' },
                ].map((opcion) => (
                  <button
                    key={opcion.value}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, contactoRelacion: opcion.value }))}
                    className={`
                      px-3 py-2.5 rounded-xl text-xs font-medium transition-all border-2
                      ${form.contactoRelacion === opcion.value
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                        : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-dark-border hover:border-primary/50'
                      }
                    `}
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactoNombre}
                  onChange={(e) => setForm(prev => ({ ...prev, contactoNombre: e.target.value }))}
                  placeholder="Nombre"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.contactoApellido}
                  onChange={(e) => setForm(prev => ({ ...prev, contactoApellido: e.target.value }))}
                  placeholder="Apellido"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Teléfono y email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Teléfono
                </label>
                <input
                  type="tel"
                  value={form.contactoTelefono}
                  onChange={(e) => setForm(prev => ({ ...prev, contactoTelefono: e.target.value }))}
                  placeholder="+506 8888-8888"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={form.contactoEmail}
                  onChange={(e) => setForm(prev => ({ ...prev, contactoEmail: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Medio de contacto preferido */}
            <div>
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">
                Medio de contacto preferido
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: MedioContactoPreferido.TELEFONO, label: 'Teléfono' },
                  { value: MedioContactoPreferido.WHATSAPP, label: 'WhatsApp' },
                  { value: MedioContactoPreferido.CORREO, label: 'Correo' },
                  { value: MedioContactoPreferido.PRESENCIAL, label: 'Presencial' },
                ].map((opcion) => (
                  <button
                    key={opcion.value}
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      medioContactoPreferido: prev.medioContactoPreferido === opcion.value ? '' : opcion.value
                    }))}
                    className={`
                      px-3 py-2.5 rounded-xl text-xs font-medium transition-all border-2
                      ${form.medioContactoPreferido === opcion.value
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/25'
                        : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-dark-border hover:border-primary/50'
                      }
                    `}
                  >
                    {opcion.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sección: Estudiante */}
          {form.contactoRelacion !== RelacionContacto.PROPIO && (
            <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                  <HiAcademicCap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <h4 className="text-sm font-semibold">Datos del Estudiante</h4>
                <span className="text-xs text-neutral-400">(opcional)</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={form.alumnoNombre}
                    onChange={(e) => setForm(prev => ({ ...prev, alumnoNombre: e.target.value }))}
                    placeholder="Nombre del estudiante"
                    className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                    Apellido
                  </label>
                  <input
                    type="text"
                    value={form.alumnoApellido}
                    onChange={(e) => setForm(prev => ({ ...prev, alumnoApellido: e.target.value }))}
                    placeholder="Apellido del estudiante"
                    className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Fecha de nacimiento
                </label>
                <input
                  type="date"
                  value={form.alumnoFechaNacimiento}
                  onChange={(e) => setForm(prev => ({ ...prev, alumnoFechaNacimiento: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          )}

          {/* Sección: Negociación */}
          <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-dark-border">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <HiCurrencyDollar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold">Negociación</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Curso de interés
                </label>
                <select
                  value={form.cursoId}
                  onChange={(e) => setForm(prev => ({ ...prev, cursoId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Origen
                </label>
                <select
                  value={form.origen}
                  onChange={(e) => setForm(prev => ({ ...prev, origen: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
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
              <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                Monto estimado
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">₡</span>
                <input
                  type="number"
                  value={form.montoEstimado}
                  onChange={(e) => setForm(prev => ({ ...prev, montoEstimado: e.target.value }))}
                  placeholder="0"
                  min="0"
                  className="w-full pl-8 pr-3.5 py-2.5 border border-neutral-200 dark:border-dark-border rounded-xl text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border flex-shrink-0 bg-neutral-50 dark:bg-dark-bg">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={
              saving ||
              !form.contactoNombre.trim() ||
              !form.contactoApellido.trim()
            }
            className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-indigo-500/25"
          >
            {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
            {mode === 'create' ? 'Crear Prospecto' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};
