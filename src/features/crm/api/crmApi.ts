import { apiService } from '../../../shared/services/apiService';
import type {
  // Pipelines
  ListarPipelinesResponse,
  CrearPipelineData,
  PipelineResponse,
  ActualizarPipelineData,
  EliminarPipelineResponse,
  // Etapas
  ListarEtapasResponse,
  CrearEtapaData,
  CrearEtapaResponse,
  ActualizarEtapaData,
  ActualizarEtapaResponse,
  ObtenerEtapaResponse,
  EliminarEtapaResponse,
  ObtenerTableroResponse,
  // Actividades (para compatibilidad)
  CrearActividadData,
  CrearActividadResponse,
  ObtenerTimelineResponse,
  ActualizarActividadData,
  ActualizarActividadResponse,
  FiltrosActividadTimeline,
  // Reuniones y Tareas
  CrearReunionData,
  CrearTareaData,
  // Leads (Legacy)
  ListarLeadsResponse,
  CrearLeadData,
  ObtenerLeadResponse,
  ActualizarLeadData,
  MoverLeadData,
} from '../types/crm.types';

// ==================== PIPELINES ====================

/**
 * Listar todos los pipelines de la empresa
 * GET /api/crm/pipelines
 * @param incluirInactivos - Si es true, incluye pipelines desactivados
 */
export const listarPipelinesApi = async (incluirInactivos: boolean = false): Promise<ListarPipelinesResponse> => {
  const params = incluirInactivos ? '?incluirInactivos=true' : '';
  return await apiService.get<ListarPipelinesResponse>(`crm/pipelines${params}`);
};

/**
 * Obtener un pipeline por ID
 * GET /api/crm/pipelines/{id}
 */
export const obtenerPipelinePorIdApi = async (id: string): Promise<PipelineResponse> => {
  return await apiService.get<PipelineResponse>(`crm/pipelines/${id}`);
};

/**
 * Crear un nuevo pipeline
 * POST /api/crm/pipelines
 */
export const crearPipelineApi = async (data: CrearPipelineData): Promise<PipelineResponse> => {
  return await apiService.post<PipelineResponse>('crm/pipelines', data);
};

/**
 * Actualizar un pipeline
 * PUT /api/crm/pipelines/{id}
 */
export const actualizarPipelineApi = async (id: string, data: ActualizarPipelineData): Promise<PipelineResponse> => {
  return await apiService.put<PipelineResponse>(`crm/pipelines/${id}`, data);
};

/**
 * Eliminar un pipeline
 * DELETE /api/crm/pipelines/{id}
 */
export const eliminarPipelineApi = async (id: string): Promise<EliminarPipelineResponse> => {
  return await apiService.delete<EliminarPipelineResponse>(`crm/pipelines/${id}`);
};

// ==================== ETAPAS ====================

/**
 * Listar todas las etapas de un pipeline
 * GET /api/crm/etapas
 * @param pipelineId - ID del pipeline (opcional)
 * @param incluirInactivas - Si es true, incluye etapas desactivadas
 */
export const listarEtapasApi = async (pipelineId?: string, incluirInactivas: boolean = false): Promise<ListarEtapasResponse> => {
  const params = new URLSearchParams();
  if (pipelineId) params.append('pipelineId', pipelineId);
  if (incluirInactivas) params.append('incluirInactivas', 'true');
  const queryString = params.toString();
  const url = queryString ? `crm/etapas?${queryString}` : 'crm/etapas';
  return await apiService.get<ListarEtapasResponse>(url);
};

/**
 * Obtener una etapa por ID
 * GET /api/crm/etapas/{id}
 */
export const obtenerEtapaPorIdApi = async (
  id: string
): Promise<ObtenerEtapaResponse> => {
  return await apiService.get<ObtenerEtapaResponse>(`crm/etapas/${id}`);
};

/**
 * Crear una nueva etapa
 * POST /api/crm/etapas
 */
export const crearEtapaApi = async (
  data: CrearEtapaData
): Promise<CrearEtapaResponse> => {
  return await apiService.post<CrearEtapaResponse>('crm/etapas', data);
};

/**
 * Actualizar una etapa
 * PUT /api/crm/etapas/{id}
 */
