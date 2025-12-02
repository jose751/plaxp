/**
 * Tipos para el feature de CRM Pipeline
 */

/**
 * Tipos de sistema para etapas
 */
export const TipoSistema = {
  PROCESO: 'PROCESO',
  GANADO: 'GANADO',
  PERDIDO: 'PERDIDO',
} as const;

export type TipoSistema = (typeof TipoSistema)[keyof typeof TipoSistema];

/**
 * Etapa del pipeline CRM
 */
export interface CrmEtapa {
  id: string;
  nombre: string;
  color: string;
  orden: number;
  tipoSistema: TipoSistema;
  activo: boolean;
  empresaId?: string;
  fechaCreacion?: string;
  ultimaModificacion?: string;
}

/**
 * Relaciones de contacto
 * PROPIO: El contacto es el mismo estudiante
 * PADRE: El contacto es el padre
 * MADRE: El contacto es la madre
 * OTRO: Tutor legal, abuelo, etc.
 */
export const RelacionContacto = {
  PROPIO: 'PROPIO',
  PADRE: 'PADRE',
  MADRE: 'MADRE',
  OTRO: 'OTRO',
} as const;

export type RelacionContacto = (typeof RelacionContacto)[keyof typeof RelacionContacto];

/**
 * Medio de contacto preferido
 */
export const MedioContactoPreferido = {
  TELEFONO: 'TELEFONO',
  WHATSAPP: 'WHATSAPP',
  CORREO: 'CORREO',
  PRESENCIAL: 'PRESENCIAL',
} as const;

export type MedioContactoPreferido = (typeof MedioContactoPreferido)[keyof typeof MedioContactoPreferido];

/**
 * Contacto del lead (respuesta del API)
 */
export interface CrmLeadContacto {
  nombre: string;
  apellido: string;
  telefono: string | null;
  email: string | null;
  relacion: RelacionContacto;
  medioPreferido: MedioContactoPreferido | null;
}

/**
 * Alumno del lead (respuesta del API)
 */
export interface CrmLeadAlumno {
  nombre: string;
  apellido: string;
  fechaNacimiento: string | null;
}

/**
 * Negociación del lead (respuesta del API)
 */
export interface CrmLeadNegociacion {
  cursoId: string | null;
  etapaId: string;
  etapa?: CrmEtapa;
  origen: string | null;
  montoEstimado: number | null;
  fechaUltimoContacto: string | null;
}

/**
 * Lead/Prospecto en el CRM (respuesta del API)
 */
export interface CrmLead {
  id: string;
  contacto: CrmLeadContacto;
  alumno: CrmLeadAlumno;
  negociacion: CrmLeadNegociacion;
  asignaciones: any[];
  fechaCreacion: string;
  ultimoCambio: string;
}

/**
 * Columna del tablero Kanban (respuesta del API)
 */
export interface CrmTableroColumna {
  etapa: CrmEtapa;
  leads: CrmLead[];
  total: number;
}

/**
 * Respuesta del tablero completo
 * GET /api/crm/tablero
 */
export interface ObtenerTableroResponse {
  success: boolean;
  message?: string;
  data: CrmTableroColumna[];
}

/**
 * Respuesta de listar etapas
 * GET /api/crm/etapas
 */
export interface ListarEtapasResponse {
  success: boolean;
  message: string;
  data: CrmEtapa[];
}

/**
 * Datos para crear una etapa
 * POST /api/crm/etapas
 */
export interface CrearEtapaData {
  nombre: string;
  color: string;
  orden?: number;
  tipoSistema: TipoSistema;
  activo?: boolean;
}

/**
 * Respuesta de crear etapa
 */
export interface CrearEtapaResponse {
  success: boolean;
  message: string;
  data: CrmEtapa;
}

/**
 * Datos para actualizar una etapa
 * PUT /api/crm/etapas/{id}
 */
