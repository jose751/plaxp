import {
  HiX,
  HiUser,
  HiAcademicCap,
  HiCurrencyDollar,
} from 'react-icons/hi';
import type { CrmLead, CrmEtapa } from '../types/crm.types';
import { RelacionContacto, MedioContactoPreferido } from '../types/crm.types';

// Opcional: Si necesitas buscar el nombre del curso por ID (similar a tu original)
// import { listarCursosApi } from '../../cursos/api/cursosApi';
// import type { Curso } from '../../cursos/types/curso.types';
// *** Nota: Esta versión simplificada asume que el nombre del curso viene en el objeto lead
// o que se manejará fuera de este componente de visualización. Para mantener el ejemplo limpio,
// he eliminado la carga de cursos, pero la estructura del objeto lead real debería tener
// el nombre del curso o la lógica para obtenerlo. ***

interface LeadDetallesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** El objeto Lead con los detalles a visualizar. Debe estar presente para mostrar algo. */
  lead: CrmLead | null;
  /** El objeto Etapa, si se necesita mostrar el color y nombre de la etapa actual. */
  etapa: CrmEtapa | null;
}

// Mapeo para mostrar la relación y el medio preferido
const RELACION_DISPLAY = {
  [RelacionContacto.PROPIO]: 'El Estudiante (Propio)',
  [RelacionContacto.PADRE]: 'Padre',
  [RelacionContacto.MADRE]: 'Madre',
  [RelacionContacto.OTRO]: 'Otro Familiar/Tutor',
};

const MEDIO_CONTACTO_DISPLAY = {
  [MedioContactoPreferido.TELEFONO]: 'Teléfono',
  [MedioContactoPreferido.LLAMADA]: 'Llamada',
  [MedioContactoPreferido.WHATSAPP]: 'WhatsApp',
  [MedioContactoPreferido.SMS]: 'SMS',
  [MedioContactoPreferido.CORREO]: 'Correo Electrónico',
  [MedioContactoPreferido.PRESENCIAL]: 'Presencial',
};

// Objeto dummy para cursos. En una aplicación real, usarías 'cursos' cargados de una API.
const MOCK_CURSOS = [
  { id: 'c1', nombre: 'Introducción a React' },
  { id: 'c2', nombre: 'Diseño UX/UI Avanzado' },
  { id: 'c3', nombre: 'Marketing Digital Básico' },
];

export const LeadDetallesModal = ({
  isOpen,
  onClose,
  lead,
  etapa,
}: LeadDetallesModalProps) => {
  if (!isOpen) return null;

  // Si no hay lead, mostramos un mensaje de error o simplemente no renderizamos el contenido.
  if (!lead) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-lg p-6">
          <h3 className="text-lg font-bold text-red-500">Error al cargar</h3>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">No se pudo encontrar la información del prospecto.</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 text-sm bg-neutral-200 rounded-xl">Cerrar</button>
        </div>
      </div>
    );
  }

  const esPropio = lead.contacto.relacion === RelacionContacto.PROPIO;

  // Búsqueda del nombre del curso (simulada)
  const cursoSeleccionado = MOCK_CURSOS.find(
    (c) => c.id === lead.negociacion.cursoId
  );
  const nombreCurso = cursoSeleccionado
    ? cursoSeleccionado.nombre
    : 'No especificado / ID desconocido';

  // Formato de fecha
  const fechaNacimiento = lead.alumno.fechaNacimiento
    ? new Date(lead.alumno.fechaNacimiento).toLocaleDateString()
    : 'No especificada';

  // Formato de monto
  const montoEstimado = lead.negociacion.montoEstimado
    ? `₡ ${lead.negociacion.montoEstimado.toLocaleString()}`
    : 'No especificado';

  // Helper para mostrar un par de detalle (título y valor)
  const DetailItem = ({ title, value, cols = 1 }: { title: string, value: string, cols?: 1 | 2 }) => (
    <div className={cols === 2 ? 'col-span-1' : 'col-span-2'}>
      <dt className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
        {title}
      </dt>
      <dd className="text-sm font-medium text-neutral-900 dark:text-white p-3 bg-neutral-50 dark:bg-dark-hover rounded-xl break-words">
        {value || 'N/A'}
      </dd>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
              Detalles del Prospecto
            </h3>
            {etapa && (
              <p className="text-sm text-neutral-500 flex items-center gap-2 mt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: etapa.color }}
                />
                Etapa: **{etapa.nombre}**
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

        {/* Body (Detalles) */}
        <div className="p-5 space-y-6 overflow-y-auto flex-1">
          {/* Sección: Contacto */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <HiUser className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="text-sm font-semibold">Información del Contacto</h4>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <DetailItem title="Nombre del Contacto" value={lead.contacto.nombre} cols={1} />
              <DetailItem title="Apellido del Contacto" value={lead.contacto.apellido} cols={1} />
              <DetailItem title="Teléfono" value={lead.contacto.telefono || 'N/A'} cols={1} />
              <DetailItem title="Correo electrónico" value={lead.contacto.email || 'N/A'} cols={1} />
            </dl>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <DetailItem
                title="Relación con el Estudiante"
                value={RELACION_DISPLAY[lead.contacto.relacion as RelacionContacto] || 'N/A'}
              />
              <DetailItem
                title="Medio de Contacto Preferido"
                value={MEDIO_CONTACTO_DISPLAY[lead.contacto.medioPreferido as MedioContactoPreferido] || 'No especificado'}
              />
            </div>
          </section>

          {/* Separador */}
          <hr className="border-t border-neutral-200 dark:border-dark-border" />

          {/* Sección: Estudiante */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <div className="p-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <HiAcademicCap className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              </div>
              <h4 className="text-sm font-semibold">Información del Estudiante</h4>
              {esPropio && (
                <span className="text-xs text-blue-500 font-medium">(El estudiante es el contacto)</span>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <DetailItem title="Nombre del Estudiante" value={lead.alumno.nombre} cols={1} />
              <DetailItem title="Apellido del Estudiante" value={lead.alumno.apellido} cols={1} />
              <DetailItem title="Fecha de Nacimiento" value={fechaNacimiento} cols={2} />
            </dl>
          </section>

          {/* Separador */}
          <hr className="border-t border-neutral-200 dark:border-dark-border" />

          {/* Sección: Negociación */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
              <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <HiCurrencyDollar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h4 className="text-sm font-semibold">Detalles de la Negociación</h4>
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <DetailItem title="Curso de Interés" value={nombreCurso} cols={1} />
              <DetailItem title="Origen" value={lead.negociacion.origen || 'No especificado'} cols={1} />
              <DetailItem title="Monto Estimado" value={montoEstimado} cols={2} />
            </dl>

            <div className="pt-2">
              <dt className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                ID del Prospecto
              </dt>
              <dd className="text-xs text-neutral-500 dark:text-neutral-400 p-3 bg-neutral-100 dark:bg-dark-bg rounded-xl break-all">
                {lead.id}
              </dd>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};