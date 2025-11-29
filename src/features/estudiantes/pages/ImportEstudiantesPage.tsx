import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload, FaFileExcel, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaArrowRight, FaDownload, FaTrash, FaExclamationTriangle } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import * as XLSX from 'xlsx';
import { obtenerTodasSucursalesApi } from '../../sucursales/api/sucursalesApi';
import type { Sucursal } from '../../sucursales/types/sucursal.types';
import { cargaMasivaEstudiantesApi } from '../api/estudiantesApi';
import type { EstudianteMasivoData, EstudianteFallido, Estudiante } from '../types/estudiante.types';

// Campos requeridos y opcionales
const REQUIRED_FIELDS = [
  { key: 'nombre', label: 'Nombre', aliases: ['nombre', 'name', 'primer nombre', 'first name', 'nombres'] },
  { key: 'primerApellido', label: 'Primer Apellido', aliases: ['primer apellido', 'primer_apellido', 'apellido1', 'apellido', 'last name', 'surname'] },
  { key: 'correo', label: 'Correo Electrónico', aliases: ['correo', 'email', 'correo electronico', 'e-mail', 'mail'] },
];

const OPTIONAL_FIELDS = [
  { key: 'segundoApellido', label: 'Segundo Apellido', aliases: ['segundo apellido', 'segundo_apellido', 'apellido2'] },
  { key: 'identificacion', label: 'Número de Identificación', aliases: ['identificacion', 'numero_identificacion', 'cedula', 'dni', 'id', 'documento', 'num_identificacion'] },
  { key: 'fechaNacimiento', label: 'Fecha de Nacimiento', aliases: ['fecha nacimiento', 'fecha_nacimiento', 'birthdate', 'birth date', 'nacimiento'] },
  { key: 'telefono', label: 'Teléfono', aliases: ['telefono', 'phone', 'tel', 'celular', 'movil'] },
  { key: 'direccion', label: 'Dirección', aliases: ['direccion', 'address', 'domicilio'] },
];

const ALL_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

// Normalizar texto para comparación
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

// Detectar mapeo automático de columnas
const detectColumnMapping = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};

  headers.forEach((header) => {
    const normalizedHeader = normalizeText(header);

    for (const field of ALL_FIELDS) {
      const matchFound = field.aliases.some((alias) => {
        const normalizedAlias = normalizeText(alias);
        return normalizedHeader === normalizedAlias || normalizedHeader.includes(normalizedAlias);
      });

      if (matchFound && !Object.values(mapping).includes(field.key)) {
        mapping[header] = field.key;
        break;
      }
    }
  });

  return mapping;
};

interface ImportRow {
  rowNumber: number;
  data: Record<string, any>;
  isValid: boolean;
  errors: string[];
}

interface ImportResults {
  exitosos: Estudiante[];
  fallidos: EstudianteFallido[];
  totalProcesados: number;
  totalExitosos: number;
  totalFallidos: number;
  message: string;
}

