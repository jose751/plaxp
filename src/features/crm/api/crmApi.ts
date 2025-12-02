import { apiService } from '../../../shared/services/apiService';
import type {
  ListarEtapasResponse,
  CrearEtapaData,
  CrearEtapaResponse,
  ActualizarEtapaData,
  ActualizarEtapaResponse,
  ObtenerEtapaResponse,
  EliminarEtapaResponse,
  ObtenerTableroResponse,
  CrearLeadData,
  CrearLeadResponse,
  ActualizarLeadData,
  ActualizarLeadResponse,
  EliminarLeadResponse,
  MoverLeadData,
  MoverLeadResponse,
  ListarLeadsResponse,
  ObtenerLeadResponse,
  FiltrosListarLeads,
  CrearActividadData,
  CrearActividadResponse,
  ObtenerTimelineResponse,
  AsignarLeadData,
  AsignarLeadResponse,
  ActualizarActividadData,
  ActualizarActividadResponse,
} from '../types/crm.types';

// ==================== ETAPAS ====================

/**
 * Listar todas las etapas del pipeline
 * GET /api/crm/etapas
 */
export const listarEtapasApi = async (): Promise<ListarEtapasResponse> => {
  return await apiService.get<ListarEtapasResponse>('crm/etapas');
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
 */
export const obtenerTableroApi = async (): Promise<ObtenerTableroResponse> => {
  return await apiService.get<ObtenerTableroResponse>('crm/tablero');
};

// ==================== LEADS ====================

/**
 * Crear un nuevo lead
 * POST /api/crm/leads
 */
export const crearLeadApi = async (
  data: CrearLeadData
): Promise<CrearLeadResponse> => {
  return await apiService.post<CrearLeadResponse>('crm/leads', data);
};

/**
 * Actualizar un lead
 * PUT /api/crm/leads/{id}
 */
export const actualizarLeadApi = async (
  id: string,
  data: ActualizarLeadData
): Promise<ActualizarLeadResponse> => {
  return await apiService.put<ActualizarLeadResponse>(`crm/leads/${id}`, data);
};

/**
 * Eliminar un lead
 * DELETE /api/crm/leads/{id}
 */
export const eliminarLeadApi = async (
  id: string
): Promise<EliminarLeadResponse> => {
  return await apiService.delete<EliminarLeadResponse>(`crm/leads/${id}`);
};

/**
 * Mover un lead a otra etapa
 * PATCH /api/crm/leads/{id}/mover
 */
export const moverLeadApi = async (
  id: string,
  data: MoverLeadData
): Promise<MoverLeadResponse> => {
  return await apiService.patch<MoverLeadResponse>(`crm/leads/${id}/mover`, data);
};

/**
 * Listar leads con filtros y paginación
 * GET /api/crm/leads
 */
export const listarLeadsApi = async (
  filtros?: FiltrosListarLeads
): Promise<ListarLeadsResponse> => {
  const params = new URLSearchParams();

  if (filtros?.soloMisLeads) params.append('soloMisLeads', 'true');
  if (filtros?.etapaId) params.append('etapaId', filtros.etapaId);
  if (filtros?.origen) params.append('origen', filtros.origen);
  if (filtros?.busqueda) params.append('busqueda', filtros.busqueda);
  if (filtros?.pagina) params.append('pagina', filtros.pagina.toString());
  if (filtros?.limite) params.append('limite', filtros.limite.toString());

  const queryString = params.toString();
  const url = queryString ? `crm/leads?${queryString}` : 'crm/leads';

  return await apiService.get<ListarLeadsResponse>(url);
};

/**
 * Obtener un lead por ID
 * GET /api/crm/leads/{id}
 */
export const obtenerLeadPorIdApi = async (
  id: string
): Promise<ObtenerLeadResponse> => {
  return await apiService.get<ObtenerLeadResponse>(`crm/leads/${id}`);
};

/**
 * Asignar usuarios a un lead
 * POST /api/crm/leads/{id}/asignar
 */
export const asignarLeadApi = async (
  id: string,
  data: AsignarLeadData
): Promise<AsignarLeadResponse> => {
  return await apiService.post<AsignarLeadResponse>(`crm/leads/${id}/asignar`, data);
};

// ==================== ACTIVIDADES ====================

/**
 * Crear una actividad en el timeline de un lead
 * POST /api/crm/leads/{id}/actividades
 */
export const crearActividadApi = async (
  leadId: string,
  data: CrearActividadData
): Promise<CrearActividadResponse> => {
  return await apiService.post<CrearActividadResponse>(`crm/leads/${leadId}/actividades`, data);
};

/**
 * Obtener el timeline de actividades de un lead
 * GET /api/crm/leads/{id}/timeline
 */
export const obtenerTimelineApi = async (
  leadId: string
): Promise<ObtenerTimelineResponse> => {
  return await apiService.get<ObtenerTimelineResponse>(`crm/leads/${leadId}/timeline`);
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
 * Obtener actividades pendientes del usuario actual
 * GET /api/crm/actividades/pendientes
 */
export const obtenerMisPendientesApi = async (): Promise<ObtenerTimelineResponse> => {
  return await apiService.get<ObtenerTimelineResponse>('crm/actividades/pendientes');
};
