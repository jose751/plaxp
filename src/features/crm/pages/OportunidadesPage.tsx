import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiPlus,
  HiMail,
  HiCurrencyDollar,
  HiUser,
  HiXCircle,
  HiViewBoards,
  HiCalendar,
  HiArrowLeft,
  HiArchive,
  HiX,
} from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { FaTimes, FaHandshake, FaPercentage, FaTrophy, FaThumbsDown, FaGripVertical } from 'react-icons/fa';
import {
  obtenerTableroOportunidadesApi,
  moverOportunidadApi,
  listarPipelinesApi,
  listarContactosApi,
  crearOportunidadApi,
  obtenerForecastApi,
  listarOportunidadesApi,
  archivarOportunidadApi,
} from '../api/crmApi';
import type {
  OportunidadTableroColumna,
  CrmOportunidad,
  CrmEtapa,
  CrmPipeline,
  CrmContacto,
  CrearOportunidadData,
  ForecastData,
} from '../types/crm.types';
import { TipoSistema, MOTIVOS_PERDIDA, MOTIVOS_GANADO } from '../types/crm.types';
import { usePermissions } from '../../../shared/hooks/usePermissions';

// URL del logo de WhatsApp
const WHATSAPP_LOGO = 'https://static.vecteezy.com/system/resources/previews/021/491/992/original/whatsapp-logo-tansparent-free-png.png';

const cleanPhoneForWhatsApp = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

// Estado inicial del formulario
const initialOportunidadForm = {
  contactoId: '',
  titulo: '',
  descripcion: '',
  montoEstimado: '',
  probabilidad: 0,
  fechaCierreEsperada: '',
};

