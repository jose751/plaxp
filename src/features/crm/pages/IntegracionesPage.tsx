import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPlus,
  FaTrash,
  FaArrowLeft,
  FaKey,
  FaCopy,
  FaCheck,
  FaExclamationTriangle,
  FaCode,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { listarApiKeysApi, generarApiKeyApi, revocarApiKeyApi } from '../api/crmApi';
import type { IntegracionApiKey, IntegracionApiKeyGenerada } from '../types/crm.types';

export const IntegracionesPage = () => {
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<IntegracionApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de crear
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  // Modal de API Key generada
  const [generatedKeyModalOpen, setGeneratedKeyModalOpen] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<IntegracionApiKeyGenerada | null>(null);
  const [copied, setCopied] = useState(false);

  // Modal de revocar
  const [revokeModalOpen, setRevokeModalOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<IntegracionApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  // Modal de documentación
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listarApiKeysApi();
      if (response.success && response.data) {
        setApiKeys(response.data);
      } else {
        setError('Error al cargar las API Keys');
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar las API Keys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;

    try {
      setCreating(true);
      const response = await generarApiKeyApi({ nombre: newKeyName.trim() });
      if (response.success && response.data) {
        setGeneratedKey(response.data);
        setCreateModalOpen(false);
        setNewKeyName('');
        setGeneratedKeyModalOpen(true);
        fetchApiKeys();
      } else {
        setError('Error al generar la API Key');
      }
    } catch (err: any) {
      setError(err.message || 'Error al generar la API Key');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async () => {
    if (!keyToRevoke) return;

    try {
      setRevoking(true);
      const response = await revocarApiKeyApi(keyToRevoke.id);
      if (response.success) {
        setRevokeModalOpen(false);
        setKeyToRevoke(null);
        fetchApiKeys();
      } else {
        setError('Error al revocar la API Key');
      }
    } catch (err: any) {
      setError(err.message || 'Error al revocar la API Key');
    } finally {
      setRevoking(false);
    }
  };

  const handleCopyKey = async () => {
    if (!generatedKey) return;
    try {
      await navigator.clipboard.writeText(generatedKey.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Nunca';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <CgSpinner className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/crm')}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary mb-4"
        >
          <FaArrowLeft className="w-3 h-3" />
          Volver al tablero
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              Integraciones & API Keys
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Genera API Keys para recibir leads desde fuentes externas (Facebook Ads, formularios web, Zapier, etc.)
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setDocsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-dark-hover text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-dark-border rounded-lg font-medium transition-colors w-full sm:w-auto"
            >
              <FaCode className="w-4 h-4" />
              <span className="hidden sm:inline">Ver documentacion</span>
              <span className="sm:hidden">Docs</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors shadow-sm w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4" />
              Nueva API Key
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Lista de API Keys */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border shadow-sm overflow-hidden">
        {apiKeys.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 dark:bg-dark-hover flex items-center justify-center">
              <FaKey className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              No hay API Keys
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Genera tu primera API Key para empezar a recibir leads desde fuentes externas.
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Crear API Key
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-dark-border">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className={`p-4 sm:p-5 ${
                  !apiKey.activo ? 'opacity-60 bg-neutral-50 dark:bg-dark-card/50' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Icono y nombre */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        apiKey.activo
                          ? 'bg-primary/10 text-primary'
                          : 'bg-neutral-200 dark:bg-dark-border text-neutral-400'
                      }`}
                    >
                      <FaKey className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                        {apiKey.nombre}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                        {apiKey.prefijo}...
                      </p>
                    </div>
                  </div>

                  {/* Stats y estado (desktop) */}
                  <div className="hidden sm:flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        Usos
                      </p>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {apiKey.totalUsos}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        Ultimo uso
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {formatDate(apiKey.ultimoUso)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                        Creada
                      </p>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">
                        {formatDate(apiKey.creadoEn)}
                      </p>
                    </div>

                    {/* Estado badge */}
                    {apiKey.activo ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700">
                        <FaCheckCircle className="w-3 h-3" />
                        Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700">
                        <FaTimesCircle className="w-3 h-3" />
                        Revocada
                      </span>
                    )}

                    {/* Boton revocar */}
                    {apiKey.activo && (
                      <button
                        onClick={() => {
                          setKeyToRevoke(apiKey);
                          setRevokeModalOpen(true);
                        }}
                        className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Revocar"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Movil: Stats y acciones */}
                  <div className="flex sm:hidden items-center justify-between">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-neutral-500 dark:text-neutral-400">
                        {apiKey.totalUsos} usos
                      </span>
                      {apiKey.activo ? (
                        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                          <FaCheckCircle className="w-3 h-3" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                          <FaTimesCircle className="w-3 h-3" />
                          Revocada
                        </span>
                      )}
                    </div>
                    {apiKey.activo && (
                      <button
                        onClick={() => {
                          setKeyToRevoke(apiKey);
                          setRevokeModalOpen(true);
                        }}
                        className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Revocar"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crear API Key */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                Nueva API Key
              </h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Nombre descriptivo
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ej: Facebook Ads, Formulario Web, Zapier..."
                  className="w-full px-4 py-2.5 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                  autoFocus
                />
                <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                  Usa un nombre que identifique la fuente de los leads.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setNewKeyName('');
                }}
                disabled={creating}
                className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !newKeyName.trim()}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {creating && <CgSpinner className="w-4 h-4 animate-spin" />}
                Generar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal API Key generada */}
      {generatedKeyModalOpen && generatedKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-lg mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FaCheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    API Key generada
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {generatedKey.nombre}
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <FaExclamationTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    <strong>Importante:</strong> Esta es la unica vez que veras la API Key completa.
                    Copiala y guardala en un lugar seguro.
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Tu API Key
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={generatedKey.apiKey}
                    readOnly
                    className="w-full px-4 py-3 pr-12 rounded-lg border border-neutral-300 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg font-mono text-sm text-neutral-800 dark:text-neutral-200"
                  />
                  <button
                    onClick={handleCopyKey}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-primary rounded-lg transition-colors"
                    title="Copiar"
                  >
                    {copied ? (
                      <FaCheck className="w-4 h-4 text-green-500" />
                    ) : (
                      <FaCopy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setGeneratedKeyModalOpen(false);
                  setGeneratedKey(null);
                  setCopied(false);
                }}
                className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
              >
                Ya la guarde, cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal revocar API Key */}
      {revokeModalOpen && keyToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                Revocar API Key
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Estas seguro de que deseas revocar la API Key{' '}
                <span className="font-medium">"{keyToRevoke.nombre}"</span>?
              </p>
              <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <FaExclamationTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  Esta accion es permanente. Las integraciones que usen esta API Key dejaran de funcionar inmediatamente.
                </p>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setRevokeModalOpen(false);
                  setKeyToRevoke(null);
                }}
                disabled={revoking}
                className="flex-1 px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRevoke}
                disabled={revoking}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {revoking && <CgSpinner className="w-4 h-4 animate-spin" />}
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal documentacion */}
      {docsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-neutral-200 dark:border-dark-border">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Documentacion de la API
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Como enviar leads desde fuentes externas
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {/* Endpoint */}
              <div className="mb-6">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Endpoint
                </h4>
                <code className="block p-3 bg-neutral-100 dark:bg-dark-bg rounded-lg text-sm font-mono text-neutral-800 dark:text-neutral-200">
                  POST /api/public/leads
                </code>
              </div>

              {/* Headers */}
              <div className="mb-6">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Headers requeridos
                </h4>
                <code className="block p-3 bg-neutral-100 dark:bg-dark-bg rounded-lg text-sm font-mono whitespace-pre text-neutral-800 dark:text-neutral-200">
{`Content-Type: application/json
X-API-Key: plx_tu_api_key_aqui`}
                </code>
              </div>

              {/* Body */}
              <div className="mb-6">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Body (JSON)
                </h4>
                <pre className="block p-3 bg-neutral-100 dark:bg-dark-bg rounded-lg text-sm font-mono overflow-x-auto text-neutral-800 dark:text-neutral-200">
{`{
  "contacto": {
    "nombre": "Juan",
    "apellido": "Perez",
    "telefono": "+506 8888-8888",
    "email": "juan@email.com"
  },
  "alumno": {
    "nombre": "Juanito",
    "apellido": "Perez",
    "fechaNacimiento": "2015-03-15"
  },
  "origen": "Facebook Ads",
  "notas": "Interesado en clases de piano"
}`}
                </pre>
              </div>

              {/* Campos requeridos */}
              <div className="mb-6">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Campos requeridos
                </h4>
                <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                  <li><code className="text-cyan-600 dark:text-cyan-400">contacto.nombre</code> - Nombre del contacto</li>
                  <li><code className="text-cyan-600 dark:text-cyan-400">contacto.apellido</code> - Apellido del contacto</li>
                </ul>
              </div>

              {/* Campos opcionales */}
              <div className="mb-6">
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Campos opcionales
                </h4>
                <ul className="list-disc list-inside text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
                  <li><code className="text-cyan-600 dark:text-cyan-400">contacto.telefono</code> - Telefono</li>
                  <li><code className="text-cyan-600 dark:text-cyan-400">contacto.email</code> - Correo electronico</li>
                  <li><code className="text-cyan-600 dark:text-cyan-400">alumno</code> - Datos del estudiante (si aplica)</li>
                  <li><code className="text-cyan-600 dark:text-cyan-400">origen</code> - Fuente del lead (ej: "Facebook Ads")</li>
                  <li><code className="text-cyan-600 dark:text-cyan-400">notas</code> - Notas adicionales</li>
                </ul>
              </div>

              {/* Ejemplo cURL */}
              <div>
                <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                  Ejemplo con cURL
                </h4>
                <pre className="block p-3 bg-neutral-100 dark:bg-dark-bg rounded-lg text-xs font-mono overflow-x-auto text-neutral-800 dark:text-neutral-200">
{`curl -X POST \\
  https://tu-dominio.com/api/public/leads \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: plx_tu_api_key" \\
  -d '{
    "contacto": {
      "nombre": "Juan",
      "apellido": "Perez"
    },
    "origen": "Landing Page"
  }'`}
                </pre>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => setDocsModalOpen(false)}
                className="w-full px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