export interface ActualizarEtapaData {
  nombre?: string;
  color?: string;
  orden?: number;
  tipoSistema?: TipoSistema;
  activo?: boolean;
}

/**
 * Respuesta de actualizar etapa
 */
export interface ActualizarEtapaResponse {
  success: boolean;
  message: string;
  data: CrmEtapa;
}

/**
 * Respuesta de obtener etapa por ID
 * GET /api/crm/etapas/{id}
 */
export interface ObtenerEtapaResponse {
  success: boolean;
  message: string;
  data: CrmEtapa;
}

/**
 * Respuesta de eliminar etapa
 * DELETE /api/crm/etapas/{id}
 */
export interface EliminarEtapaResponse {
  success: boolean;
  message: string;
  data: null;
}

/**
 * Datos para mover un lead entre etapas
 * PATCH /api/crm/leads/{id}/mover
 */
export interface MoverLeadData {
  etapaId: string;
}

/**
 * Respuesta de mover lead
 */
export interface MoverLeadResponse {
  success: boolean;
  message: string;
  data: CrmLead;
}

/**
 * Contacto para crear/actualizar lead
 */
export interface LeadContactoInput {
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  relacion: RelacionContacto;
  medioPreferido?: MedioContactoPreferido;
}

/**
 * Alumno para crear/actualizar lead
 */
export interface LeadAlumnoInput {
  nombre: string;
  apellido: string;
  fechaNacimiento?: string;
}

/**
 * Negociación para crear lead
 */
export interface LeadNegociacionInput {
  cursoId?: string;
  origen?: string;
  etapaId: string;
  montoEstimado?: number;
}

/**
 * Negociación para actualizar lead (sin etapaId)
 */
export interface LeadNegociacionUpdateInput {
  cursoId?: string;
  origen?: string;
  montoEstimado?: number;
}

/**
 * Datos para crear un lead
 * POST /api/crm/leads
 */
export interface CrearLeadData {
  contacto: LeadContactoInput;
  alumno: LeadAlumnoInput;
  negociacion: LeadNegociacionInput;
}

/**
 * Respuesta de crear lead
 */
export interface CrearLeadResponse {
  success: boolean;
  message: string;
  data: CrmLead;
}

/**
 * Datos para actualizar un lead
 * PUT /api/crm/leads/{id}
 */
export interface ActualizarLeadData {
  contacto?: Partial<LeadContactoInput>;
  alumno?: Partial<LeadAlumnoInput>;
  negociacion?: LeadNegociacionUpdateInput;
}

/**
 * Respuesta de actualizar lead
 */
export interface ActualizarLeadResponse {
  success: boolean;
  message: string;
  data: CrmLead;
}

/**
 * Respuesta de eliminar lead
 * DELETE /api/crm/leads/{id}
 */
export interface EliminarLeadResponse {
  success: boolean;
  message: string;
  data: null;
}

/**
 * Colores predefinidos para etapas
 */
export const COLORES_ETAPA = [
  { value: '#3B82F6', label: 'Azul', class: 'bg-blue-500' },
  { value: '#8B5CF6', label: 'Violeta', class: 'bg-violet-500' },
  { value: '#EC4899', label: 'Rosa', class: 'bg-pink-500' },
  { value: '#EF4444', label: 'Rojo', class: 'bg-red-500' },
  { value: '#F97316', label: 'Naranja', class: 'bg-orange-500' },
  { value: '#EAB308', label: 'Amarillo', class: 'bg-yellow-500' },
  { value: '#22C55E', label: 'Verde', class: 'bg-green-500' },
  { value: '#14B8A6', label: 'Teal', class: 'bg-teal-500' },
  { value: '#06B6D4', label: 'Cyan', class: 'bg-cyan-500' },
  { value: '#6366F1', label: 'Indigo', class: 'bg-indigo-500' },
];

// ==================== TIPOS DE ACTIVIDAD ====================

/**
 * Tipos de actividad del CRM
 */
