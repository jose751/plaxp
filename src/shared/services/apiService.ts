/**
 * Servicio centralizado para consumir la API
 *
 * Este servicio maneja:
 * - Autenticación con tokens
 * - Manejo de errores
 * - Reintentos automáticos
 * - Timeout configurable
 * - Interceptores de request/response
 */

import {
  type ApiRequestConfig,
  ApiError,
  LoadingType,
} from '../types/api.types';
import { API_BASE_URL, COMMON_HEADERS, API_TIMEOUTS } from '../config/api.config';

// Callback para manejar errores de autenticación
type AuthErrorCallback = () => void;

/**
 * Clase principal del servicio de API
 */
class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private onAuthError: AuthErrorCallback | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = { ...COMMON_HEADERS };
  }

  /**
   * Registrar callback para errores de autenticación
   */
  setAuthErrorCallback(callback: AuthErrorCallback) {
    this.onAuthError = callback;
  }

  /**
   * Obtener el token de autenticación desde las cookies
   */
  private getAuthToken(): string | null {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
    return tokenCookie ? tokenCookie.split('=')[1] : null;
  }

  /**
   * Construir headers para la petición
   */
  private buildHeaders(config: ApiRequestConfig): Record<string, string> {
    const headers = {
      ...this.defaultHeaders,
      ...config.headers,
    };

    // Agregar token de autenticación si no es un endpoint público
    if (!config.skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Construir URL completa con query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}/${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Manejar respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Intentar parsear como JSON
    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      // Si no es JSON, usar el texto
      data = await response.text();
    }

    // Si la respuesta es exitosa
    if (response.ok) {
      return data;
    }

    // Detectar errores de autenticación
    const isAuthError =
      response.status === 401 ||
      response.status === 403 ||
      data?.message?.toLowerCase().includes('token') ||
      data?.message?.toLowerCase().includes('sesión') ||
      data?.message?.toLowerCase().includes('autenticación') ||
      data?.message?.toLowerCase().includes('no autorizado');

    // Si es un error de autenticación, llamar al callback
    if (isAuthError && this.onAuthError) {
      console.warn('🔒 Error de autenticación detectado, cerrando sesión...');
      // Ejecutar callback de manera asíncrona para no bloquear
      setTimeout(() => this.onAuthError?.(), 0);
    }

    // Si hay error, lanzar ApiError personalizado
    throw new ApiError(
      response.status,
      data?.error?.code || 'UNKNOWN_ERROR',
      data?.error?.message || data?.message || 'Error desconocido',
      data?.error?.details
    );
  }

  /**
   * Realizar petición HTTP
   */
  private async request<T>(config: ApiRequestConfig): Promise<T> {
    const {
      endpoint,
      method = 'GET',
      data,
      params,
    } = config;

    const url = this.buildURL(endpoint, params);
    const headers = this.buildHeaders(config);

    // Debug: log de la petición
    console.log('📡 API Request:', {
      method,
      endpoint,
      url,
      data,
      headers,
      cookies: document.cookie,
    });

    // Determinar timeout según el tipo de operación
    const timeout = config.loadingType === LoadingType.UPLOADING
      ? API_TIMEOUTS.upload
      : config.loadingType === LoadingType.DOWNLOADING
      ? API_TIMEOUTS.download
      : API_TIMEOUTS.default;

    // Crear AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
        credentials: 'include', // Enviar cookies automáticamente
      });

      clearTimeout(timeoutId);

      // Debug: log de la respuesta
      console.log('📡 API Response:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      // Debug: log del error
      console.error('📡 API Error:', {
        endpoint,
        error,
      });

      // Manejar errores de red o timeout
      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError(408, 'TIMEOUT', 'La petición ha excedido el tiempo límite');
        }

        throw new ApiError(0, 'NETWORK_ERROR', error.message);
      }

      throw new ApiError(0, 'UNKNOWN_ERROR', 'Error desconocido');
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>, config?: Partial<ApiRequestConfig>): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'GET',
      params,
      loadingType: LoadingType.LOADING,
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'POST',
      data,
      loadingType: LoadingType.SAVING,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'PUT',
      data,
      loadingType: LoadingType.SAVING,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, config?: Partial<ApiRequestConfig>): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'PATCH',
      data,
      loadingType: LoadingType.SAVING,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, config?: Partial<ApiRequestConfig>): Promise<T> {
    return this.request<T>({
      endpoint,
      method: 'DELETE',
      loadingType: LoadingType.DELETING,
      ...config,
    });
  }

  /**
   * Upload file (POST)
   */
  async upload<T>(endpoint: string, formData: FormData, config?: Partial<ApiRequestConfig>): Promise<T> {
    return this.uploadWithMethod<T>('POST', endpoint, formData, config);
  }

  /**
   * Upload file (PUT)
   */
  async uploadPut<T>(endpoint: string, formData: FormData, config?: Partial<ApiRequestConfig>): Promise<T> {
    return this.uploadWithMethod<T>('PUT', endpoint, formData, config);
  }

  /**
   * Upload file with specified HTTP method
   */
  private async uploadWithMethod<T>(
    method: 'POST' | 'PUT',
    endpoint: string,
    formData: FormData,
    config?: Partial<ApiRequestConfig>
  ): Promise<T> {
    const url = this.buildURL(endpoint, config?.params);
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      ...(config?.headers || {}),
    };

    if (token && !config?.skipAuth) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // No establecer Content-Type para FormData, el browser lo hace automáticamente

    // Debug: log detallado del upload
    console.log('📤 UPLOAD Request:', {
      method,
      endpoint,
      url,
      timeout: `${API_TIMEOUTS.upload / 1000}s`,
      hasAuth: !!token,
      formDataKeys: Array.from(formData.keys()),
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUTS.upload);

    const startTime = Date.now();

    try {
      console.log('⏳ Iniciando upload...');

      const response = await fetch(url, {
        method,
        headers,
        body: formData,
        signal: controller.signal,
        credentials: 'include', // Enviar cookies automáticamente
      });

      clearTimeout(timeoutId);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ Upload completado en ${duration}s`, {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      clearTimeout(timeoutId);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ Upload falló después de ${duration}s:`, error);

      // Manejar timeout específicamente
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(408, 'UPLOAD_TIMEOUT', `El upload excedió el tiempo límite de ${API_TIMEOUTS.upload / 1000}s`);
      }

      throw error;
    }
  }
}

// Exportar instancia singleton
export const apiService = new ApiService();

// Exportar clase para testing o instancias personalizadas
export default ApiService;