export const actualizarEtapaApi = async (
  id: string,
  data: ActualizarEtapaData
): Promise<ActualizarEtapaResponse> => {
  return await apiService.put<ActualizarEtapaResponse>(`crm/etapas/${id}`, data);
};

/**
 * Eliminar una etapa
 * DELETE /api/crm/etapas/{id}
 */
export const eliminarEtapaApi = async (
  id: string
): Promise<EliminarEtapaResponse> => {
  return await apiService.delete<EliminarEtapaResponse>(`crm/etapas/${id}`);
};

// ==================== TABLERO ====================

/**
 * Obtener el tablero completo (Kanban)
 * GET /api/crm/tablero
 * @param pipelineId - ID del pipeline (opcional, usa el default si no se especifica)
 */
export const obtenerTableroApi = async (pipelineId?: string): Promise<ObtenerTableroResponse> => {
  const params = pipelineId ? `?pipelineId=${pipelineId}` : '';
  return await apiService.get<ObtenerTableroResponse>(`crm/tablero${params}`);
};

// ==================== ACTIVIDADES (compatibilidad con oportunidades) ====================

/**
 * Crear una actividad en el timeline de una oportunidad
 * POST /api/crm/oportunidades/{id}/actividades
 */
export const crearActividadApi = async (
  oportunidadId: string,
  data: CrearActividadData
): Promise<CrearActividadResponse> => {
  return await apiService.post<CrearActividadResponse>(`crm/oportunidades/${oportunidadId}/actividades`, data);
};

/**
 * Obtener el timeline de actividades de una oportunidad
 * GET /api/crm/oportunidades/{id}/timeline
 * @param oportunidadId - ID de la oportunidad
 * @param filtros - Filtros opcionales (estado, tipo, fechas, incluirEliminados)
 */
export const obtenerTimelineApi = async (
  oportunidadId: string,
  filtros?: FiltrosActividadTimeline
): Promise<ObtenerTimelineResponse> => {
  const params = new URLSearchParams();

  if (filtros?.estado) params.append('estado', filtros.estado);
  if (filtros?.tipo) params.append('tipo', filtros.tipo);
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.incluirEliminados) params.append('incluirEliminados', 'true');

  const queryString = params.toString();
  const url = queryString
    ? `crm/oportunidades/${oportunidadId}/timeline?${queryString}`
    : `crm/oportunidades/${oportunidadId}/timeline`;

  return await apiService.get<ObtenerTimelineResponse>(url);
};

/**
 * Actualizar una actividad existente
 * PUT /api/crm/actividades/{id}
 */
export const actualizarActividadApi = async (
  actividadId: string,
  data: ActualizarActividadData
): Promise<ActualizarActividadResponse> => {
  return await apiService.put<ActualizarActividadResponse>(`crm/actividades/${actividadId}`, data);
};

/**
 * Eliminar una actividad
 * DELETE /api/crm/actividades/{id}
 */
export const eliminarActividadApi = async (
  actividadId: string
): Promise<{ success: boolean; message: string }> => {
  return await apiService.delete<{ success: boolean; message: string }>(`crm/actividades/${actividadId}`);
};

/**
 * Restaurar una actividad eliminada (solo si no está vencida)
 * PATCH /api/crm/actividades/{id}/restaurar
 */
export const restaurarActividadApi = async (
  actividadId: string
): Promise<CrearActividadResponse> => {
  return await apiService.patch<CrearActividadResponse>(`crm/actividades/${actividadId}/restaurar`, {});
};

/**
 * Obtener actividades pendientes del usuario actual
 * GET /api/crm/actividades/pendientes
 */
export const obtenerMisPendientesApi = async (): Promise<ObtenerTimelineResponse> => {
  return await apiService.get<ObtenerTimelineResponse>('crm/actividades/pendientes');
};

// ==================== REUNIONES ====================

/**
 * Crear una reunión para una oportunidad
 * POST /api/crm/oportunidades/{id}/reuniones
 */
export const crearReunionApi = async (
  oportunidadId: string,
  data: CrearReunionData
): Promise<CrearActividadResponse> => {
  return await apiService.post<CrearActividadResponse>(`crm/oportunidades/${oportunidadId}/reuniones`, data);
};

// ==================== TAREAS ====================

/**
 * Crear una tarea para una oportunidad
 * POST /api/crm/oportunidades/{id}/tareas
 */
