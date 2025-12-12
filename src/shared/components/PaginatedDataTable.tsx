import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FaEdit, FaEye, FaSearch, FaPlus, FaAngleLeft, FaAngleRight, FaFileExcel, FaFilePdf, FaDownload, FaUpload } from "react-icons/fa";
import { CgSpinner } from "react-icons/cg";
import React from 'react';

// --- TIPOS DE DATOS GENÉRICOS ---
export interface BaseItem {
    id: number | string;
    [key: string]: any;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface ColumnDefinition<T> {
    key: keyof T;
    header: string;
}

export interface StatusOption {
    label: string;      // Lo que ve el usuario (ej: "Activo")
    value: string;      // Lo que se envía al API (ej: "active")
    color?: string;     // Color opcional para el badge (ej: "green", "red")
}

export interface CustomAction<T> {
    icon: React.ReactNode;
    label: string;
    onClick: (item: T) => void;
    className?: string;
}

interface PaginatedDataTableProps<T extends BaseItem> {
    fetchDataFunction: (page: number, limit: number, query: string, status?: string, additionalFilters?: Record<string, any>) => Promise<PaginatedResponse<T>>;
    onRowClick: (item: T) => void;
    onCreateNew?: () => void;  // Opcional: callback para crear nuevo (si no se pasa, no muestra el botón)
    onEdit?: (item: T) => void;  // Opcional: callback para editar
    onView?: (item: T) => void;  // Opcional: callback para ver detalles
    columns: ColumnDefinition<T>[];
    title: string;
    refreshTrigger?: number;
    statusOptions?: StatusOption[];  // Opcional: array de estados disponibles
    renderAdditionalFilters?: (filters: Record<string, any>, setFilters: (filters: Record<string, any>) => void) => React.ReactNode;  // Opcional: renderizar filtros adicionales
    additionalFilters?: Record<string, any>;  // Opcional: filtros adicionales iniciales
    onExportExcel?: () => void;  // Opcional: callback para exportar a Excel
    onExportPdf?: () => void;  // Opcional: callback para exportar a PDF
    onImport?: () => void;  // Opcional: callback para importar datos
    customActions?: CustomAction<T>[];  // Opcional: acciones personalizadas
}

const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

// --- Subcomponente para la vista de TARJETAS (Móvil) ---
const PaginatedCardList = <T extends BaseItem>({ data, columns, onRowClick, onEdit, onView, customActions }: {
    data: T[];
    columns: ColumnDefinition<T>[];
    onRowClick: (item: T) => void;
    onEdit?: (item: T) => void;
    onView?: (item: T) => void;
    customActions?: CustomAction<T>[];
}) => (
    <div className="space-y-4">
        {data.map((item) => {
            const [firstCol, ...restCols] = columns;

            return (
                <div
                    key={item.id}
                    className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-neutral-200 dark:border-dark-border hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 cursor-pointer overflow-hidden"
                    onClick={() => onRowClick(item)}
                >
                    {/* Línea morada superior */}
                    <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-400"></div>

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-neutral-100 dark:border-dark-border">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                {firstCol && (
                                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                                        {item[firstCol.key] as React.ReactNode}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {onView && (
                                    <button
                                        className="p-2.5 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                        aria-label="Ver"
                                        onClick={(e) => { e.stopPropagation(); onView(item); }}
                                    >
                                        <FaEye size={16} />
                                    </button>
                                )}
                                {customActions && customActions.map((action, index) => (
                                    <button
                                        key={index}
                                        className={`p-2.5 rounded-lg transition-colors ${action.className || 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30'}`}
                                        aria-label={action.label}
                                        title={action.label}
                                        onClick={(e) => { e.stopPropagation(); action.onClick(item); }}
                                    >
                                        {action.icon}
                                    </button>
                                ))}
                                {onEdit && (
                                    <button
                                        className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        aria-label="Editar"
                                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                                    >
                                        <FaEdit size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contenido: Campos en filas */}
                    <div className="px-5 py-4">
                        <div className="space-y-4">
                            {restCols.map((col) => (
                                <div key={String(col.key)} className="flex flex-col">
                                    <span className="text-xs font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wide mb-1.5">
                                        {col.header}
                                    </span>
                                    <div className="text-sm text-neutral-800 dark:text-neutral-200">
                                        {item[col.key] as React.ReactNode}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
);

// --- Subcomponente para la vista de TABLA (Desktop) ---
const PaginatedTable = <T extends BaseItem>({ data, columns, onRowClick, onEdit, onView, onSort, sortColumn, sortDirection, customActions }: {
    data: T[];
    columns: ColumnDefinition<T>[];
    onRowClick: (item: T) => void;
    onEdit?: (item: T) => void;
    onView?: (item: T) => void;
    onSort: (column: keyof T) => void;
    sortColumn: keyof T | null;
    sortDirection: 'asc' | 'desc';
    customActions?: CustomAction<T>[];
}) => (
    <div className="overflow-hidden">
        {/* Contenedor con scroll interno */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <table className="w-full table-auto border-separate border-spacing-y-1.5">
                <thead className="sticky top-0 z-10">
                    {/* class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal" */}
                    <tr className="bg-gray-200 dark:bg-dark-border text-gray-600 dark:text-neutral-300 uppercase text-xs leading-normal tracking-wide shadow-md">
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className="py-2 px-5 text-left font-bold first:pl-6 cursor-pointer hover:bg-gray-300 dark:hover:bg-dark-hover transition-colors select-none group"
                                onClick={() => onSort(col.key)}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="drop-shadow-sm">{col.header}</span>
                                    <div className="flex flex-col gap-0.5">
                                        <svg
                                            className={`w-4 h-4 transition-all drop-shadow-sm ${
                                                sortColumn === col.key && sortDirection === 'asc'
                                                    ? 'text-purple-600 dark:text-purple-400 opacity-100'
                                                    : sortColumn === col.key
                                                        ? 'opacity-20'
                                                        : 'opacity-40 group-hover:opacity-60'
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                        <svg
                                            className={`w-4 h-4 transition-all drop-shadow-sm ${
                                                sortColumn === col.key && sortDirection === 'desc'
                                                    ? 'text-purple-600 dark:text-purple-400 opacity-100'
                                                    : sortColumn === col.key
                                                        ? 'opacity-20'
                                                        : 'opacity-40 group-hover:opacity-60'
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </th>
                        ))}
                        <th className="py-3 px-5 text-center font-bold">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="text-neutral-700 dark:text-neutral-300 text-sm">
                    {data.map((item, index) => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick(item)}
                            className={`cursor-pointer hover:bg-primary/5 transition-all duration-200 shadow-sm hover:shadow-xl border-l-4 border-transparent hover:border-primary ${
                                index % 2 === 0 ? 'bg-white dark:bg-dark-card' : 'bg-neutral-50/50 dark:bg-dark-bg'
                            }`}
                        >
                            {columns.map((col) => (
                                <td
                                    key={String(col.key)}
                                    className="py-2.5 px-5 text-left first:pl-6"
                                >
                                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{item[col.key] as React.ReactNode}</span>
                                </td>
                            ))}
                            <td className="py-2.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex item-center justify-center space-x-2">
                                    {onView && (
                                        <button
                                            className="text-primary hover:text-white transition-all duration-200 p-1.5 hover:bg-primary rounded-lg shadow hover:shadow-md"
                                            aria-label="View Details"
                                            title="Ver detalles"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onView(item);
                                            }}
                                        >
                                            <FaEye size={16} />
                                        </button>
                                    )}
                                    {customActions && customActions.map((action, index) => (
                                        <button
                                            key={index}
                                            className={`transition-all duration-200 p-1.5 rounded-lg shadow hover:shadow-md ${action.className || 'text-green-600 hover:text-white hover:bg-green-600'}`}
                                            aria-label={action.label}
                                            title={action.label}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                action.onClick(item);
                                            }}
                                        >
                                            {action.icon}
                                        </button>
                                    ))}
                                    {onEdit && (
                                        <button
                                            className="text-info hover:text-white transition-all duration-200 p-1.5 hover:bg-info rounded-lg shadow hover:shadow-md"
                                            aria-label="Edit"
                                            title="Editar"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(item);
                                            }}
                                        >
                                            <FaEdit size={16} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL ---
const PaginatedDataTable = <T extends BaseItem>({
    fetchDataFunction,
    onRowClick,
    onCreateNew,
    onEdit,
    onView,
    columns,
    title,
    refreshTrigger = 0,
    statusOptions,
    renderAdditionalFilters,
    additionalFilters: initialAdditionalFilters = {},
    onExportExcel,
    onExportPdf,
    onImport,
    customActions,
}: PaginatedDataTableProps<T>) => {
    // Estado de la Data y UI
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado de Búsqueda
    const [inputTerm, setInputTerm] = useState("");
    const [activeSearchTerm, setActiveSearchTerm] = useState("");

    // Estado de Filtro por Estado - Inicializar con el primer valor de statusOptions si existe
    const [selectedStatus, setSelectedStatus] = useState<string>(
        statusOptions && statusOptions.length > 0 ? statusOptions[0].value : ""
    );

    // Estado de Filtros Adicionales
    const [additionalFilters, setAdditionalFilters] = useState<Record<string, any>>(initialAdditionalFilters);

    // Estado de Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    // Estado de Ordenamiento
    const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Estado del dropdown de exportación
    const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
    const exportDropdownRef = useRef<HTMLDivElement>(null);

    // Ref para la función de fetch (evita recreaciones innecesarias)
    const fetchDataFunctionRef = useRef(fetchDataFunction);
    const loadingRef = useRef(false);
    const onRowClickRef = useRef(onRowClick);
    const onEditRef = useRef(onEdit);
    const onViewRef = useRef(onView);

    // Actualizar las referencias cuando cambien las funciones
    useEffect(() => {
        fetchDataFunctionRef.current = fetchDataFunction;
        onRowClickRef.current = onRowClick;
        onEditRef.current = onEdit;
        onViewRef.current = onView;
    }, [fetchDataFunction, onRowClick, onEdit, onView]);

    // Cerrar dropdown de exportación al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setExportDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cálculo de páginas
    const totalPages = useMemo(() =>
        Math.max(1, Math.ceil(totalItems / pageSize)),
        [totalItems, pageSize]
    );

    // Función para ordenar datos localmente
    const sortedData = useMemo(() => {
        if (!sortColumn) return data;

        const sorted = [...data].sort((a, b) => {
            const aValue = a[sortColumn];
            const bValue = b[sortColumn];

            // Manejar valores nulos o indefinidos
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Comparar números
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
            }

            // Comparar strings (case-insensitive)
            const aStr = String(aValue).toLowerCase();
            const bStr = String(bValue).toLowerCase();

            if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
            if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [data, sortColumn, sortDirection]);

    // Hook para manejar la consulta al servidor
    const loadData = useCallback(async () => {
        // Evitar múltiples llamadas simultáneas
        if (loadingRef.current) {
            return;
        }

        loadingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const result = await fetchDataFunctionRef.current(
                currentPage,
                pageSize,
                activeSearchTerm,
                selectedStatus || undefined,
                additionalFilters
            );

            if (!Array.isArray(result.data)) {
                throw new Error("La API no devolvió un array de datos válido.");
            }

            setData(result.data);
            setTotalItems(result.total);
            setCurrentPage(result.page || currentPage);
        } catch (err: any) {
            console.error("Error cargando datos:", err);
            const errorMessage = err.message || "Error al cargar datos del servidor.";
            setError(errorMessage);
            setData([]);
            setTotalItems(0);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [currentPage, pageSize, activeSearchTerm, selectedStatus, additionalFilters]);

    useEffect(() => {
        loadData();
    }, [loadData, refreshTrigger]);

    const handleSearchSubmit = useCallback(() => {
        if (inputTerm !== activeSearchTerm) {
            setCurrentPage(1);
            setActiveSearchTerm(inputTerm);
        } else if (currentPage === 1) {
            loadData();
        }
    }, [inputTerm, activeSearchTerm, currentPage, loadData]);

    const handleStatusChange = useCallback((status: string) => {
        setSelectedStatus(status);
        setCurrentPage(1);
    }, []);

    const handleRowClickEvent = useCallback((item: T) => {
        onRowClickRef.current(item);
    }, []);

    const handleEditEvent = useCallback((item: T) => {
        if (onEditRef.current) {
            onEditRef.current(item);
        }
    }, []);

    const handleViewEvent = useCallback((item: T) => {
        if (onViewRef.current) {
            onViewRef.current(item);
        }
    }, []);

    const handlePageChange = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    }, [totalPages]);

    const handlePageSizeChange = useCallback((newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1);
    }, []);

    const handleSort = useCallback((column: keyof T) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
    }, [sortColumn, sortDirection]);

    return (
        <div className="w-full font-sans px-2 md:px-0">
            {title && (
                <h1 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                    <div className="h-10 w-1.5 bg-gradient-to-b from-primary to-purple-600 rounded-full"></div>
                    {title}
                </h1>
            )}

            <div className="md:bg-white dark:md:bg-dark-card md:rounded-2xl md:shadow-lg md:border md:border-neutral-100 dark:md:border-dark-border overflow-hidden w-full backdrop-blur-sm">

                {/* Controles de Búsqueda y Creación - STICKY */}
                <div className="sticky top-0 z-20 bg-white dark:bg-dark-card border-b border-neutral-200 dark:border-dark-border p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        {/* Búsqueda y Filtros */}
                        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
                            {/* Búsqueda */}
                            <div className="flex space-x-2">
                                <div className="relative flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="pl-3 pr-3 py-2.5 border border-neutral-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all w-full sm:w-64 bg-white dark:bg-dark-bg dark:text-neutral-100 text-sm shadow-md hover:shadow-lg focus:shadow-lg"
                                        value={inputTerm}
                                        onChange={(e) => setInputTerm(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
                                    />
                                </div>
                                <button
                                    onClick={handleSearchSubmit}
                                    className="bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                    aria-label="Search"
                                    disabled={loading}
                                >
                                    <FaSearch className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Filtro de Estado */}
                            {statusOptions && statusOptions.length > 0 && (
                                <select
                                    id="status-filter"
                                    value={selectedStatus}
                                    onChange={(e) => handleStatusChange(e.target.value)}
                                    disabled={loading}
                                    className="w-full sm:w-auto min-w-[140px]"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {/* Filtros Adicionales */}
                            {renderAdditionalFilters && renderAdditionalFilters(additionalFilters, (newFilters) => {
                                setAdditionalFilters(newFilters);
                                setCurrentPage(1);
                            })}
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {/* Dropdown de exportación (solo si hay funciones de exportación) */}
                            {(onExportExcel || onExportPdf) && (
                                <div className="relative" ref={exportDropdownRef}>
                                    <button
                                        onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                                        className="bg-neutral-600 hover:bg-neutral-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-neutral-500/50 disabled:opacity-50 text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                                        disabled={loading || data.length === 0}
                                        title="Exportar datos"
                                    >
                                        <FaDownload className="w-4 h-4" />
                                        <span className="hidden sm:inline">Exportar</span>
                                        <svg className={`w-4 h-4 transition-transform ${exportDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {/* Dropdown menu */}
                                    {exportDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-neutral-200 dark:border-dark-border z-50 overflow-hidden animate-fade-in">
                                            {onExportExcel && (
                                                <button
                                                    onClick={() => {
                                                        onExportExcel();
                                                        setExportDropdownOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                                                >
                                                    <FaFileExcel className="w-5 h-5 text-green-600" />
                                                    <span className="font-medium">Exportar a Excel</span>
                                                </button>
                                            )}
                                            {onExportPdf && (
                                                <button
                                                    onClick={() => {
                                                        onExportPdf();
                                                        setExportDropdownOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-neutral-100 dark:border-dark-border"
                                                >
                                                    <FaFilePdf className="w-5 h-5 text-red-600" />
                                                    <span className="font-medium">Exportar a PDF</span>
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Botón importar (solo si onImport está definido) */}
                            {onImport && (
                                <button
                                    onClick={onImport}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 text-sm shadow-md hover:shadow-lg flex items-center gap-2"
                                    disabled={loading}
                                    title="Importar datos"
                                >
                                    <FaUpload className="w-4 h-4" />
                                    <span className="hidden sm:inline">Importar</span>
                                </button>
                            )}

                            {/* Botón crear (solo si onCreateNew está definido) */}
                            {onCreateNew && (
                                <button
                                    onClick={onCreateNew}
                                    className="bg-success hover:bg-success/90 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success/50 disabled:opacity-50 flex-1 sm:flex-none text-sm shadow-md hover:shadow-lg"
                                    disabled={loading}
                                >
                                    <FaPlus className="inline-block mr-2" /> Crear Nuevo
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Contenedor de contenido con padding */}
                <div className="p-4 sm:p-5">
                    {/* Mensaje de Error */}
                    {error && (
                        <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-400 text-red-700 px-4 py-2.5 rounded-xl relative mb-4 shadow-md animate-fade-in">
                            <div className="flex items-center space-x-2">
                                <div className="flex-shrink-0 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-bold">!</span>
                                </div>
                                <p className="font-semibold text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Loader y Contenido */}
                    {loading ? (
                    <div className="flex flex-col justify-center items-center h-48 space-y-3 animate-fade-in">
                        <CgSpinner className="animate-spin text-5xl text-primary" />
                        <p className="text-lg text-neutral-700 font-semibold">Cargando...</p>
                    </div>
                ) : (
                    <>
                        {data.length === 0 && activeSearchTerm !== "" ? (
                            <div className="py-12 text-center animate-fade-in">
                                <svg className="w-16 h-16 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-2">No se encontraron resultados</p>
                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">La búsqueda de <span className="font-semibold text-neutral-800 dark:text-neutral-100">"{activeSearchTerm}"</span> no produjo coincidencias.</p>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3">Intente con otros términos de búsqueda</p>
                            </div>
                        ) : (
                            <>
                                {/* Renderizado Condicional - Solo renderizar el componente visible */}
                                {/* Desktop */}
                                <div className="hidden md:block">
                                    <PaginatedTable
                                        data={sortedData}
                                        columns={columns}
                                        onRowClick={handleRowClickEvent}
                                        onEdit={onEdit ? handleEditEvent : undefined}
                                        onView={onView ? handleViewEvent : undefined}
                                        onSort={handleSort}
                                        sortColumn={sortColumn}
                                        sortDirection={sortDirection}
                                        customActions={customActions}
                                    />
                                </div>
                                {/* Mobile */}
                                <div className="md:hidden">
                                    <PaginatedCardList
                                        data={sortedData}
                                        columns={columns}
                                        onRowClick={handleRowClickEvent}
                                        onEdit={onEdit ? handleEditEvent : undefined}
                                        onView={onView ? handleViewEvent : undefined}
                                        customActions={customActions}
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Mensaje si no hay items después de cargar */}
                {!loading && totalItems === 0 && !error && activeSearchTerm === "" && (
                    <div className="py-16 text-center animate-fade-in">
                        <svg className="w-20 h-20 mx-auto mb-5 text-neutral-400 dark:text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xl font-bold text-neutral-800 dark:text-neutral-200 mb-2">No hay registros disponibles</p>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Aún no se han creado registros en esta sección.</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-500">Haz clic en el botón "Crear Nuevo" para comenzar.</p>
                    </div>
                )}
                </div>

                {/* Paginación - STICKY FOOTER */}
                {!loading && totalItems > 0 && (
                    <div className="sticky bottom-0 z-20 bg-white dark:bg-dark-card border-t border-neutral-200 dark:border-dark-border p-3 md:p-4 flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0 gap-3 w-full">
                        {/* Selector de tamaño de página */}
                        <div className="flex items-center space-x-2 bg-neutral-50 dark:bg-dark-bg px-3 py-2 rounded-lg border border-neutral-200 dark:border-dark-border order-1 lg:order-none">
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 whitespace-nowrap">Mostrar:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="bg-white dark:bg-dark-card border border-neutral-300 dark:border-dark-border rounded px-2 py-1 text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                                disabled={loading}
                            >
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">por página</span>
                        </div>

                        {/* Info de paginación */}
                        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 text-center bg-neutral-50 dark:bg-dark-bg px-4 py-2 rounded-lg border border-neutral-200 dark:border-dark-border order-3 lg:order-none">
                            Mostrando <span className="font-bold text-primary">{data.length}</span> de <span className="font-bold text-primary">{totalItems}</span> | Página <span className="font-bold text-primary">{currentPage}</span> de <span className="font-bold text-primary">{totalPages}</span>
                        </p>

                        {/* Controles de paginación */}
                        <div className="flex space-x-2 order-2 lg:order-none">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 bg-white dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-dark-bg disabled:hover:text-neutral-700 dark:disabled:hover:text-neutral-300 disabled:hover:border-neutral-300 dark:disabled:hover:border-dark-border transition-all duration-200"
                            >
                                <FaAngleLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-bold flex items-center justify-center min-w-[50px] text-sm shadow-sm">
                                {currentPage}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 bg-white dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg text-neutral-700 dark:text-neutral-300 font-medium hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-dark-bg disabled:hover:text-neutral-700 dark:disabled:hover:text-neutral-300 disabled:hover:border-neutral-300 dark:disabled:hover:border-dark-border transition-all duration-200"
                            >
                                <FaAngleRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaginatedDataTable;
