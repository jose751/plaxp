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

// ==================== PIPELINES ====================

/**
 * Pipeline del CRM (un negocio puede tener varios pipelines)
 */
export interface CrmPipeline {
  id: string;
  nombre: string;
  descripcion: string | null;
  color: string;
  esDefault: boolean;
  activo: boolean;
}

/**
 * Datos para crear un pipeline
 * POST /api/crm/pipelines
 */
export interface CrearPipelineData {
  nombre: string;
  descripcion?: string;
  color?: string;
  esDefault?: boolean;
}

/**
 * Datos para actualizar un pipeline
 * PUT /api/crm/pipelines/{id}
 */
export interface ActualizarPipelineData {
  nombre?: string;
  descripcion?: string;
  color?: string;
  esDefault?: boolean;
  activo?: boolean;
}

/**
 * Respuesta de listar pipelines
 * GET /api/crm/pipelines
 */
export interface ListarPipelinesResponse {
  success: boolean;
  data: CrmPipeline[];
}

/**
 * Respuesta de crear/actualizar/obtener pipeline
 */
export interface PipelineResponse {
  success: boolean;
  data: CrmPipeline;
}

/**
 * Resultado de eliminar pipeline
 */
export interface EliminarPipelineResult {
  accion: 'eliminado' | 'desactivado';
  mensaje: string;
}

/**
 * Respuesta de eliminar pipeline
 * DELETE /api/crm/pipelines/{id}
 */
export interface EliminarPipelineResponse {
  success: boolean;
  data: EliminarPipelineResult;
}

// ==================== ETAPAS ====================

/**
 * Etapa del pipeline CRM
 */