export const crearTareaApi = async (
  oportunidadId: string,
  data: CrearTareaData
): Promise<CrearActividadResponse> => {
  return await apiService.post<CrearActividadResponse>(`crm/oportunidades/${oportunidadId}/tareas`, data);
};

/**
 * Completar o desmarcar una tarea
 * PATCH /api/crm/tareas/{id}/completar
 */
export const completarTareaApi = async (
  tareaId: string,
  completada: boolean
): Promise<CrearActividadResponse> => {
  return await apiService.patch<CrearActividadResponse>(`crm/tareas/${tareaId}/completar`, { completada });
};

// ==================== INTEGRACIONES / API KEYS ====================

import type {
  ListarApiKeysResponse,
  GenerarApiKeyData,
  GenerarApiKeyResponse,
  RevocarApiKeyResponse,
} from '../types/crm.types';

/**
 * Listar todas las API Keys de la empresa
 * GET /api/crm/integraciones/api-keys
 */
export const listarApiKeysApi = async (): Promise<ListarApiKeysResponse> => {
  return await apiService.get<ListarApiKeysResponse>('crm/integraciones/api-keys');
};

/**
 * Generar una nueva API Key
 * POST /api/crm/integraciones/api-keys
 *
 * IMPORTANTE: La apiKey en texto plano solo se muestra UNA VEZ en la respuesta
 */
export const generarApiKeyApi = async (
  data: GenerarApiKeyData
): Promise<GenerarApiKeyResponse> => {
  return await apiService.post<GenerarApiKeyResponse>('crm/integraciones/api-keys', data);
};

/**
 * Revocar (desactivar) una API Key
 * DELETE /api/crm/integraciones/api-keys/{id}
 */
export const revocarApiKeyApi = async (
  id: string
): Promise<RevocarApiKeyResponse> => {
  return await apiService.delete<RevocarApiKeyResponse>(`crm/integraciones/api-keys/${id}`);
};

// ==================== RECORDATORIOS ====================

import type {
  CrearRecordatorioData,
  CrearRecordatorioResponse,
  CrearSerieRecordatoriosData,
  CrearSerieRecordatoriosResponse,
  ListarRecordatoriosResponse,
  FiltrosRecordatorios,
  ActualizarRecordatorioData,
  ActualizarRecordatorioResponse,
  CancelarSerieResponse,
} from '../types/crm.types';

/**
 * Crear un recordatorio simple
 * POST /api/crm/recordatorios
 */
export const crearRecordatorioApi = async (
  data: CrearRecordatorioData
): Promise<CrearRecordatorioResponse> => {
  return await apiService.post<CrearRecordatorioResponse>('crm/recordatorios', data);
};

/**
 * Crear una serie de recordatorios programados
 * POST /api/crm/recordatorios/serie
 */
export const crearSerieRecordatoriosApi = async (
  data: CrearSerieRecordatoriosData
): Promise<CrearSerieRecordatoriosResponse> => {
  return await apiService.post<CrearSerieRecordatoriosResponse>('crm/recordatorios/serie', data);
};

/**
 * Listar recordatorios con filtros
 * GET /api/crm/recordatorios
 */
export const listarRecordatoriosApi = async (
  filtros?: FiltrosRecordatorios
): Promise<ListarRecordatoriosResponse> => {
  const params = new URLSearchParams();

  if (filtros?.oportunidadId) params.append('oportunidadId', filtros.oportunidadId);
  if (filtros?.estado) params.append('estado', filtros.estado);
  if (filtros?.fechaDesde) params.append('fechaDesde', filtros.fechaDesde);
  if (filtros?.fechaHasta) params.append('fechaHasta', filtros.fechaHasta);
  if (filtros?.soloMios) params.append('soloMios', 'true');
  if (filtros?.pagina) params.append('pagina', filtros.pagina.toString());
  if (filtros?.limite) params.append('limite', filtros.limite.toString());

  const queryString = params.toString();
  const url = queryString ? `crm/recordatorios?${queryString}` : 'crm/recordatorios';

  return await apiService.get<ListarRecordatoriosResponse>(url);
};

/**
 * Listar recordatorios pendientes para hoy
 * GET /api/crm/recordatorios/hoy
 */