export const OportunidadesPage = () => {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [columnas, setColumnas] = useState<OportunidadTableroColumna[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtro "Solo mis oportunidades"
  const [soloMias, setSoloMias] = useState(false);

  // Pipelines
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);
  const [loadingPipelines, setLoadingPipelines] = useState(true);

  // Forecast
  const [forecast, setForecast] = useState<ForecastData | null>(null);

  // Drag & Drop
  const [draggedOportunidad, setDraggedOportunidad] = useState<CrmOportunidad | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modal de nueva oportunidad
  const [modalOpen, setModalOpen] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [selectedEtapa, setSelectedEtapa] = useState<CrmEtapa | null>(null);
  const [oportunidadForm, setOportunidadForm] = useState(initialOportunidadForm);

  // Contactos para el select
  const [contactos, setContactos] = useState<CrmContacto[]>([]);
  const [contactoBusqueda, _setContactoBusqueda] = useState('');

  // Modal de motivo de pérdida/victoria
  const [motivoModalOpen, setMotivoModalOpen] = useState(false);
  const [motivoTipo, setMotivoTipo] = useState<'PERDIDA' | 'GANADA' | null>(null);
  const [oportunidadParaMotivo, setOportunidadParaMotivo] = useState<CrmOportunidad | null>(null);
  const [etapaDestino, setEtapaDestino] = useState<CrmEtapa | null>(null);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState('');

  // Modal de oportunidades archivadas
  const [archivadasModalOpen, setArchivadasModalOpen] = useState(false);
  const [oportunidadesArchivadas, setOportunidadesArchivadas] = useState<CrmOportunidad[]>([]);
  const [loadingArchivadas, setLoadingArchivadas] = useState(false);
  const [desarchivando, setDesarchivando] = useState<string | null>(null);

  // Cargar pipelines al inicio
  const fetchPipelines = useCallback(async () => {
    try {
      setLoadingPipelines(true);
      const response = await listarPipelinesApi();
      if (response.success && response.data) {
        setPipelines(response.data.filter(p => p.activo));
        const defaultPipeline = response.data.find(p => p.esDefault && p.activo) || response.data.find(p => p.activo);
        if (defaultPipeline && !selectedPipelineId) {
          setSelectedPipelineId(defaultPipeline.id);
        }
      }
    } catch (err: any) {
      console.error('Error al cargar pipelines:', err);
    } finally {
      setLoadingPipelines(false);
    }
  }, [selectedPipelineId]);

  // Cargar tablero de oportunidades
  const fetchTablero = useCallback(async (pipelineId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await obtenerTableroOportunidadesApi(pipelineId, soloMias);
      if (response.success) {
        const columnasOrdenadas = (response.data || []).sort(
          (a, b) => a.etapa.orden - b.etapa.orden
        );
        setColumnas(columnasOrdenadas);
      } else {
        setError('Error al cargar el tablero');
        setColumnas([]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar el tablero');
      setColumnas([]);
    } finally {
      setLoading(false);
    }
  }, [soloMias]);

  // Cargar forecast del pipeline
  const fetchForecast = useCallback(async (pipelineId: string) => {
    try {
      const response = await obtenerForecastApi(pipelineId);
      if (response.success) {
        setForecast(response.data);
      }
    } catch (err) {
      console.error('Error al cargar forecast:', err);
    }
  }, []);

  // Cargar contactos para el select
  const fetchContactos = useCallback(async (busqueda?: string) => {
    try {
      const response = await listarContactosApi({
        busqueda,
        limite: 20,
        activo: true,
      });
      if (response.success) {
        setContactos(response.data);
      }
    } catch (err) {
      console.error('Error al cargar contactos:', err);
    }
  }, []);

  // Cargar oportunidades archivadas
  const fetchArchivadas = useCallback(async () => {
    if (!selectedPipelineId) return;
    try {
      setLoadingArchivadas(true);
      const response = await listarOportunidadesApi({
        pipelineId: selectedPipelineId,
        archivado: true,
        limite: 100,
      });
      if (response.success) {
        setOportunidadesArchivadas(response.data);
      }
    } catch (err) {
      console.error('Error al cargar archivadas:', err);
    } finally {
      setLoadingArchivadas(false);
    }
  }, [selectedPipelineId]);

  // Desarchivar oportunidad
  const handleDesarchivar = async (oportunidadId: string) => {
    try {
      setDesarchivando(oportunidadId);
      const response = await archivarOportunidadApi(oportunidadId, { archivar: false });
      if (response.success) {
        // Remover de la lista de archivadas
        setOportunidadesArchivadas(prev => prev.filter(o => o.id !== oportunidadId));
        // Refrescar el tablero
        if (selectedPipelineId) {
          fetchTablero(selectedPipelineId);
          fetchForecast(selectedPipelineId);
        }
      }
    } catch (err) {
      console.error('Error al desarchivar:', err);
    } finally {
      setDesarchivando(null);
    }
  };

  // Abrir modal de archivadas
  const handleOpenArchivadasModal = () => {
    setArchivadasModalOpen(true);
    fetchArchivadas();
  };

  useEffect(() => {
    fetchPipelines();
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      // Limpiar forecast anterior para evitar mostrar datos del pipeline anterior
      setForecast(null);
      fetchTablero(selectedPipelineId);
      fetchForecast(selectedPipelineId);
    }
  }, [selectedPipelineId, fetchTablero, fetchForecast]);

  useEffect(() => {
    if (modalOpen) {
      fetchContactos();
    }
  }, [modalOpen, fetchContactos]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (contactoBusqueda && modalOpen) {
        fetchContactos(contactoBusqueda);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [contactoBusqueda, modalOpen, fetchContactos]);


  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, oportunidad: CrmOportunidad) => {
    setDraggedOportunidad(oportunidad);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, etapaId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(etapaId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, etapaDestino: CrmEtapa) => {
    e.preventDefault();
    setDragOverColumn(null);

    if (!draggedOportunidad || draggedOportunidad.etapaId === etapaDestino.id) {
      setDraggedOportunidad(null);
      return;
    }

    // Si la etapa destino requiere motivo (PERDIDA o GANADA)
    if (etapaDestino.tipoSistema === TipoSistema.PERDIDO) {
      setOportunidadParaMotivo(draggedOportunidad);
      setEtapaDestino(etapaDestino);
      setMotivoTipo('PERDIDA');
      setMotivoModalOpen(true);
      setDraggedOportunidad(null);
      return;
    }

    if (etapaDestino.tipoSistema === TipoSistema.GANADO) {
      setOportunidadParaMotivo(draggedOportunidad);
      setEtapaDestino(etapaDestino);
      setMotivoTipo('GANADA');
      setMotivoModalOpen(true);
      setDraggedOportunidad(null);
      return;
    }

    // Mover directamente
    try {
      await moverOportunidadApi(draggedOportunidad.id, { etapaId: etapaDestino.id });
      if (selectedPipelineId) {
        await fetchTablero(selectedPipelineId);
        await fetchForecast(selectedPipelineId);
      }
    } catch (err) {
      console.error('Error al mover oportunidad:', err);
    }

    setDraggedOportunidad(null);
  };

  const handleConfirmarMotivo = async () => {
    if (!oportunidadParaMotivo || !etapaDestino) return;

    try {
      await moverOportunidadApi(oportunidadParaMotivo.id, {
        etapaId: etapaDestino.id,
        motivoPerdida: motivoTipo === 'PERDIDA' ? motivoSeleccionado : undefined,
        motivoGanado: motivoTipo === 'GANADA' ? motivoSeleccionado : undefined,
      });
      if (selectedPipelineId) {
        await fetchTablero(selectedPipelineId);
        await fetchForecast(selectedPipelineId);
      }
    } catch (err) {
      console.error('Error al mover oportunidad:', err);
    }

    setMotivoModalOpen(false);
    setOportunidadParaMotivo(null);
    setEtapaDestino(null);
    setMotivoTipo(null);
    setMotivoSeleccionado('');
  };

  // Crear nueva oportunidad
  const handleOpenCreateModal = (etapa?: CrmEtapa) => {
    setSelectedEtapa(etapa || null);
    setOportunidadForm(initialOportunidadForm);
    setModalOpen(true);
  };

  const handleSaveOportunidad = async () => {
    if (!oportunidadForm.contactoId || !oportunidadForm.titulo.trim() || !selectedPipelineId) {
      return;
    }

    try {
      setModalSaving(true);

      const payload: CrearOportunidadData = {
        contactoId: oportunidadForm.contactoId,
        pipelineId: selectedPipelineId,
        etapaId: selectedEtapa?.id,
        titulo: oportunidadForm.titulo.trim(),
        descripcion: oportunidadForm.descripcion.trim() || undefined,
        montoEstimado: oportunidadForm.montoEstimado || undefined,
        probabilidad: oportunidadForm.probabilidad,
        fechaCierreEsperada: oportunidadForm.fechaCierreEsperada || undefined,
      };

      const response = await crearOportunidadApi(payload);
      if (response.success) {
        setModalOpen(false);
        await fetchTablero(selectedPipelineId);
        await fetchForecast(selectedPipelineId);
      }
    } catch (err) {
      console.error('Error al crear oportunidad:', err);
    } finally {
      setModalSaving(false);
    }
  };

  // Obtener color basado en tipo de etapa
  const getEtapaColor = (etapa: CrmEtapa) => {
    if (etapa.tipoSistema === TipoSistema.GANADO) return '#22C55E';
    if (etapa.tipoSistema === TipoSistema.PERDIDO) return '#EF4444';
    return etapa.color;
  };


  if (loadingPipelines) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
            <FaHandshake className="w-8 h-8 text-white" />
          </div>
          <CgSpinner className="w-8 h-8 animate-spin text-primary" />
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">Cargando oportunidades...</p>
        </div>
      </div>
    );
  }

  // Si no hay pipelines configurados
  if (pipelines.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-8 max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-dark-hover flex items-center justify-center mx-auto mb-4">
            <HiViewBoards className="w-10 h-10 text-neutral-400" />
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            No hay pipelines configurados
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            Para gestionar oportunidades necesitas crear al menos un pipeline con sus etapas.
          </p>
          <button
            onClick={() => navigate('/crm/pipelines')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/25"
          >
            <HiViewBoards className="w-5 h-5" />
            Configurar Pipelines
          </button>
        </div>
      </div>
    );
  }

  if (loading && columnas.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
            <HiViewBoards className="w-8 h-8 text-white" />
          </div>
          <CgSpinner className="w-8 h-8 animate-spin text-primary" />
          <p className="text-neutral-500 dark:text-neutral-400 font-medium">Cargando tablero...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/crm')}
          className="inline-flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-primary mb-4"
        >
          <HiArrowLeft className="w-3 h-3" />
          Volver al tablero
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                <FaHandshake className="w-6 h-6 text-white" />
              </div>
              Oportunidades
            </h1>
            {forecast && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {forecast.resumen.abiertasCount} abiertas
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-900/30 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                  <HiCurrencyDollar className="w-3.5 h-3.5" />
                  ${forecast.montoTotalPipeline.toLocaleString()} total
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                  <FaPercentage className="w-3 h-3" />
                  ${forecast.montoPonderadoTotal.toLocaleString()} ponderado
                </span>
                {forecast.resumen.ganadasCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <FaTrophy className="w-3 h-3" />
                    {forecast.resumen.ganadasCount} ganadas (${forecast.resumen.montoGanado.toLocaleString()})
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Filtro: Solo mis oportunidades */}
            <label className="flex items-center gap-2 bg-white dark:bg-dark-card border border-neutral-300 dark:border-dark-border rounded-xl px-4 py-2.5 cursor-pointer hover:border-primary/50 transition-all">
              <input
                type="checkbox"
                checked={soloMias}
                onChange={(e) => setSoloMias(e.target.checked)}
                className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30 focus:ring-2 cursor-pointer"
              />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200 whitespace-nowrap">
                Solo mías
              </span>
            </label>

            {/* Selector de Pipeline */}
            <select
              value={selectedPipelineId || ''}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
              className="px-4 py-2.5 bg-white dark:bg-dark-card border border-neutral-300 dark:border-dark-border rounded-xl text-sm text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary/20 focus:border-primary [&>option]:bg-white [&>option]:dark:bg-dark-card [&>option]:text-neutral-900 [&>option]:dark:text-neutral-100"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.nombre}
                </option>
              ))}
            </select>

            {hasPermission('crm.crear') && (
              <button
                onClick={() => handleOpenCreateModal()}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/25 w-full sm:w-auto"
              >
                <HiPlus className="w-4 h-4" />
                Nueva Oportunidad
              </button>
            )}

            <button
              onClick={() => navigate('/crm/pipelines')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-dark-hover hover:bg-neutral-200 dark:hover:bg-dark-border text-neutral-700 dark:text-neutral-300 rounded-xl transition-colors text-sm font-medium border border-neutral-200 dark:border-dark-border w-full sm:w-auto"
            >
              <HiViewBoards className="w-4 h-4" />
              Gestionar Pipelines
            </button>

            <button
              onClick={handleOpenArchivadasModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-xl transition-colors text-sm font-medium border border-amber-200 dark:border-amber-800 w-full sm:w-auto"
            >
              <HiArchive className="w-4 h-4" />
              Archivadas
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center bg-white dark:bg-dark-card rounded-2xl border border-red-200 dark:border-red-800 p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
              <HiXCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium mb-4">{error}</p>
            <button
              onClick={() => selectedPipelineId && fetchTablero(selectedPipelineId)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/25"
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : columnas.length === 0 ? (
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-dark-hover flex items-center justify-center mx-auto mb-4">
              <HiViewBoards className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              Sin etapas configuradas
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400 mb-4">
              No hay etapas configuradas para este pipeline
            </p>
            <button
              onClick={() => navigate('/crm/pipelines')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl transition-colors font-medium shadow-lg shadow-indigo-500/25"
            >
              <HiViewBoards className="w-4 h-4" />
              Configurar Pipeline
            </button>
          </div>
        </div>
      ) : (
        /* Tablero Kanban */
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max h-full">
            {columnas.map((columna) => {
              const etapaColor = getEtapaColor(columna.etapa);
              const isDragOver = dragOverColumn === columna.etapa.id;
              const isGanado = columna.etapa.tipoSistema === TipoSistema.GANADO;
              const isPerdido = columna.etapa.tipoSistema === TipoSistema.PERDIDO;

              return (
                <div
                  key={columna.etapa.id}
                  className={`
                    flex-shrink-0 w-80 flex flex-col bg-neutral-50 dark:bg-dark-bg rounded-2xl overflow-hidden
                    border-2 transition-all shadow-sm
                    ${isDragOver
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/20'
                      : 'border-neutral-200 dark:border-dark-border'
                    }
                  `}
                  onDragOver={(e) => handleDragOver(e, columna.etapa.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, columna.etapa)}
                >
                  {/* Header de la columna */}
                  <div
                    className="px-4 py-3 flex items-center justify-between border-b-2"
                    style={{
                      backgroundColor: `${etapaColor}10`,
                      borderBottomColor: etapaColor
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: etapaColor }}
                      >
                        {isGanado ? (
                          <FaTrophy className="w-4 h-4" />
                        ) : isPerdido ? (
                          <FaThumbsDown className="w-4 h-4" />
                        ) : (
                          <HiViewBoards className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">
                          {columna.etapa.nombre}
                        </span>
                        <span
                          className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: etapaColor,
                            color: 'white',
                          }}
                        >
                          {columna.total}
                        </span>
                      </div>
                    </div>
                    {hasPermission('crm.crear') && (
                      <button
                        onClick={() => handleOpenCreateModal(columna.etapa)}
                        className="p-1.5 text-neutral-400 hover:text-primary hover:bg-white dark:hover:bg-dark-hover rounded-lg transition-colors"
                      >
                        <HiPlus className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Totales de la columna */}
                  <div className="px-4 py-2.5 bg-white dark:bg-dark-card border-b border-neutral-200 dark:border-dark-border">
                    {(() => {
                      const montoTotal = parseFloat(columna.montoTotal || '0');
                      const montoPonderado = columna.oportunidades.reduce((sum, op) => {
                        const monto = op.montoEstimado ? parseFloat(op.montoEstimado) : 0;
                        return sum + (monto * op.probabilidad / 100);
                      }, 0);
                      return (
                        <div className="flex items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-dark-hover text-neutral-700 dark:text-neutral-300 font-medium">
                            <HiCurrencyDollar className="w-3.5 h-3.5" />
                            ${montoTotal.toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
                            <FaPercentage className="w-2.5 h-2.5" />
                            ${montoPonderado.toLocaleString()}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Lista de oportunidades */}
                  <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                    {columna.oportunidades.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-dark-hover flex items-center justify-center mx-auto mb-3">
                          <FaHandshake className="w-5 h-5 text-neutral-400" />
                        </div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Sin oportunidades</p>
                      </div>
                    ) : (
                      columna.oportunidades.map((oportunidad) => {
                        const monto = oportunidad.montoEstimado ? parseFloat(oportunidad.montoEstimado) : 0;
                        const montoPonderado = monto * oportunidad.probabilidad / 100;

                        // Colores según probabilidad
                        const getProbColor = () => {
                          if (oportunidad.probabilidad >= 70) return 'bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
                          if (oportunidad.probabilidad >= 40) return 'bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-800/20 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
                          return 'bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
                        };

                        return (
                          <div
                            key={oportunidad.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, oportunidad)}
                            onClick={() => navigate(`/crm/oportunidades/${oportunidad.id}`)}
                            className={`
                              group bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border cursor-pointer
                              hover:shadow-lg hover:shadow-neutral-200/50 dark:hover:shadow-black/20 hover:border-neutral-300 dark:hover:border-dark-hover transition-all
                              ${draggedOportunidad?.id === oportunidad.id ? 'opacity-50 scale-[0.98]' : ''}
                            `}
                          >
                            {/* Color bar superior */}
                            <div
                              className="h-1 rounded-t-xl"
                              style={{ backgroundColor: etapaColor }}
                            />
                            <div className="p-3">
                              {/* Header: grip, título y probabilidad */}
                              <div className="flex items-start gap-2 mb-2.5">
                                <div className="text-neutral-300 dark:text-neutral-600 mt-0.5 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                                  <FaGripVertical className="w-3 h-3" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-tight">
                                    {oportunidad.titulo}
                                  </h4>
                                </div>
                                <span
                                  className={`
                                    text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 border
                                    ${getProbColor()}
                                  `}
                                >
                                  {oportunidad.probabilidad}%
                                </span>
                              </div>

                              {/* Contacto */}
                              {oportunidad.contacto && (
                                <div className="flex items-center gap-1.5 mb-2.5 ml-5">
                                  <div className="w-5 h-5 rounded-full bg-neutral-100 dark:bg-dark-hover flex items-center justify-center">
                                    <HiUser className="w-3 h-3 text-neutral-500" />
                                  </div>
                                  <span className="text-xs text-neutral-600 dark:text-neutral-400 truncate font-medium">
                                    {oportunidad.contacto.nombreCompleto}
                                  </span>
                                </div>
                              )}

                              {/* Montos */}
                              {monto > 0 && (
                                <div className="flex items-center gap-2 text-xs mb-2.5 ml-5">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-dark-hover text-neutral-700 dark:text-neutral-300 font-semibold">
                                    <HiCurrencyDollar className="w-3 h-3" />
                                    ${monto.toLocaleString()}
                                  </span>
                                  <span className="text-neutral-300 dark:text-neutral-600">→</span>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">
                                    ${montoPonderado.toLocaleString()}
                                  </span>
                                </div>
                              )}

                              {/* Footer: acciones y fecha */}
                              <div className="flex items-center justify-between pt-2.5 border-t border-neutral-100 dark:border-dark-border ml-5">
                                <div className="flex items-center gap-1">
                                  {oportunidad.contacto?.telefono && (
                                    <a
                                      href={`https://wa.me/${cleanPhoneForWhatsApp(oportunidad.contacto.telefono)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                                    >
                                      <img src={WHATSAPP_LOGO} alt="WhatsApp" className="w-4 h-4" />
                                    </a>
                                  )}
                                  {oportunidad.contacto?.correo && (
                                    <a
                                      href={`mailto:${oportunidad.contacto.correo}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400"
                                    >
                                      <HiMail className="w-4 h-4" />
                                    </a>
                                  )}
                                </div>
                                {oportunidad.fechaCierreEsperada && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 px-2 py-0.5 rounded bg-neutral-50 dark:bg-dark-hover">
                                    <HiCalendar className="w-3 h-3" />
                                    {new Date(oportunidad.fechaCierreEsperada).toLocaleDateString('es-ES', {
                                      day: '2-digit',
                                      month: 'short',
                                    })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal de Nueva Oportunidad */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <FaHandshake className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Nueva Oportunidad
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Seleccionar Contacto */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <HiUser className="inline w-4 h-4 mr-1" />
                  Contacto <span className="text-red-500">*</span>
                </label>
                <select
                  value={oportunidadForm.contactoId}
                  onChange={(e) => setOportunidadForm(prev => ({ ...prev, contactoId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Seleccionar contacto...</option>
                  {contactos.map((contacto) => (
                    <option key={contacto.id} value={contacto.id}>
                      {contacto.nombreCompleto} {contacto.esCliente && '(Cliente)'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1">
                  <button
                    onClick={() => navigate('/crm/contactos')}
                    className="text-primary hover:underline"
                  >
                    Crear nuevo contacto
                  </button>
                </p>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <FaHandshake className="inline w-4 h-4 mr-1" />
                  Título de la oportunidad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={oportunidadForm.titulo}
                  onChange={(e) => setOportunidadForm(prev => ({ ...prev, titulo: e.target.value }))}
                  placeholder="Ej: Inscripción curso de inglés"
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Monto y Probabilidad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    <HiCurrencyDollar className="inline w-4 h-4 mr-1" />
                    Monto estimado
                  </label>
                  <input
                    type="number"
                    value={oportunidadForm.montoEstimado}
                    onChange={(e) => setOportunidadForm(prev => ({ ...prev, montoEstimado: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                    <FaPercentage className="inline w-4 h-4 mr-1" />
                    Probabilidad (%)
                  </label>
                  <input
                    type="number"
                    value={oportunidadForm.probabilidad}
                    onChange={(e) => setOportunidadForm(prev => ({ ...prev, probabilidad: parseInt(e.target.value) || 0 }))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* Fecha de cierre esperada */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  <HiCalendar className="inline w-4 h-4 mr-1" />
                  Fecha de cierre esperada
                </label>
                <input
                  type="date"
                  value={oportunidadForm.fechaCierreEsperada}
                  onChange={(e) => setOportunidadForm(prev => ({ ...prev, fechaCierreEsperada: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={oportunidadForm.descripcion}
                  onChange={(e) => setOportunidadForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => setModalOpen(false)}
                disabled={modalSaving}
                className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveOportunidad}
                disabled={modalSaving || !oportunidadForm.contactoId || !oportunidadForm.titulo.trim()}
                className="flex-1 px-4 py-2.5 text-sm bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/25"
              >
                {modalSaving && <CgSpinner className="w-4 h-4 animate-spin" />}
                <FaHandshake className="w-4 h-4" />
                Crear Oportunidad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Motivo (Perdida/Ganada) */}
      {motivoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                  motivoTipo === 'PERDIDA'
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
                    : 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/25'
                }`}>
                  {motivoTipo === 'PERDIDA' ? (
                    <FaThumbsDown className="w-5 h-5 text-white" />
                  ) : (
                    <FaTrophy className="w-5 h-5 text-white" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {motivoTipo === 'PERDIDA' ? 'Motivo de pérdida' : 'Motivo de victoria'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setMotivoModalOpen(false);
                  setOportunidadParaMotivo(null);
                  setMotivoTipo(null);
                }}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {motivoTipo === 'PERDIDA'
                  ? '¿Por qué se perdió esta oportunidad?'
                  : '¿Por qué el cliente nos eligió?'
                }
              </p>

              <div className="grid grid-cols-2 gap-2">
                {(motivoTipo === 'PERDIDA' ? MOTIVOS_PERDIDA : MOTIVOS_GANADO).map((motivo) => (
                  <button
                    key={motivo.value}
                    onClick={() => setMotivoSeleccionado(motivo.value)}
                    className={`
                      px-3 py-2.5 rounded-xl text-sm font-medium transition-all border-2
                      ${motivoSeleccionado === motivo.value
                        ? motivoTipo === 'PERDIDA'
                          ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-500 shadow-lg shadow-red-500/25'
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white border-green-500 shadow-lg shadow-green-500/25'
                        : 'bg-white dark:bg-dark-bg text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-dark-border hover:border-primary/50'
                      }
                    `}
                  >
                    {motivo.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => {
                  setMotivoModalOpen(false);
                  setOportunidadParaMotivo(null);
                  setMotivoTipo(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarMotivo}
                disabled={!motivoSeleccionado}
                className={`
                  flex-1 px-4 py-2.5 text-sm text-white rounded-xl transition-colors disabled:opacity-50 font-medium flex items-center justify-center gap-2 shadow-lg
                  ${motivoTipo === 'PERDIDA'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/25'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/25'
                  }
                `}
              >
                {motivoTipo === 'PERDIDA' ? (
                  <>
                    <FaThumbsDown className="w-4 h-4" />
                    Marcar como Perdida
                  </>
                ) : (
                  <>
                    <FaTrophy className="w-4 h-4" />
                    Marcar como Ganada
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Oportunidades Archivadas */}
      {archivadasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-dark-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                  <HiArchive className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Oportunidades Archivadas
                  </h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {oportunidadesArchivadas.length} oportunidad(es) archivada(s)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setArchivadasModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {loadingArchivadas ? (
                <div className="flex items-center justify-center py-12">
                  <CgSpinner className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : oportunidadesArchivadas.length === 0 ? (
                <div className="text-center py-12">
                  <HiArchive className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                  <p className="text-neutral-500 dark:text-neutral-400">
                    No hay oportunidades archivadas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {oportunidadesArchivadas.map((oportunidad) => (
                    <div
                      key={oportunidad.id}
                      className="bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl p-4 hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                            {oportunidad.titulo}
                          </h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            <span className="flex items-center gap-1">
                              <HiUser className="w-4 h-4" />
                              {oportunidad.contacto?.nombreCompleto || 'Sin contacto'}
                            </span>
                            {oportunidad.montoEstimado && (
                              <span className="flex items-center gap-1">
                                <HiCurrencyDollar className="w-4 h-4" />
                                ${parseFloat(oportunidad.montoEstimado).toLocaleString()}
                              </span>
                            )}
                          </div>
                          {oportunidad.fechaArchivado && (
                            <p className="text-xs text-neutral-400 mt-1">
                              Archivada: {new Date(oportunidad.fechaArchivado).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/crm/oportunidades/${oportunidad.id}`)}
                            className="px-3 py-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-lg transition-colors"
                          >
                            Ver detalle
                          </button>
                          <button
                            onClick={() => handleDesarchivar(oportunidad.id)}
                            disabled={desarchivando === oportunidad.id}
                            className="px-3 py-1.5 text-sm bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            {desarchivando === oportunidad.id ? (
                              <CgSpinner className="w-4 h-4 animate-spin" />
                            ) : (
                              <HiArchive className="w-4 h-4" />
                            )}
                            Desarchivar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 dark:border-dark-border">
              <button
                onClick={() => setArchivadasModalOpen(false)}
                className="w-full px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
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