export interface CrmEtapa {
  id: string;
  pipelineId: string;
  nombre: string;
  color: string;
  orden: number;
  tipoSistema: TipoSistema;
  probabilidadDefault: number;
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
  LLAMADA: 'LLAMADA',
  WHATSAPP: 'WHATSAPP',
  SMS: 'SMS',
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
 * Pipeline simplificado para mostrar en leads
 */
export interface CrmLeadPipeline {
  id: string;
  nombre: string;
  color: string;
  esDefault: boolean;
}

/**
 * Lead/Prospecto en el CRM (respuesta del API)
 */
export interface CrmLead {
  id: string;
  pipelineId: string;
  pipeline: CrmLeadPipeline | null;
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
  pipelineId: string;
  nombre: string;
  color: string;
  orden?: number;
  tipoSistema: TipoSistema;
  probabilidadDefault?: number;
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
  probabilidadDefault?: number;
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
 * Resultado de eliminar etapa
 */
export interface EliminarEtapaResult {
  accion: 'eliminada' | 'desactivada';
  mensaje: string;
}

/**
 * Respuesta de eliminar etapa
 * DELETE /api/crm/etapas/{id}
 */
export interface EliminarEtapaResponse {
  success: boolean;
  message?: string;
  data: EliminarEtapaResult | null;
}

/**
 * Datos para mover un lead entre etapas
 * PATCH /api/crm/leads/{id}/mover
 *
 * Si la etapa destino es de tipo PERDIDO, motivoPerdida es obligatorio
 * Si la etapa destino es de tipo GANADO, motivoGanado es obligatorio
 */
export interface MoverLeadData {
  etapaId: string;
  motivoPerdida?: string;
  motivoGanado?: string;
}

/**
 * Motivos de pérdida predefinidos
 */
export const MOTIVOS_PERDIDA = [
  { value: 'PRECIO_ALTO', label: 'Precio alto' },
  { value: 'HORARIO_NO_SIRVE', label: 'Horario no le sirve' },
  { value: 'COMPETENCIA', label: 'Se fue a la competencia' },
  { value: 'NO_CONTESTO', label: 'No contestó nunca' },
  { value: 'MALA_ATENCION', label: 'Mala atención' },
  { value: 'CAMBIO_PLANES', label: 'Cambió de planes' },
  { value: 'UBICACION', label: 'Ubicación no conveniente' },
  { value: 'OTRO', label: 'Otro motivo' },
] as const;

export type MotivoPerdida = (typeof MOTIVOS_PERDIDA)[number]['value'];

/**
 * Motivos de victoria predefinidos (¿Por qué nos eligieron?)
 */
export const MOTIVOS_GANADO = [
  { value: 'PRECIO_COMPETITIVO', label: 'Precio competitivo' },
  { value: 'CALIDAD_ENSENANZA', label: 'Calidad de enseñanza' },
  { value: 'UBICACION', label: 'Ubicación conveniente' },
  { value: 'HORARIOS_FLEXIBLES', label: 'Horarios flexibles' },
  { value: 'RECOMENDACION', label: 'Recomendación de conocido' },
  { value: 'REPUTACION', label: 'Buena reputación / prestigio' },
  { value: 'ATENCION_PERSONALIZADA', label: 'Atención personalizada' },
  { value: 'INSTALACIONES', label: 'Instalaciones / equipamiento' },
  { value: 'OTRO', label: 'Otro motivo' },
] as const;

export type MotivoGanado = (typeof MOTIVOS_GANADO)[number]['value'];

// ==================== RECORDATORIOS ====================

/**
 * Estados de un recordatorio
 */
export const RecordatorioEstado = {
  PENDIENTE: 'PENDIENTE',
  COMPLETADO: 'COMPLETADO',
  NO_REALIZADO: 'NO_REALIZADO',
  CANCELADO: 'CANCELADO',
} as const;

export type RecordatorioEstado = (typeof RecordatorioEstado)[keyof typeof RecordatorioEstado];

/**
 * Unidad de intervalo para recordatorios en serie
 */
export const RecordatorioIntervalo = {
  DIAS: 'DIAS',
  SEMANAS: 'SEMANAS',
  MESES: 'MESES',
} as const;

export type RecordatorioIntervalo = (typeof RecordatorioIntervalo)[keyof typeof RecordatorioIntervalo];

/**
 * Recordatorio del CRM
 */
export interface CrmRecordatorio {
  id: string;
  empresaId: string;
  leadId: string;
  usuarioId: string;
  titulo: string;
  descripcion: string | null;
  fechaProgramada: string;
  estado: RecordatorioEstado;
  fechaCompletado: string | null;
  notasResultado: string | null;
  serieId: string | null;
  serieIndice: number | null;
  creadoEn: string;
  actualizadoEn: string;
  lead?: {
    id: string;
    contactoNombre: string;
    contactoApellido: string;
    alumnoNombre: string;
    alumnoApellido: string;
  };
  usuario?: {
    id: string;
    nombre: string;
  };
}

/**
 * Datos para crear un recordatorio simple
 */
export interface CrearRecordatorioData {
  leadId: string;
  titulo: string;
  descripcion?: string;
  fechaProgramada: string;
}

/**
 * Datos para crear una serie de recordatorios
 */
export interface CrearSerieRecordatoriosData {
  leadId: string;
  titulo: string;
  descripcion?: string;
  fechaInicio: string;
  plazoCantidad: number;
  plazoUnidad: RecordatorioIntervalo;
  intervaloCantidad: number;
  intervaloUnidad: RecordatorioIntervalo;
}

/**
 * Datos para actualizar el estado de un recordatorio
 */
export interface ActualizarRecordatorioData {
  estado: RecordatorioEstado;
  notasResultado?: string;
}

/**
 * Filtros para listar recordatorios
 */
export interface FiltrosRecordatorios {
  leadId?: string;
  oportunidadId?: string;
  estado?: RecordatorioEstado;
  fechaDesde?: string;
  fechaHasta?: string;
  soloMios?: boolean;
  pagina?: number;
  limite?: number;
}

/**
 * Respuesta de crear recordatorio
 */
export interface CrearRecordatorioResponse {
  success: boolean;
  message: string;
  data: CrmRecordatorio;
}

/**
 * Respuesta de crear serie de recordatorios
 */
export interface CrearSerieRecordatoriosResponse {
  success: boolean;
  message: string;
  data: CrmRecordatorio[];
}

/**
 * Respuesta de listar recordatorios
 */
export interface ListarRecordatoriosResponse {
  success: boolean;
  data: CrmRecordatorio[];
  paginacion?: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Respuesta de actualizar recordatorio
 */
export interface ActualizarRecordatorioResponse {
  success: boolean;
  message: string;
  data: CrmRecordatorio;
}

/**
 * Respuesta de cancelar serie
 */
export interface CancelarSerieResponse {
  success: boolean;
  message: string;
  data: {
    cancelados: number;
  };
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
  pipelineId?: string;
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
  RECORDATORIO: 'RECORDATORIO',
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
 * Info de recordatorio cuando la actividad es tipo RECORDATORIO
 */
export interface CrmActividadRecordatorioInfo {
  recordatorioId: string;
  estado: RecordatorioEstado;
  serieId: string | null;
  serieIndice: number | null;
}

/**
 * Participante de una reunión
 */
export interface CrmReunionParticipante {
  usuarioId: string;
  usuarioNombre: string;
  esOrganizador: boolean;
  estado: 'PENDIENTE' | 'CONFIRMADO' | 'RECHAZADO' | 'ASISTIO';
}

/**
 * Actividad del CRM (timeline)
 */
export interface CrmActividad {
  id: string;
  empresaId: string;
  leadId?: string;
  oportunidadId?: string;
  tipo: TipoActividad;
  contenido: string;
  fechaInicio: string;
  fechaFin: string;
  resultado: string | null;
  esNotaAcademica?: boolean;
  fechaCreacion: string;
  creadoPor?: string | null;
  creadoPorNombre?: string | null;
  participantes?: CrmActividadParticipante[];
  // Info adicional cuando tipo === 'RECORDATORIO'
  recordatorioInfo?: CrmActividadRecordatorioInfo;
  // Campos para REUNION
  asunto?: string | null;
  ubicacion?: string | null;
  reunionParticipantes?: CrmReunionParticipante[];
  // Campos para TAREA
  fechaVencimiento?: string | null;
  completada?: boolean;
  fechaCompletada?: string | null;
  completadaPor?: string | null;
  completadaPorNombre?: string | null;
  asignadaA?: string | null;
  asignadaANombre?: string | null;
  // Campos para Soft Delete
  eliminado?: boolean;
  fechaEliminado?: string | null;
  eliminadoPor?: string | null;
  eliminadoPorNombre?: string | null;
}

/**
 * Estados de filtro para actividades
 */
export const EstadoFiltroActividad = {
  ACTIVOS: 'ACTIVOS',
  ELIMINADOS: 'ELIMINADOS',
  TODOS: 'TODOS',
  PENDIENTES: 'PENDIENTES',
  VENCIDOS: 'VENCIDOS',
  COMPLETADOS: 'COMPLETADOS',
  PROXIMOS: 'PROXIMOS',
  PASADOS: 'PASADOS',
} as const;

export type EstadoFiltroActividad = (typeof EstadoFiltroActividad)[keyof typeof EstadoFiltroActividad];

/**
 * Filtros para listar actividades en timeline
 */
export interface FiltrosActividadTimeline {
  estado?: EstadoFiltroActividad;
  tipo?: TipoActividad;
  fechaDesde?: string;
  fechaHasta?: string;
  incluirEliminados?: boolean;
}

/**
 * Datos para crear una reunión
 */
export interface CrearReunionData {
  asunto: string;
  contenido?: string;
  fechaInicio: string;
  fechaFin: string;
  ubicacion?: string;
  participantesIds: string[];
}

/**
 * Datos para crear una tarea
 */
export interface CrearTareaData {
  contenido: string;
  fechaVencimiento: string;
  asignadaA?: string;
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

// ==================== TIPOS DE INTEGRACIONES / API KEYS ====================

/**
 * API Key para integraciones (listado)
 */
export interface IntegracionApiKey {
  id: string;
  nombre: string;
  prefijo: string;
  activo: boolean;
  creadoEn: string;
  ultimoUso: string | null;
  totalUsos: number;
}

/**
 * Resultado de generar una nueva API Key
 * IMPORTANTE: apiKey en texto plano solo se muestra UNA VEZ
 */
export interface IntegracionApiKeyGenerada {
  id: string;
  nombre: string;
  prefijo: string;
  apiKey: string; // Solo disponible al momento de crear
}

/**
 * Respuesta de listar API Keys
 * GET /api/crm/integraciones/api-keys
 */
export interface ListarApiKeysResponse {
  success: boolean;
  data: IntegracionApiKey[];
}

/**
 * Datos para generar una API Key
 * POST /api/crm/integraciones/api-keys
 */
export interface GenerarApiKeyData {
  nombre: string;
}

/**
 * Respuesta de generar API Key
 */
export interface GenerarApiKeyResponse {
  success: boolean;
  data: IntegracionApiKeyGenerada;
  mensaje: string;
}

/**
 * Respuesta de revocar API Key
 * DELETE /api/crm/integraciones/api-keys/{id}
 */
export interface RevocarApiKeyResponse {
  success: boolean;
  mensaje: string;
}

// Alias para compatibilidad con código existente (deprecated)
/** @deprecated Use IntegracionApiKey en su lugar */
export type WebhookApiKey = IntegracionApiKey;
/** @deprecated Use IntegracionApiKeyGenerada en su lugar */
export type WebhookApiKeyGenerada = IntegracionApiKeyGenerada;

// ==================== MODELO PROFESIONAL: CONTACTOS Y OPORTUNIDADES ====================

/**
 * Estados de una oportunidad
 */
export const OportunidadEstado = {
  ABIERTA: 'ABIERTA',
  GANADA: 'GANADA',
  PERDIDA: 'PERDIDA',
} as const;

export type OportunidadEstado = (typeof OportunidadEstado)[keyof typeof OportunidadEstado];

/**
 * Relación del responsable con el contacto (legacy)
 */
export const RelacionResponsable = {
  PADRE: 'PADRE',
  MADRE: 'MADRE',
  TUTOR: 'TUTOR',
  CONYUGE: 'CONYUGE',
  OTRO: 'OTRO',
} as const;

export type RelacionResponsable = (typeof RelacionResponsable)[keyof typeof RelacionResponsable];

// ==================== ENTERPRISE: TIPOS DE PERSONA Y CICLO DE VIDA ====================

/**
 * Tipo de persona (contacto individual o empresa)
 */
export const TipoPersona = {
  PERSONA: 'PERSONA',
  EMPRESA: 'EMPRESA',
} as const;

export type TipoPersona = (typeof TipoPersona)[keyof typeof TipoPersona];

/**
 * Etapas del ciclo de vida de un contacto
 */
export const EtapaCicloVida = {
  SUSCRIPTOR: 'SUSCRIPTOR',
  LEAD: 'LEAD',
  OPORTUNIDAD: 'OPORTUNIDAD',
  CLIENTE: 'CLIENTE',
  EX_CLIENTE: 'EX_CLIENTE',
} as const;

export type EtapaCicloVida = (typeof EtapaCicloVida)[keyof typeof EtapaCicloVida];

/**
 * Labels para las etapas del ciclo de vida
 */
export const ETAPA_CICLO_VIDA_LABELS: Record<EtapaCicloVida, string> = {
  SUSCRIPTOR: 'Suscriptor',
  LEAD: 'Lead',
  OPORTUNIDAD: 'Oportunidad',
  CLIENTE: 'Cliente',
  EX_CLIENTE: 'Ex-Cliente',
};

/**
 * Tipos de relación entre contactos (relaciones familiares/empresariales)
 */
export const TipoRelacionContacto = {
  PADRE_DE: 'PADRE_DE',
  MADRE_DE: 'MADRE_DE',
  TUTOR_DE: 'TUTOR_DE',
  HERMANO_DE: 'HERMANO_DE',
  CONYUGUE_DE: 'CONYUGUE_DE',
  EMPLEADO_DE: 'EMPLEADO_DE',
  REPRESENTANTE_DE: 'REPRESENTANTE_DE',
} as const;

export type TipoRelacionContacto = (typeof TipoRelacionContacto)[keyof typeof TipoRelacionContacto];

/**
 * Labels para tipos de relación
 */
export const TIPO_RELACION_LABELS: Record<TipoRelacionContacto, string> = {
  PADRE_DE: 'Padre de',
  MADRE_DE: 'Madre de',
  TUTOR_DE: 'Tutor de',
  HERMANO_DE: 'Hermano/a de',
  CONYUGUE_DE: 'Cónyuge de',
  EMPLEADO_DE: 'Empleado de',
  REPRESENTANTE_DE: 'Representante de',
};

/**
 * Motivos de pérdida estandarizados (Enterprise)
 */
export const MotivoPerdidaEnterprise = {
  PRECIO_ALTO: 'PRECIO_ALTO',
  HORARIO_INCOMPATIBLE: 'HORARIO_INCOMPATIBLE',
  COMPETENCIA: 'COMPETENCIA',
  SIN_RESPUESTA: 'SIN_RESPUESTA',
  MALA_ATENCION: 'MALA_ATENCION',
  SIN_PRESUPUESTO: 'SIN_PRESUPUESTO',
  CAMBIO_PRIORIDADES: 'CAMBIO_PRIORIDADES',
  OTRO: 'OTRO',
} as const;

export type MotivoPerdidaEnterprise = (typeof MotivoPerdidaEnterprise)[keyof typeof MotivoPerdidaEnterprise];

export const MOTIVOS_PERDIDA_ENTERPRISE_LABELS: Record<MotivoPerdidaEnterprise, string> = {
  PRECIO_ALTO: 'Precio muy alto',
  HORARIO_INCOMPATIBLE: 'Horario incompatible',
  COMPETENCIA: 'Se fue con la competencia',
  SIN_RESPUESTA: 'Sin respuesta / No contesta',
  MALA_ATENCION: 'Mala atención recibida',
  SIN_PRESUPUESTO: 'Sin presupuesto disponible',
  CAMBIO_PRIORIDADES: 'Cambió de prioridades',
  OTRO: 'Otro motivo',
};

/**
 * Motivos de ganado estandarizados (Enterprise)
 */
export const MotivoGanadoEnterprise = {
  PRECIO_COMPETITIVO: 'PRECIO_COMPETITIVO',
  CALIDAD_ACADEMICA: 'CALIDAD_ACADEMICA',
  RECOMENDACION: 'RECOMENDACION',
  UBICACION: 'UBICACION',
  HORARIOS_FLEXIBLES: 'HORARIOS_FLEXIBLES',
  PRESTIGIO: 'PRESTIGIO',
  OTRO: 'OTRO',
} as const;

export type MotivoGanadoEnterprise = (typeof MotivoGanadoEnterprise)[keyof typeof MotivoGanadoEnterprise];

export const MOTIVOS_GANADO_ENTERPRISE_LABELS: Record<MotivoGanadoEnterprise, string> = {
  PRECIO_COMPETITIVO: 'Precio competitivo',
  CALIDAD_ACADEMICA: 'Calidad académica',
  RECOMENDACION: 'Recomendación de conocido',
  UBICACION: 'Ubicación conveniente',
  HORARIOS_FLEXIBLES: 'Horarios flexibles',
  PRESTIGIO: 'Prestigio de la institución',
  OTRO: 'Otro motivo',
};

// ==================== CONTACTOS ====================

/**
 * Información del responsable de un contacto (padre/tutor)
 */
export interface ContactoResponsable {
  nombre: string;
  apellido: string | null;
  telefono: string | null;
  correo: string | null;
  relacion: RelacionResponsable | null;
}

/**
 * Estadísticas de oportunidades de un contacto
 */
export interface ContactoEstadisticas {
  total: number;
  abiertas: number;
  ganadas: number;
  perdidas: number;
}

/**
 * Propietario de un contacto (vendedor asignado)
 */
export interface ContactoPropietario {
  id: string;
  nombre: string;
}

/**
 * Relación entre contactos (Enterprise)
 */
export interface ContactoRelacion {
  id: string;
  contactoRelacionadoId: string;
  tipoRelacion: TipoRelacionContacto;
  tipoRelacionLabel: string;
  esPagadorDefault: boolean;
  notas: string | null;
  contactoRelacionado?: {
    id: string;
    nombre: string;
    apellido: string;
    nombreCompleto: string;
    correo: string | null;
    telefono: string | null;
  };
}

/**
 * Contacto del CRM (representa una persona única)
 */
export interface CrmContacto {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string | null;
  telefono: string | null;
  telefonoSecundario: string | null;
  fechaNacimiento: string | null;
  // Campos Enterprise
  tipoPersona: TipoPersona;
  etapaCicloVida: EtapaCicloVida;
  etapaCicloVidaLabel: string;
  propietarioId: string | null;
  propietario: ContactoPropietario | null;
  // Legacy responsable (migrar a relaciones)
  responsable: ContactoResponsable | null;
  medioContactoPreferido: MedioContactoPreferido | null;
  origen: string | null;
  fuente: string | null;
  notas: string | null;
  esCliente: boolean;
  fechaConversionCliente: string | null;
  estudianteId: string | null;
  activo: boolean;
  fechaCreacion: string;
  ultimaModificacion: string;
  estadisticas?: ContactoEstadisticas;
  // Relaciones Enterprise
  relaciones?: ContactoRelacion[];
}

/**
 * Datos para crear un contacto
 * POST /api/crm/contactos
 */
export interface CrearContactoData {
  nombre: string;
  apellido: string;
  correo?: string;
  telefono?: string;
  telefonoSecundario?: string;
  fechaNacimiento?: string;
  // Campos Enterprise
  tipoPersona?: TipoPersona;
  etapaCicloVida?: EtapaCicloVida;
  propietarioId?: string;
  // Legacy responsable
  responsable?: {
    nombre: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    relacion?: RelacionResponsable;
  };
  medioContactoPreferido?: MedioContactoPreferido;
  origen?: string;
  fuente?: string;
  notas?: string;
}

/**
 * Datos para actualizar un contacto
 * PUT /api/crm/contactos/{id}
 */
export interface ActualizarContactoData {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  telefonoSecundario?: string;
  fechaNacimiento?: string;
  // Campos Enterprise
  tipoPersona?: TipoPersona;
  etapaCicloVida?: EtapaCicloVida;
  propietarioId?: string | null;
  // Legacy responsable
  responsable?: {
    nombre?: string;
    apellido?: string;
    telefono?: string;
    correo?: string;
    relacion?: RelacionResponsable;
  } | null;
  medioContactoPreferido?: MedioContactoPreferido;
  origen?: string;
  fuente?: string;
  notas?: string;
  activo?: boolean;
}

/**
 * Filtros para listar contactos
 */
export interface FiltrosListarContactos {
  busqueda?: string;
  esCliente?: boolean;
  activo?: boolean;
  fuente?: string;
  // Filtros Enterprise
  tipoPersona?: TipoPersona;
  etapaCicloVida?: EtapaCicloVida;
  propietarioId?: string;
  sinPropietario?: boolean;
  // Filtro para ver solo mis contactos
  soloMios?: boolean;
  // Paginación
  pagina?: number;
  limite?: number;
  ordenarPor?: 'nombre' | 'creadoEn' | 'actualizadoEn' | 'etapaCicloVida';
  ordenDireccion?: 'asc' | 'desc';
}

/**
 * Respuesta de listar contactos
 * GET /api/crm/contactos
 */
export interface ListarContactosResponse {
  success: boolean;
  data: CrmContacto[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Respuesta de obtener contacto por ID
 * GET /api/crm/contactos/{id}
 */
export interface ObtenerContactoResponse {
  success: boolean;
  data: CrmContacto;
}

/**
 * Respuesta de crear contacto
 */
export interface CrearContactoResponse {
  success: boolean;
  message: string;
  data: CrmContacto;
}

/**
 * Respuesta de actualizar contacto
 */
export interface ActualizarContactoResponse {
  success: boolean;
  message: string;
  data: CrmContacto;
}

/**
 * Respuesta de eliminar contacto
 */
export interface EliminarContactoResponse {
  success: boolean;
  message: string;
}

/**
 * Respuesta de verificar duplicado
 */
export interface VerificarDuplicadoResponse {
  success: boolean;
  duplicado: boolean;
  contacto: {
    id: string;
    nombre: string;
  } | null;
}

// ==================== OPORTUNIDADES ====================

/**
 * Asignación de usuario a una oportunidad
 */
export interface OportunidadAsignacion {
  usuarioId: string;
  usuarioNombre: string;
  rol: RolAsignacion;
  asignadoEn: string;
}

/**
 * Información del contacto dentro de una oportunidad
 */
export interface OportunidadContacto {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string | null;
  telefono: string | null;
}

/**
 * Oportunidad del CRM (representa un negocio/deal potencial)
 */
export interface CrmOportunidad {
  id: string;
  contactoId: string;
  pipelineId: string;
  etapaId: string;
  titulo: string;
  descripcion: string | null;
  cursoInteresId: string | null;
  productoPersonalizado: string | null;
  montoEstimado: string | null;
  moneda: string;
  probabilidad: number;
  estado: OportunidadEstado;
  motivoPerdida: string | null;
  motivoGanado: string | null;
  fechaCierreEsperada: string | null;
  fechaGanada: string | null;
  fechaPerdida: string | null;
  fechaUltimoContacto: string | null;
  activo: boolean;
  archivado: boolean;
  fechaArchivado: string | null;
  fechaCreacion: string;
  ultimaModificacion: string;
  contacto?: OportunidadContacto;
  pipeline?: CrmPipeline;
  etapa?: CrmEtapa;
  asignaciones?: OportunidadAsignacion[];
}

/**
 * Datos para crear una oportunidad
 * POST /api/crm/oportunidades
 */
export interface CrearOportunidadData {
  contactoId: string;
  pipelineId: string;
  etapaId?: string;
  titulo: string;
  descripcion?: string;
  cursoInteresId?: string;
  productoPersonalizado?: string;
  montoEstimado?: string;
  moneda?: string;
  probabilidad?: number;
  fechaCierreEsperada?: string;
}

/**
 * Datos para actualizar una oportunidad
 * PUT /api/crm/oportunidades/{id}
 */
export interface ActualizarOportunidadData {
  titulo?: string;
  descripcion?: string;
  cursoInteresId?: string;
  productoPersonalizado?: string;
  montoEstimado?: string;
  moneda?: string;
  probabilidad?: number;
  fechaCierreEsperada?: string;
  fechaUltimoContacto?: string;
}

/**
 * Datos para mover una oportunidad de etapa
 * PATCH /api/crm/oportunidades/{id}/mover
 */
export interface MoverOportunidadData {
  etapaId: string;
  motivoPerdida?: string;
  motivoGanado?: string;
}

/**
 * Datos para asignar usuarios a una oportunidad
 * POST /api/crm/oportunidades/{id}/asignar
 */
export interface AsignarOportunidadData {
  usuarioIds: string[];
  rol?: RolAsignacion;
  sobrescribir?: boolean;
}

/**
 * Filtros para listar oportunidades
 */
export interface FiltrosListarOportunidades {
  contactoId?: string;
  pipelineId?: string;
  etapaId?: string;
  estado?: OportunidadEstado;
  busqueda?: string;
  soloMias?: boolean;
  archivado?: boolean; // true = solo archivadas, false = solo no archivadas, undefined = todas
  pagina?: number;
  limite?: number;
  ordenarPor?: 'titulo' | 'fechaCreacion' | 'montoEstimado' | 'probabilidad';
  ordenDireccion?: 'asc' | 'desc';
}

/**
 * Datos para archivar/desarchivar una oportunidad
 * PATCH /api/crm/oportunidades/{id}/archivar
 */
export interface ArchivarOportunidadData {
  archivar: boolean;
}

/**
 * Columna del tablero Kanban de oportunidades
 */
export interface OportunidadTableroColumna {
  etapa: CrmEtapa;
  oportunidades: CrmOportunidad[];
  total: number;
  montoTotal: string;
}

/**
 * Respuesta del tablero de oportunidades
 * GET /api/crm/oportunidades/tablero/{pipelineId}
 */
export interface ObtenerTableroOportunidadesResponse {
  success: boolean;
  data: OportunidadTableroColumna[];
}

/**
 * Respuesta de listar oportunidades
 * GET /api/crm/oportunidades
 */
export interface ListarOportunidadesResponse {
  success: boolean;
  data: CrmOportunidad[];
  paginacion: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}

/**
 * Respuesta de obtener oportunidad por ID
 * GET /api/crm/oportunidades/{id}
 */
export interface ObtenerOportunidadResponse {
  success: boolean;
  data: CrmOportunidad;
}

/**
 * Respuesta de crear oportunidad
 */
export interface CrearOportunidadResponse {
  success: boolean;
  message: string;
  data: CrmOportunidad;
}

/**
 * Respuesta de actualizar oportunidad
 */
export interface ActualizarOportunidadResponse {
  success: boolean;
  message: string;
  data: CrmOportunidad;
}

/**
 * Respuesta de mover oportunidad
 */
export interface MoverOportunidadResponse {
  success: boolean;
  message: string;
  data: CrmOportunidad;
}

/**
 * Respuesta de eliminar oportunidad
 */
export interface EliminarOportunidadResponse {
  success: boolean;
  message: string;
}

/**
 * Respuesta de archivar/desarchivar oportunidad
 */
export interface ArchivarOportunidadResponse {
  success: boolean;
  message: string;
  data: CrmOportunidad;
}

/**
 * Respuesta de asignar usuarios a oportunidad
 */
export interface AsignarOportunidadResponse {
  success: boolean;
  message: string;
  data: OportunidadAsignacion[];
}

/**
 * Respuesta de listar oportunidades por contacto
 * GET /api/crm/oportunidades/contacto/{contactoId}
 */
export interface ListarOportunidadesPorContactoResponse {
  success: boolean;
  data: CrmOportunidad[];
}

// ==================== FORECAST ====================

/**
 * Forecast por etapa
 */
export interface ForecastPorEtapa {
  etapaId: string;
  etapaNombre: string;
  etapaColor: string;
  tipoSistema: string;
  cantidadOportunidades: number;
  montoTotal: number;
  montoPonderado: number;
  probabilidadPromedio: number;
}

/**
 * Datos del forecast del pipeline
 */
export interface ForecastData {
  pipelineId: string;
  pipelineNombre: string;
  moneda: string;
  totalOportunidades: number;
  montoTotalPipeline: number;
  montoPonderadoTotal: number;
  forecastPorEtapa: ForecastPorEtapa[];
  resumen: {
    abiertasCount: number;
    ganadasCount: number;
    perdidasCount: number;
    montoGanado: number;
    montoPerdido: number;
  };
}

/**
 * Respuesta del endpoint de forecast
 * GET /api/crm/oportunidades/forecast
 */
export interface ObtenerForecastResponse {
  success: boolean;
  data: ForecastData;
}

// ==================== ENTERPRISE: SMART ENTRY ====================

/**
 * Datos del responsable para Smart Entry
 */
export interface SmartEntryResponsable {
  nombre: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
}

/**
 * Datos del alumno para Smart Entry
 */
export interface SmartEntryAlumno {
  esMismaPersona: boolean;
  nombre?: string;
  apellido?: string;
  fechaNacimiento?: string;
  correo?: string;
  telefono?: string;
}

/**
 * Datos del negocio/oportunidad para Smart Entry
 */
export interface SmartEntryNegocio {
  titulo: string;
  pipelineId?: string;
  etapaId?: string;
  cursoInteresId?: string;
  montoEstimado?: number;
  origen?: string;
  fuente?: string;
}

/**
 * Datos para Smart Entry (orquestador)
 * POST /api/crm/contactos/smart-entry
 */
export interface SmartEntryData {
  responsable: SmartEntryResponsable;
  alumno: SmartEntryAlumno;
  negocio: SmartEntryNegocio;
  notaInicial?: string;
}

/**
 * Resultado de Smart Entry
 */
export interface SmartEntryResult {
  responsableId: string;
  alumnoId: string | null;
  oportunidadId: string;
  relacionId: string | null;
  actividadId: string | null;
  responsable: {
    id: string;
    nombreCompleto: string;
    esNuevo: boolean;
  };
  alumno: {
    id: string;
    nombreCompleto: string;
    esNuevo: boolean;
  } | null;
  oportunidad: {
    id: string;
    titulo: string;
    etapa: string;
  };
}

/**
 * Respuesta de Smart Entry
 */
export interface SmartEntryResponse {
  success: boolean;
  message: string;
  data: SmartEntryResult;
}

// ==================== ENTERPRISE: RELACIONES ENTRE CONTACTOS ====================

/**
 * Datos para crear una relación entre contactos
 * POST /api/crm/contactos/:id/relaciones
 */
export interface CrearRelacionContactoData {
  contactoRelacionadoId: string;
  tipoRelacion: TipoRelacionContacto;
  esPagadorDefault?: boolean;
  notas?: string;
}

/**
 * Datos para actualizar una relación
 * PUT /api/crm/contactos/relaciones/:relacionId
 */
export interface ActualizarRelacionContactoData {
  tipoRelacion?: TipoRelacionContacto;
  esPagadorDefault?: boolean;
  notas?: string;
}

/**
 * Relación completa con datos de contactos
 */
export interface RelacionContactoCompleta {
  id: string;
  contactoOrigenId: string;
  contactoRelacionadoId: string;
  tipoRelacion: TipoRelacionContacto;
  esPagadorDefault: boolean;
  notas: string | null;
  contactoOrigen?: {
    id: string;
    nombre: string;
    apellido: string;
    nombreCompleto: string;
  };
  contactoRelacionado?: {
    id: string;
    nombre: string;
    apellido: string;
    nombreCompleto: string;
  };
}

/**
 * Respuesta de crear relación
 */
export interface CrearRelacionResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    tipoRelacion: TipoRelacionContacto;
    esPagadorDefault: boolean;
  };
}

/**
 * Respuesta de obtener relaciones
 */
export interface ObtenerRelacionesResponse {
  success: boolean;
  data: RelacionContactoCompleta[];
}

// ==================== ENTERPRISE: ÁRBOL FAMILIAR ====================

/**
 * Contacto relacionado en el árbol familiar
 */
export interface ArbolFamiliarContactoRelacionado {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string | null;
  telefono: string | null;
  tipoPersona: TipoPersona;
  etapaCicloVida: EtapaCicloVida;
  esCliente: boolean;
  oportunidadesAbiertas: number;
}

/**
 * Relación en el árbol familiar
 */
export interface ArbolFamiliarRelacion {
  id: string;
  tipoRelacion: TipoRelacionContacto;
  tipoRelacionLabel: string;
  esPagadorDefault: boolean;
  direccion: 'ORIGEN' | 'DESTINO';
  contactoRelacionado: ArbolFamiliarContactoRelacionado;
}

/**
 * Contacto principal del árbol familiar
 */
export interface ArbolFamiliarContacto {
  id: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string | null;
  telefono: string | null;
  tipoPersona: TipoPersona;
  etapaCicloVida: EtapaCicloVida;
  esCliente: boolean;
}

/**
 * Respuesta del árbol familiar
 * GET /api/crm/contactos/:id/arbol
 */
export interface ArbolFamiliarResponse {
  success: boolean;
  data: {
    contacto: ArbolFamiliarContacto;
    relaciones: ArbolFamiliarRelacion[];
  };
}

/**
 * Respuesta de verificar duplicado (Enterprise - incluye propietario)
 */
export interface VerificarDuplicadoEnterpriseResponse {
  success: boolean;
  duplicado: boolean;
  contacto: {
    id: string;
    nombreCompleto: string;
    propietario: {
      id: string;
      nombre: string;
    } | null;
  } | null;
  mensaje: string | null;
}