export const listarRecordatoriosHoyApi = async (): Promise<ListarRecordatoriosResponse> => {
  return await apiService.get<ListarRecordatoriosResponse>('crm/recordatorios/hoy');
};

/**
 * Listar recordatorios de una oportunidad específica
 * GET /api/crm/oportunidades/{oportunidadId}/recordatorios
 */
export const listarRecordatoriosOportunidadApi = async (
  oportunidadId: string
): Promise<ListarRecordatoriosResponse> => {
  return await apiService.get<ListarRecordatoriosResponse>(`crm/oportunidades/${oportunidadId}/recordatorios`);
};

/**
 * Actualizar el estado de un recordatorio
 * PATCH /api/crm/recordatorios/{id}
 */
export const actualizarRecordatorioApi = async (
  id: string,
  data: ActualizarRecordatorioData
): Promise<ActualizarRecordatorioResponse> => {
  return await apiService.patch<ActualizarRecordatorioResponse>(`crm/recordatorios/${id}`, data);
};

/**
 * Cancelar todos los recordatorios pendientes de una serie
 * DELETE /api/crm/recordatorios/serie/{serieId}
 */
export const cancelarSerieRecordatoriosApi = async (
  serieId: string
): Promise<CancelarSerieResponse> => {
  return await apiService.delete<CancelarSerieResponse>(`crm/recordatorios/serie/${serieId}`);
};

// ==================== CONTACTOS ====================

import type {
  ListarContactosResponse,
  ObtenerContactoResponse,
  CrearContactoData,
  CrearContactoResponse,
  ActualizarContactoData,
  ActualizarContactoResponse,
  EliminarContactoResponse,
  FiltrosListarContactos,
  VerificarDuplicadoResponse,
} from '../types/crm.types';

/**
 * Listar contactos con filtros y paginación
 * GET /api/crm/contactos
 */
export const listarContactosApi = async (
  filtros?: FiltrosListarContactos
): Promise<ListarContactosResponse> => {
  const params = new URLSearchParams();

  if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);
  if (filtros?.esCliente !== undefined) params.append('esCliente', filtros.esCliente.toString());
  if (filtros?.activo !== undefined) params.append('activo', filtros.activo.toString());
  if (filtros?.fuente) params.append('fuente', filtros.fuente);
  // Filtros Enterprise
  if (filtros?.tipoPersona) params.append('tipoPersona', filtros.tipoPersona);
  if (filtros?.etapaCicloVida) params.append('etapaCicloVida', filtros.etapaCicloVida);
  if (filtros?.propietarioId) params.append('propietarioId', filtros.propietarioId);
  if (filtros?.sinPropietario) params.append('sinPropietario', 'true');
  // Filtro para ver solo mis contactos
  if (filtros?.soloMios) params.append('soloMios', 'true');
  // Paginación
  if (filtros?.pagina) params.append('pagina', filtros.pagina.toString());
  if (filtros?.limite) params.append('limite', filtros.limite.toString());
  if (filtros?.ordenarPor) params.append('ordenarPor', filtros.ordenarPor);
  if (filtros?.ordenDireccion) params.append('ordenDireccion', filtros.ordenDireccion);

  const queryString = params.toString();
  const url = queryString ? `crm/contactos?${queryString}` : 'crm/contactos';

  return await apiService.get<ListarContactosResponse>(url);
};

/**
 * Obtener un contacto por ID
 * GET /api/crm/contactos/{id}
 */
export const obtenerContactoPorIdApi = async (
  id: string
): Promise<ObtenerContactoResponse> => {
  return await apiService.get<ObtenerContactoResponse>(`crm/contactos/${id}`);
};

/**
 * Crear un nuevo contacto
 * POST /api/crm/contactos
 */
export const crearContactoApi = async (
  data: CrearContactoData
): Promise<CrearContactoResponse> => {
  return await apiService.post<CrearContactoResponse>('crm/contactos', data);
};

/**
 * Actualizar un contacto
 * PUT /api/crm/contactos/{id}
 */
export const actualizarContactoApi = async (
  id: string,
  data: ActualizarContactoData
): Promise<ActualizarContactoResponse> => {
  return await apiService.put<ActualizarContactoResponse>(`crm/contactos/${id}`, data);
};

/**
 * Eliminar un contacto (soft delete)
 * DELETE /api/crm/contactos/{id}
 */