export const TipoActividad = {
  NOTA: 'NOTA',
  LLAMADA: 'LLAMADA',
  CORREO: 'CORREO',
  WHATSAPP: 'WHATSAPP',
  REUNION: 'REUNION',
  TAREA: 'TAREA',
  CAMBIO_ETAPA: 'CAMBIO_ETAPA',
} as const;

export type TipoActividad = (typeof TipoActividad)[keyof typeof TipoActividad];

/**
 * Roles de asignación de lead
 */
export const RolAsignacion = {
  PRINCIPAL: 'PRINCIPAL',
  COLABORADOR: 'COLABORADOR',
} as const;

export type RolAsignacion = (typeof RolAsignacion)[keyof typeof RolAsignacion];

/**
 * Participante de una actividad
 */
export interface CrmActividadParticipante {
  actividadId: string;
  usuarioId: string;
  asignadoEn: string;
  usuarioNombre?: string;
}

/**
 * Actividad del CRM (timeline)
 */
export interface CrmActividad {
  id: string;
  empresaId: string;
  leadId: string;
  tipo: TipoActividad;
  contenido: string;
  fechaInicio: string;
  fechaFin: string;
  resultado: string | null;
  esNotaAcademica: boolean;
  fechaCreacion: string;
  participantes?: CrmActividadParticipante[];
}

/**
 * Asignación de usuario a un lead
 */
export interface CrmLeadAsignacion {
  leadId: string;
  usuarioId: string;
  rol: RolAsignacion;
  asignadoEn: string;
  usuarioNombre?: string;
}

// ==================== RESPUESTAS DE API LEADS ====================

/**
 * Respuesta de listar leads
 * GET /api/crm/leads
 */
export interface ListarLeadsResponse {
  success: boolean;
  message?: string;
  data: CrmLead[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Respuesta de obtener lead por ID
 * GET /api/crm/leads/{id}
 */
export interface ObtenerLeadResponse {
  success: boolean;
  message?: string;
  data: CrmLead;
}

/**
 * Filtros para listar leads
 */
export interface FiltrosListarLeads {
  soloMisLeads?: boolean;
  etapaId?: string;
  origen?: string;
  busqueda?: string;
  pagina?: number;
  limite?: number;
}

// ==================== RESPUESTAS DE API ACTIVIDADES ====================

/**
 * Datos para crear una actividad
 * POST /api/crm/leads/{id}/actividades
 */
export interface CrearActividadData {
  tipo: TipoActividad;
  contenido: string;
  fechaInicio?: string;
  fechaFin?: string;
  participantesUsuarioIds?: string[];
  resultado?: string;
  esNotaAcademica?: boolean;
}

/**
 * Respuesta de crear actividad
 */
export interface CrearActividadResponse {
  success: boolean;
  message: string;
  data: CrmActividad;
}

/**
 * Respuesta de obtener timeline
 * GET /api/crm/leads/{id}/timeline
 */
export interface ObtenerTimelineResponse {
  success: boolean;
  message?: string;
  data: CrmActividad[];
}

/**
 * Datos para asignar usuarios a un lead
 * POST /api/crm/leads/{id}/asignar
 */
export interface AsignarLeadData {
  usuarioIds: string[];
  rol?: RolAsignacion;
  sobrescribir?: boolean;
}

/**
 * Respuesta de asignar lead
 */
export interface AsignarLeadResponse {
  success: boolean;
  message: string;
  data: CrmLeadAsignacion[];
}

/**
 * Datos para actualizar una actividad
 * PUT /api/crm/actividades/{id}
 */
export interface ActualizarActividadData {
  tipo?: TipoActividad;
  contenido?: string;
  fechaInicio?: string;
  fechaFin?: string;
  participantesUsuarioIds?: string[];
  resultado?: string;
  esNotaAcademica?: boolean;
}

/**
 * Respuesta de actualizar actividad
 */
export interface ActualizarActividadResponse {
  success: boolean;
  message: string;
  data: CrmActividad;
}
