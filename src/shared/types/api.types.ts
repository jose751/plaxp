/**
 * Tipos para el manejo de API
 */

/**
 * Tipos de estados de carga
 */
export const LoadingType = {
  IDLE: 'idle',
  LOADING: 'loading',
  SAVING: 'saving',
  DELETING: 'deleting',
  UPLOADING: 'uploading',
  DOWNLOADING: 'downloading'
} as const;

export type LoadingType = typeof LoadingType[keyof typeof LoadingType];

/**
 * Estado de carga
 */
export interface LoadingState {
  type: LoadingType;
  isLoading: boolean;
  message?: string;
  progress?: number;
}

/**
 * Métodos HTTP soportados
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Configuración de una petición a la API
 */
export interface ApiRequestConfig {
  endpoint: string;
  method?: HttpMethod;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
  loadingType?: LoadingType;
  skipAuth?: boolean;
  timeout?: number;
}

/**
 * Error personalizado de la API
 */
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}