export const eliminarContactoApi = async (
  id: string
): Promise<EliminarContactoResponse> => {
  return await apiService.delete<EliminarContactoResponse>(`crm/contactos/${id}`);
};

/**
 * Verificar si un contacto ya existe (por email o teléfono)
 * POST /api/crm/contactos/verificar-duplicado
 */
export const verificarDuplicadoContactoApi = async (
  correo?: string,
  telefono?: string
): Promise<VerificarDuplicadoResponse> => {
  return await apiService.post<VerificarDuplicadoResponse>('crm/contactos/verificar-duplicado', {
    correo,
    telefono,
  });
};

// ==================== OPORTUNIDADES ====================

import type {
  ListarOportunidadesResponse,
  ObtenerOportunidadResponse,
  CrearOportunidadData,
  CrearOportunidadResponse,
  ActualizarOportunidadData,
  ActualizarOportunidadResponse,
  EliminarOportunidadResponse,
  FiltrosListarOportunidades,
  MoverOportunidadData,
  MoverOportunidadResponse,
  AsignarOportunidadData,
  AsignarOportunidadResponse,
  ObtenerTableroOportunidadesResponse,
  ListarOportunidadesPorContactoResponse,
  ObtenerForecastResponse,
  ArchivarOportunidadData,
  ArchivarOportunidadResponse,
} from '../types/crm.types';

/**
 * Obtener el tablero Kanban de oportunidades
 * GET /api/crm/oportunidades/tablero/{pipelineId}
 */
export const obtenerTableroOportunidadesApi = async (
  pipelineId: string,
  soloMias?: boolean
): Promise<ObtenerTableroOportunidadesResponse> => {
  const params = soloMias ? '?soloMias=true' : '';
  return await apiService.get<ObtenerTableroOportunidadesResponse>(`crm/oportunidades/tablero/${pipelineId}${params}`);
};

/**
 * Obtener el forecast del pipeline
 * GET /api/crm/oportunidades/forecast
 * @param pipelineId - ID del pipeline (opcional, usa el default si no se especifica)
 */
export const obtenerForecastApi = async (
  pipelineId?: string
): Promise<ObtenerForecastResponse> => {
  const params = pipelineId ? `?pipelineId=${pipelineId}` : '';
  return await apiService.get<ObtenerForecastResponse>(`crm/oportunidades/forecast${params}`);
};

/**
 * Listar oportunidades con filtros y paginación
 * GET /api/crm/oportunidades
 */
export const listarOportunidadesApi = async (
  filtros?: FiltrosListarOportunidades
): Promise<ListarOportunidadesResponse> => {
  const params = new URLSearchParams();

  if (filtros?.contactoId) params.append('contactoId', filtros.contactoId);
  if (filtros?.pipelineId) params.append('pipelineId', filtros.pipelineId);
  if (filtros?.etapaId) params.append('etapaId', filtros.etapaId);
  if (filtros?.estado) params.append('estado', filtros.estado);
  if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);
  if (filtros?.soloMias) params.append('soloMias', 'true');
  if (filtros?.archivado !== undefined) params.append('archivado', filtros.archivado.toString());
  if (filtros?.pagina) params.append('pagina', filtros.pagina.toString());
  if (filtros?.limite) params.append('limite', filtros.limite.toString());
  if (filtros?.ordenarPor) params.append('ordenarPor', filtros.ordenarPor);
  if (filtros?.ordenDireccion) params.append('ordenDireccion', filtros.ordenDireccion);

  const queryString = params.toString();
  const url = queryString ? `crm/oportunidades?${queryString}` : 'crm/oportunidades';

  return await apiService.get<ListarOportunidadesResponse>(url);
};

/**
 * Obtener una oportunidad por ID
 * GET /api/crm/oportunidades/{id}
 */
export const obtenerOportunidadPorIdApi = async (
  id: string
): Promise<ObtenerOportunidadResponse> => {
  return await apiService.get<ObtenerOportunidadResponse>(`crm/oportunidades/${id}`);
};

/**
 * Crear una nueva oportunidad
 * POST /api/crm/oportunidades
 */
export const crearOportunidadApi = async (
  data: CrearOportunidadData
): Promise<CrearOportunidadResponse> => {
  return await apiService.post<CrearOportunidadResponse>('crm/oportunidades', data);
};