export const ImportEstudiantesPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [selectedSucursal, setSelectedSucursal] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingSucursales, setLoadingSucursales] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResults | null>(null);
  const [previewData, setPreviewData] = useState<ImportRow[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Cargar sucursales
  const loadSucursales = useCallback(async () => {
    setLoadingSucursales(true);
    try {
      const response = await obtenerTodasSucursalesApi();
      if (response.success) {
        setSucursales(response.data);
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    } finally {
      setLoadingSucursales(false);
    }
  }, []);

  // Procesar archivo
  const processFile = async (selectedFile: File) => {
    setLoading(true);
    setFile(selectedFile);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        alert('El archivo debe tener al menos una fila de encabezados y una fila de datos');
        setLoading(false);
        return;
      }

      const fileHeaders = jsonData[0].map(String);
      const dataRows = jsonData.slice(1).map((row) => {
        const rowData: Record<string, any> = {};
        fileHeaders.forEach((header, index) => {
          rowData[header] = row[index] ?? '';
        });
        return rowData;
      }).filter((row) => Object.values(row).some((val) => val !== ''));

      setHeaders(fileHeaders);
      setRawData(dataRows);

      // Detectar mapeo automático
      const detectedMapping = detectColumnMapping(fileHeaders);
      setColumnMapping(detectedMapping);

      // Cargar sucursales
      await loadSucursales();

      setCurrentStep(2);
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      alert('Error al procesar el archivo. Asegúrese de que sea un archivo Excel válido.');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambio de archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  // Manejar drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls') || droppedFile.name.endsWith('.csv'))) {
      processFile(droppedFile);
    } else {
      alert('Por favor, seleccione un archivo Excel (.xlsx, .xls) o CSV');
    }
  };

  // Actualizar mapeo de columna
  const updateMapping = (header: string, fieldKey: string) => {
    setColumnMapping((prev) => {
      const newMapping = { ...prev };

      // Eliminar mapeo anterior si existe
      Object.keys(newMapping).forEach((key) => {
        if (newMapping[key] === fieldKey) {
          delete newMapping[key];
        }
      });

      if (fieldKey) {
        newMapping[header] = fieldKey;
      } else {
        delete newMapping[header];
      }

      return newMapping;
    });
  };

  // Validar mapeo antes de continuar
  const validateMapping = (): boolean => {
    const mappedFields = Object.values(columnMapping);
    const missingRequired = REQUIRED_FIELDS.filter((field) => !mappedFields.includes(field.key));

    if (missingRequired.length > 0) {
      alert(`Faltan campos requeridos: ${missingRequired.map((f) => f.label).join(', ')}`);
      return false;
    }

    if (!selectedSucursal) {
      alert('Debe seleccionar una sucursal');
      return false;
    }

    return true;
  };

  // Generar preview de datos
  const generatePreview = () => {
    if (!validateMapping()) return;

    const preview: ImportRow[] = rawData.map((row, index) => {
      const mappedData: Record<string, any> = {};
      const errors: string[] = [];

      // Mapear datos
      Object.entries(columnMapping).forEach(([header, fieldKey]) => {
        mappedData[fieldKey] = row[header];
      });

      // Validar campos requeridos
      REQUIRED_FIELDS.forEach((field) => {
        if (!mappedData[field.key] || String(mappedData[field.key]).trim() === '') {
          errors.push(`${field.label} es requerido`);
        }
      });

      // Validar formato de correo
      if (mappedData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mappedData.correo)) {
        errors.push('Correo electrónico inválido');
      }

      return {
        rowNumber: index + 2, // +2 porque la fila 1 es el encabezado y empezamos en 0
        data: mappedData,
        isValid: errors.length === 0,
        errors,
      };
    });

    setPreviewData(preview);
    setCurrentStep(3);
  };

  // Importar estudiantes usando el endpoint masivo
  const handleImport = async () => {
    setImporting(true);

    try {
      const validRows = previewData.filter((row) => row.isValid);

      // Preparar datos para el endpoint masivo
      const estudiantes: EstudianteMasivoData[] = validRows.map((row) => ({
        nombre: String(row.data.nombre || '').trim(),
        primerApellido: String(row.data.primerApellido || '').trim(),
        segundoApellido: row.data.segundoApellido ? String(row.data.segundoApellido).trim() : undefined,
        correo: String(row.data.correo || '').trim(),
        telefono: row.data.telefono ? String(row.data.telefono).trim() : undefined,
        fechaNacimiento: row.data.fechaNacimiento ? String(row.data.fechaNacimiento).trim() : undefined,
        identificacion: row.data.identificacion ? String(row.data.identificacion).trim() : undefined,
        direccion: row.data.direccion ? String(row.data.direccion).trim() : undefined,
        idSucursal: selectedSucursal,
      }));

      // Llamar al endpoint masivo
      const response = await cargaMasivaEstudiantesApi(estudiantes);

      setImportResults({
        exitosos: response.data.exitosos,
        fallidos: response.data.fallidos,
        totalProcesados: response.data.totalProcesados,
        totalExitosos: response.data.totalExitosos,
        totalFallidos: response.data.totalFallidos,
        message: response.message,
      });

      setCurrentStep(4);
    } catch (error: any) {
      console.error('Error en carga masiva:', error);
      alert(`Error al importar: ${error.message || 'Error desconocido'}`);
    } finally {
      setImporting(false);
    }
  };

  // Descargar plantilla
  const downloadTemplate = () => {
    const templateData = [
      {
        nombre: 'Juan',
        primer_apellido: 'Pérez',
        segundo_apellido: 'García',
        numero_identificacion: '123456789',
        correo: 'juan@ejemplo.com',
        telefono: '88887777',
        fecha_nacimiento: '1990-01-15',
        direccion: 'San José, Costa Rica',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Estudiantes');

    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 25 },
      { wch: 12 },
      { wch: 15 },
      { wch: 30 },
    ];

    XLSX.writeFile(workbook, 'plantilla_estudiantes.xlsx');
  };

  // Resetear todo
  const resetImport = () => {
    setCurrentStep(1);
    setFile(null);
    setHeaders([]);
    setRawData([]);
    setColumnMapping({});
    setSelectedSucursal('');
    setPreviewData([]);
    setImportResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Obtener campo mapeado para un header
  const getMappedField = (header: string): string => {
    return columnMapping[header] || '';
  };

  // Obtener campos disponibles para mapear
  const getAvailableFields = (currentHeader: string): { key: string; label: string; required: boolean }[] => {
    const mappedFields = Object.entries(columnMapping)
      .filter(([h]) => h !== currentHeader)
      .map(([, field]) => field);

    return ALL_FIELDS.map((field) => ({
      key: field.key,
      label: field.label,
      required: REQUIRED_FIELDS.some((f) => f.key === field.key),
    })).filter((field) => !mappedFields.includes(field.key));
  };

  return (
    <div className="w-full font-sans px-2 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
          <div className="h-10 w-1.5 bg-gradient-to-b from-primary to-purple-600 rounded-full"></div>
          Importar Estudiantes
        </h1>
        <button
          onClick={() => navigate('/estudiantes')}
          className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          Volver
        </button>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[
            { step: 1, label: 'Subir Archivo' },
            { step: 2, label: 'Mapear Columnas' },
            { step: 3, label: 'Vista Previa' },
            { step: 4, label: 'Resultados' },
          ].map(({ step, label }, index) => (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    currentStep >= step
                      ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg'
                      : 'bg-neutral-200 dark:bg-dark-border text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {currentStep > step ? <FaCheckCircle className="w-5 h-5" /> : step}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    currentStep >= step ? 'text-primary' : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {index < 3 && (
                <div
                  className={`w-16 sm:w-24 h-1 mx-2 rounded-full transition-all ${
                    currentStep > step ? 'bg-primary' : 'bg-neutral-200 dark:bg-dark-border'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content Card */}
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-100 dark:border-dark-border overflow-hidden">
        {/* Step 1: Upload File */}
        {currentStep === 1 && (
          <div className="p-8">
            <div className="max-w-xl mx-auto">
              <div className="text-center mb-6">
                <FaFileExcel className="w-16 h-16 mx-auto text-green-500 mb-4" />
                <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                  Subir archivo de estudiantes
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Seleccione un archivo Excel (.xlsx, .xls) o CSV con los datos de los estudiantes
                </p>
              </div>

              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-neutral-300 dark:border-dark-border hover:border-primary hover:bg-primary/5'
                }`}
              >
                {loading ? (
                  <div className="flex flex-col items-center">
                    <CgSpinner className="w-12 h-12 text-primary animate-spin mb-4" />
                    <p className="text-neutral-600 dark:text-neutral-400">Procesando archivo...</p>
                  </div>
                ) : (
                  <>
                    <FaUpload className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                    <p className="text-neutral-700 dark:text-neutral-300 font-medium mb-2">
                      Arrastra tu archivo aquí o haz clic para seleccionar
                    </p>
                    <p className="text-neutral-500 dark:text-neutral-500 text-sm">
                      Formatos aceptados: .xlsx, .xls, .csv
                    </p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Download Template */}
              <div className="mt-6 text-center">
                <button
                  onClick={downloadTemplate}
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                >
                  <FaDownload className="w-4 h-4" />
                  Descargar plantilla de ejemplo
                </button>
              </div>

              {/* Field Info */}
              <div className="mt-8 p-4 bg-neutral-50 dark:bg-dark-bg rounded-xl">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  Campos del archivo
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">
                      Requeridos
                    </h4>
                    <ul className="space-y-1">
                      {REQUIRED_FIELDS.map((field) => (
                        <li key={field.key} className="text-sm text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                          {field.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2">
                      Opcionales
                    </h4>
                    <ul className="space-y-1">
                      {OPTIONAL_FIELDS.map((field) => (
                        <li key={field.key} className="text-sm text-neutral-600 dark:text-neutral-400 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full"></span>
                          {field.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Map Columns */}
        {currentStep === 2 && (
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Mapear columnas
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Asocia las columnas de tu archivo con los campos del sistema. Se detectaron {headers.length} columnas y {rawData.length} filas.
              </p>
            </div>

            {/* File Info */}
            <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl mb-6">
              <FaFileExcel className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-medium text-neutral-900 dark:text-neutral-100">{file?.name}</p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {rawData.length} registros encontrados
                </p>
              </div>
              <button
                onClick={resetImport}
                className="ml-auto p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Eliminar archivo"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>

            {/* Sucursal Selection */}
            <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <label className="block text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Sucursal destino <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedSucursal}
                onChange={(e) => setSelectedSucursal(e.target.value)}
                disabled={loadingSucursales}
                className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-neutral-900 dark:text-neutral-100"
              >
                <option value="">Seleccionar sucursal...</option>
                {sucursales.map((sucursal) => (
                  <option key={sucursal.id} value={sucursal.id}>
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
                Todos los estudiantes importados serán asignados a esta sucursal
              </p>
            </div>

            {/* Column Mapping */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 p-3 bg-neutral-100 dark:bg-dark-border rounded-lg font-semibold text-sm text-neutral-700 dark:text-neutral-300">
                <span>Columna del archivo</span>
                <span>Campo del sistema</span>
              </div>
              {headers.map((header) => (
                <div
                  key={header}
                  className="grid grid-cols-2 gap-4 p-3 bg-white dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-lg items-center"
                >
                  <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate" title={header}>
                    {header}
                  </span>
                  <select
                    value={getMappedField(header)}
                    onChange={(e) => updateMapping(header, e.target.value)}
                    className={`px-3 py-2 bg-neutral-50 dark:bg-dark-card border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm ${
                      getMappedField(header)
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : 'border-neutral-300 dark:border-dark-border'
                    }`}
                  >
                    <option value="">-- No importar --</option>
                    {getAvailableFields(header).map((field) => (
                      <option key={field.key} value={field.key}>
                        {field.label} {field.required ? '*' : ''}
                      </option>
                    ))}
                    {getMappedField(header) && (
                      <option value={getMappedField(header)}>
                        {ALL_FIELDS.find((f) => f.key === getMappedField(header))?.label}{' '}
                        {REQUIRED_FIELDS.some((f) => f.key === getMappedField(header)) ? '*' : ''}
                      </option>
                    )}
                  </select>
                </div>
              ))}
            </div>

            {/* Mapping Summary */}
            <div className="mt-6 p-4 bg-neutral-50 dark:bg-dark-bg rounded-xl">
              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Estado del mapeo</h4>
              <div className="flex flex-wrap gap-2">
                {REQUIRED_FIELDS.map((field) => {
                  const isMapped = Object.values(columnMapping).includes(field.key);
                  return (
                    <span
                      key={field.key}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        isMapped
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}
                    >
                      {isMapped ? <FaCheckCircle className="w-3 h-3" /> : <FaTimesCircle className="w-3 h-3" />}
                      {field.label}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={resetImport}
                className="px-6 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-hover transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={generatePreview}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                Continuar
                <FaArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {currentStep === 3 && (
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                Vista previa de importación
              </h2>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Revisa los datos antes de importar. Se encontraron{' '}
                <span className="font-semibold text-green-600">{previewData.filter((r) => r.isValid).length}</span> registros válidos y{' '}
                <span className="font-semibold text-red-600">{previewData.filter((r) => !r.isValid).length}</span> con errores.
              </p>
            </div>

            {/* Preview Table */}
            <div className="overflow-auto max-h-96 border border-neutral-200 dark:border-dark-border rounded-xl">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100 dark:bg-dark-border sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Fila</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Nombre</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Apellidos</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Identificación</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Correo</th>
                    <th className="px-4 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300">Errores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-dark-border">
                  {previewData.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? 'bg-white dark:bg-dark-card' : 'bg-red-50 dark:bg-red-900/10'}
                    >
                      <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">{row.rowNumber}</td>
                      <td className="px-4 py-3">
                        {row.isValid ? (
                          <FaCheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <FaTimesCircle className="w-5 h-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{row.data.nombre}</td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">
                        {row.data.primerApellido} {row.data.segundoApellido || ''}
                      </td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{row.data.identificacion}</td>
                      <td className="px-4 py-3 text-neutral-900 dark:text-neutral-100">{row.data.correo}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400 text-xs">
                        {row.errors.join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                <p className="text-2xl font-bold text-green-600">{previewData.filter((r) => r.isValid).length}</p>
                <p className="text-sm text-green-700 dark:text-green-400">Registros válidos para importar</p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-2xl font-bold text-red-600">{previewData.filter((r) => !r.isValid).length}</p>
                <p className="text-sm text-red-700 dark:text-red-400">Registros con errores (no se importarán)</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-hover transition-colors flex items-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                Volver
              </button>
              <button
                onClick={handleImport}
                disabled={importing || previewData.filter((r) => r.isValid).length === 0}
                className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <CgSpinner className="w-5 h-5 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <FaUpload className="w-4 h-4" />
                    Importar {previewData.filter((r) => r.isValid).length} estudiantes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Results */}
        {currentStep === 4 && importResults && (
          <div className="p-8">
            <div className="max-w-2xl mx-auto">
              {/* Header con resultado */}
              {importResults.totalFallidos === 0 ? (
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    Importación completada
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {importResults.message}
                  </p>
                </div>
              ) : importResults.totalExitosos > 0 ? (
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaExclamationTriangle className="w-10 h-10 text-yellow-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    Importación parcial
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {importResults.message}
                  </p>
                </div>
              ) : (
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTimesCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
                    Error en importación
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400">
                    {importResults.message}
                  </p>
                </div>
              )}

              {/* Results Summary */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="p-4 bg-neutral-50 dark:bg-dark-bg rounded-xl text-center">
                  <p className="text-3xl font-bold text-neutral-700 dark:text-neutral-300">{importResults.totalProcesados}</p>
                  <p className="text-sm text-neutral-500">Procesados</p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{importResults.totalExitosos}</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Exitosos</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center">
                  <p className="text-3xl font-bold text-red-600">{importResults.totalFallidos}</p>
                  <p className="text-sm text-red-700 dark:text-red-400">Fallidos</p>
                </div>
              </div>

              {/* Estudiantes exitosos */}
              {importResults.exitosos.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                    <FaCheckCircle className="w-4 h-4 text-green-500" />
                    Estudiantes creados exitosamente ({importResults.exitosos.length})
                  </h4>
                  <div className="max-h-48 overflow-auto border border-green-200 dark:border-green-800 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-green-50 dark:bg-green-900/20 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-green-700 dark:text-green-400">Nombre</th>
                          <th className="px-4 py-2 text-left font-medium text-green-700 dark:text-green-400">Correo</th>
                          <th className="px-4 py-2 text-left font-medium text-green-700 dark:text-green-400">Usuario</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-100 dark:divide-green-900/30">
                        {importResults.exitosos.map((est) => (
                          <tr key={est.id} className="bg-white dark:bg-dark-card">
                            <td className="px-4 py-2 text-neutral-900 dark:text-neutral-100">
                              {est.nombre} {est.primerApellido}
                            </td>
                            <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{est.correo}</td>
                            <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{est.nombreUsuario}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Estudiantes fallidos */}
              {importResults.fallidos.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-2">
                    <FaTimesCircle className="w-4 h-4 text-red-500" />
                    Estudiantes con errores ({importResults.fallidos.length})
                  </h4>
                  <div className="max-h-48 overflow-auto border border-red-200 dark:border-red-800 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-red-50 dark:bg-red-900/20 sticky top-0">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-red-700 dark:text-red-400">#</th>
                          <th className="px-4 py-2 text-left font-medium text-red-700 dark:text-red-400">Datos</th>
                          <th className="px-4 py-2 text-left font-medium text-red-700 dark:text-red-400">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100 dark:divide-red-900/30">
                        {importResults.fallidos.map((fallido, idx) => (
                          <tr key={idx} className="bg-white dark:bg-dark-card">
                            <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{fallido.indice + 1}</td>
                            <td className="px-4 py-2 text-neutral-900 dark:text-neutral-100">
                              {fallido.datos.nombre} {fallido.datos.primerApellido}
                              {fallido.datos.correo && <span className="text-neutral-500 ml-2">({fallido.datos.correo})</span>}
                            </td>
                            <td className="px-4 py-2 text-red-600 dark:text-red-400">{fallido.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 justify-center">
                <button
                  onClick={resetImport}
                  className="px-6 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-hover transition-colors"
                >
                  Importar otro archivo
                </button>
                <button
                  onClick={() => navigate('/estudiantes')}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  Ver estudiantes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