/**
 * Actualizar una oportunidad
 * PUT /api/crm/oportunidades/{id}
 */
export const actualizarOportunidadApi = async (
  id: string,
  data: ActualizarOportunidadData
): Promise<ActualizarOportunidadResponse> => {
  return await apiService.put<ActualizarOportunidadResponse>(`crm/oportunidades/${id}`, data);
};

/**
 * Eliminar una oportunidad (soft delete)
 * DELETE /api/crm/oportunidades/{id}
 */
export const eliminarOportunidadApi = async (
  id: string
): Promise<EliminarOportunidadResponse> => {
  return await apiService.delete<EliminarOportunidadResponse>(`crm/oportunidades/${id}`);
};

/**
 * Mover una oportunidad a otra etapa
 * PATCH /api/crm/oportunidades/{id}/mover
 */
export const moverOportunidadApi = async (
  id: string,
  data: MoverOportunidadData
): Promise<MoverOportunidadResponse> => {
  return await apiService.patch<MoverOportunidadResponse>(`crm/oportunidades/${id}/mover`, data);
};

/**
 * Asignar usuarios a una oportunidad
 * POST /api/crm/oportunidades/{id}/asignar
 */
export const asignarOportunidadApi = async (
  id: string,
  data: AsignarOportunidadData
): Promise<AsignarOportunidadResponse> => {
  return await apiService.post<AsignarOportunidadResponse>(`crm/oportunidades/${id}/asignar`, data);
};

/**
 * Desasignar usuarios de una oportunidad
 * DELETE /api/crm/oportunidades/{id}/asignar
 */
export const desasignarOportunidadApi = async (
  id: string,
  usuarioIds?: string[]
): Promise<{ success: boolean; message: string }> => {
  return await apiService.delete<{ success: boolean; message: string }>(`crm/oportunidades/${id}/asignar`, {
    data: { usuarioIds },
  });
};

/**
 * Listar oportunidades de un contacto específico
 * GET /api/crm/oportunidades/contacto/{contactoId}
 */
export const listarOportunidadesPorContactoApi = async (
  contactoId: string
): Promise<ListarOportunidadesPorContactoResponse> => {
  return await apiService.get<ListarOportunidadesPorContactoResponse>(`crm/oportunidades/contacto/${contactoId}`);
};

/**
 * Archivar o desarchivar una oportunidad
 * PATCH /api/crm/oportunidades/{id}/archivar
 */
export const archivarOportunidadApi = async (
  id: string,
  data: ArchivarOportunidadData
): Promise<ArchivarOportunidadResponse> => {
  return await apiService.patch<ArchivarOportunidadResponse>(`crm/oportunidades/${id}/archivar`, data);
};

// ==================== ENTERPRISE: SMART ENTRY ====================

import type {
  SmartEntryData,
  SmartEntryResponse,
  CrearRelacionContactoData,
  ActualizarRelacionContactoData,
  CrearRelacionResponse,
  ObtenerRelacionesResponse,
  ArbolFamiliarResponse,
  VerificarDuplicadoEnterpriseResponse,
} from '../types/crm.types';

/**
 * Smart Entry - Crear contacto(s) + relación + oportunidad en una sola operación
 * POST /api/crm/contactos/smart-entry
 */
export const smartEntryApi = async (data: SmartEntryData): Promise<SmartEntryResponse> => {
  return await apiService.post<SmartEntryResponse>('crm/contactos/smart-entry', data);
};

// ==================== ENTERPRISE: RELACIONES ENTRE CONTACTOS ====================

/**
 * Obtener relaciones de un contacto
 * GET /api/crm/contactos/:id/relaciones
 */
export const obtenerRelacionesContactoApi = async (
  contactoId: string
): Promise<ObtenerRelacionesResponse> => {
  return await apiService.get<ObtenerRelacionesResponse>(`crm/contactos/${contactoId}/relaciones`);
};

/**
 * Crear una relación entre contactos
 * POST /api/crm/contactos/:id/relaciones
 */
export const crearRelacionContactoApi = async (
  contactoId: string,
  data: CrearRelacionContactoData
): Promise<CrearRelacionResponse> => {
  return await apiService.post<CrearRelacionResponse>(`crm/contactos/${contactoId}/relaciones`, data);
};

/**
 * Actualizar una relación
 * PUT /api/crm/contactos/relaciones/:relacionId
 */
export const actualizarRelacionContactoApi = async (
  relacionId: string,
  data: ActualizarRelacionContactoData
): Promise<CrearRelacionResponse> => {
  return await apiService.put<CrearRelacionResponse>(`crm/contactos/relaciones/${relacionId}`, data);
};

/**
 * Eliminar una relación
 * DELETE /api/crm/contactos/relaciones/:relacionId
 */
export const eliminarRelacionContactoApi = async (
  relacionId: string
): Promise<{ success: boolean; message: string }> => {
  return await apiService.delete<{ success: boolean; message: string }>(`crm/contactos/relaciones/${relacionId}`);
};

/**
 * Establecer pagador default para un contacto
 * PATCH /api/crm/contactos/relaciones/:relacionId/pagador-default
 */
export const establecerPagadorDefaultApi = async (
  relacionId: string
): Promise<{ success: boolean; message: string }> => {
  return await apiService.patch<{ success: boolean; message: string }>(`crm/contactos/relaciones/${relacionId}/pagador-default`, {});
};

// ==================== ENTERPRISE: ÁRBOL FAMILIAR ====================

/**
 * Obtener árbol familiar de un contacto
 * GET /api/crm/contactos/:id/arbol
 */
export const obtenerArbolFamiliarApi = async (
  contactoId: string
): Promise<ArbolFamiliarResponse> => {
  return await apiService.get<ArbolFamiliarResponse>(`crm/contactos/${contactoId}/arbol`);
};

/**
 * Verificar duplicado (Enterprise - incluye propietario)
 * POST /api/crm/contactos/verificar-duplicado
 */
export const verificarDuplicadoEnterpriseApi = async (
  correo?: string,
  telefono?: string
): Promise<VerificarDuplicadoEnterpriseResponse> => {
  return await apiService.post<VerificarDuplicadoEnterpriseResponse>('crm/contactos/verificar-duplicado', {
    correo,
    telefono,
  });
};

// ==================== LEADS (LEGACY) ====================

/**
 * Listar leads con paginación y filtros
 * GET /api/crm/leads
 */
export const listarLeadsApi = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  etapaId?: string
): Promise<ListarLeadsResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (etapaId) params.append('etapaId', etapaId);

  return await apiService.get<ListarLeadsResponse>(`crm/leads?${params.toString()}`);
};

/**
 * Crear un nuevo lead
 * POST /api/crm/leads
 */
export const crearLeadApi = async (data: CrearLeadData): Promise<ObtenerLeadResponse> => {
  return await apiService.post<ObtenerLeadResponse>('crm/leads', data);
};

/**
 * Obtener lead por ID
 * GET /api/crm/leads/:id
 */
export const obtenerLeadPorIdApi = async (id: string): Promise<ObtenerLeadResponse> => {
  return await apiService.get<ObtenerLeadResponse>(`crm/leads/${id}`);
};

/**
 * Actualizar un lead
 * PUT /api/crm/leads/:id
 */
export const actualizarLeadApi = async (id: string, data: ActualizarLeadData): Promise<ObtenerLeadResponse> => {
  return await apiService.put<ObtenerLeadResponse>(`crm/leads/${id}`, data);
};

/**
 * Mover lead a otra etapa
 * PATCH /api/crm/leads/:id/mover
 */
export const moverLeadApi = async (id: string, data: MoverLeadData): Promise<ObtenerLeadResponse> => {
  return await apiService.patch<ObtenerLeadResponse>(`crm/leads/${id}/mover`, data);
};

/**
 * Eliminar un lead
 * DELETE /api/crm/leads/:id
 */
export const eliminarLeadApi = async (id: string): Promise<{ success: boolean; message: string }> => {
  return await apiService.delete<{ success: boolean; message: string }>(`crm/leads/${id}`);
};

/**
 * Asignar usuarios a un lead
 * POST /api/crm/leads/:id/asignar
 */
export const asignarLeadApi = async (
  id: string,
  usuarioIds: string[]
): Promise<{ success: boolean; message: string }> => {
  return await apiService.post<{ success: boolean; message: string }>(`crm/leads/${id}/asignar`, { usuarioIds });
};
