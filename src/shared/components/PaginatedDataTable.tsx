import { useState, useEffect, useCallback, useMemo } from "react";
import { FaEdit, FaTrash, FaEye, FaSearch, FaPlus, FaAngleLeft, FaAngleRight } from "react-icons/fa";
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

interface PaginatedDataTableProps<T extends BaseItem> {
    fetchDataFunction: (page: number, limit: number, query: string, status?: string) => Promise<PaginatedResponse<T>>;
    onRowClick: (item: T) => void;
    onCreateNew: () => void;
    columns: ColumnDefinition<T>[];
    title: string;
    refreshTrigger?: number;
    statusOptions?: StatusOption[];  // Opcional: array de estados disponibles
}

const DEFAULT_PAGE_SIZE = 15;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50, 100];

// --- Subcomponente para la vista de TARJETAS (Móvil) ---
const PaginatedCardList = <T extends BaseItem>({ data, columns, onRowClick }: {
    data: T[];
    columns: ColumnDefinition<T>[];
    onRowClick: (item: T) => void;
}) => (
    <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3">

        {data.map((item) => (
            <div
                key={item.id}
                className="group bg-gradient-to-br from-white to-neutral-50 rounded-xl shadow-md p-4 border border-neutral-200/50 hover:shadow-xl hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.01] cursor-pointer backdrop-blur-sm"
                onClick={() => onRowClick(item)}
            >
                <div className="space-y-2.5">
                    {columns.map((col) => (
                        <div key={String(col.key)} className="flex items-start space-x-2">
                            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wide min-w-[70px]">{col.header}:</span>
                            <span className="text-sm font-semibold text-neutral-900 group-hover:text-primary transition-colors duration-300">{item[col.key] as React.ReactNode}</span>
                        </div>
                    ))}
                    <div className="flex justify-end pt-2 space-x-2 border-t border-neutral-200/50">
                        <button className="text-primary hover:text-purple-700 transform hover:scale-110 transition-all duration-200 p-1" aria-label="View Details"><FaEye size={16} /></button>
                        <button className="text-info hover:text-blue-700 transform hover:scale-110 transition-all duration-200 p-1" aria-label="Edit"><FaEdit size={16} /></button>
                        <button className="text-danger hover:text-red-700 transform hover:scale-110 transition-all duration-200 p-1" aria-label="Delete"><FaTrash size={16} /></button>
                    </div>
                </div>
            </div>
        ))}
    </div>
);

// --- Subcomponente para la vista de TABLA (Desktop) ---
const PaginatedTable = <T extends BaseItem>({ data, columns, onRowClick, onSort, sortColumn, sortDirection }: {
    data: T[];
    columns: ColumnDefinition<T>[];
    onRowClick: (item: T) => void;
    onSort: (column: keyof T) => void;
    sortColumn: keyof T | null;
    sortDirection: 'asc' | 'desc';
}) => (
    <div className="hidden md:block overflow-hidden">
        {/* Contenedor con scroll interno */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            <table className="w-full table-auto border-separate border-spacing-y-1.5">
                <thead className="sticky top-0 z-10">
                    {/* class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal" */}
                    <tr className="bg-gray-200 text-gray-600  uppercase text-xs leading-normal tracking-wide shadow-md">
                        {columns.map((col) => (
                            <th
                                key={String(col.key)}
                                className="py-2 px-5 text-left font-bold first:pl-6 cursor-pointer hover:bg-gray-300 transition-colors select-none group"
                                onClick={() => onSort(col.key)}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="drop-shadow-sm">{col.header}</span>
                                    <div className="flex flex-col gap-0.5">
                                        <svg
                                            className={`w-4 h-4 transition-all drop-shadow-sm ${
                                                sortColumn === col.key && sortDirection === 'asc'
                                                    ? 'opacity-100 scale-125'
                                                    : 'opacity-70 group-hover:opacity-90'
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                        </svg>
                                        <svg
                                            className={`w-4 h-4 transition-all drop-shadow-sm ${
                                                sortColumn === col.key && sortDirection === 'desc'
                                                    ? 'opacity-100 scale-125'
                                                    : 'opacity-70 group-hover:opacity-90'
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
                <tbody className="text-neutral-700 text-sm">
                    {data.map((item, index) => (
                        <tr
                            key={item.id}
                            onClick={() => onRowClick(item)}
                            className={`cursor-pointer hover:bg-primary/5 transition-all duration-200 shadow-md hover:shadow-lg ${
                                index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/50'
                            }`}
                        >
                            {columns.map((col) => (
                                <td
                                    key={String(col.key)}
                                    className="py-2.5 px-5 text-left first:pl-6"
                                >
                                    <span className="font-medium text-neutral-800">{item[col.key] as React.ReactNode}</span>
                                </td>
                            ))}
                            <td className="py-2.5 px-5 text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex item-center justify-center space-x-2">
                                    <button className="text-primary hover:text-white transition-all duration-200 p-1.5 hover:bg-primary rounded-lg shadow hover:shadow-md" aria-label="View Details" title="Ver detalles">
                                        <FaEye size={16} />
                                    </button>
                                    <button className="text-info hover:text-white transition-all duration-200 p-1.5 hover:bg-info rounded-lg shadow hover:shadow-md" aria-label="Edit" title="Editar">
                                        <FaEdit size={16} />
                                    </button>
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
    columns,
    title,
    refreshTrigger = 0,
    statusOptions,
}: PaginatedDataTableProps<T>) => {
    // Estado de la Data y UI
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Estado de Búsqueda
    const [inputTerm, setInputTerm] = useState("");
    const [activeSearchTerm, setActiveSearchTerm] = useState("");

    // Estado de Filtro por Estado
    const [selectedStatus, setSelectedStatus] = useState<string>("");

    // Estado de Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

    // Estado de Ordenamiento
    const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
        setLoading(true);
        setError(null);

        try {
            const result = await fetchDataFunction(
                currentPage,
                pageSize,
                activeSearchTerm,
                selectedStatus || undefined
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
            setLoading(false);
        }
    }, [currentPage, pageSize, activeSearchTerm, selectedStatus, fetchDataFunction, refreshTrigger]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSearchSubmit = () => {
        if (inputTerm !== activeSearchTerm) {
            setCurrentPage(1);
            setActiveSearchTerm(inputTerm);
        } else if (currentPage === 1) {
            loadData();
        }
    };

    const handleStatusChange = (status: string) => {
        setSelectedStatus(status);
        setCurrentPage(1); // Reset a la primera página al cambiar filtro
    };

    const handleRowClickEvent = (item: T) => {
        onRowClick(item);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1); // Reset a la primera página cuando cambia el tamaño
    };

    const handleSort = (column: keyof T) => {
        if (sortColumn === column) {
            // Si ya está ordenado por esta columna, cambiar dirección
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Nueva columna, ordenar ascendente por defecto
            setSortColumn(column);
            setSortDirection('asc');
        }
    };

    return (
        <div className="w-full font-sans px-2 md:px-0">
            <h1 className="text-3xl font-bold mb-6 text-neutral-900 flex items-center gap-3">
                <div className="h-10 w-1.5 bg-gradient-to-b from-primary to-purple-600 rounded-full"></div>
                {title}
            </h1>

            <div className="md:bg-white md:rounded-lg md:shadow-lg md:border md:border-neutral-200 overflow-hidden w-full">

                {/* Controles de Búsqueda y Creación - STICKY */}
                <div className="sticky top-0 z-20 bg-white border-b border-neutral-200 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
                        {/* Búsqueda y Filtros */}
                        <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-2 sm:space-y-0 sm:space-x-2">
                            {/* Búsqueda */}
                            <div className="flex space-x-2">
                                <div className="relative flex-1 sm:flex-initial">
                                    <input
                                        type="text"
                                        placeholder="Buscar..."
                                        className="pl-3 pr-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all w-full sm:w-64 bg-white text-sm shadow-md hover:shadow-lg focus:shadow-lg"
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
                                <div className="relative">
                                    <select
                                        id="status-filter"
                                        value={selectedStatus}
                                        onChange={(e) => handleStatusChange(e.target.value)}
                                        className="appearance-none bg-white border border-neutral-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-semibold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-all shadow-md hover:shadow-lg hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={loading}
                                    >
                                        <option value="" className="font-semibold">Todos los estados</option>
                                        {statusOptions.map((option) => (
                                            <option key={option.value} value={option.value} className="font-semibold">
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Icono de flecha personalizado */}
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-neutral-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Botón crear */}
                        <button
                            onClick={onCreateNew}
                            className="bg-success hover:bg-success/90 text-white font-semibold py-2.5 px-5 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-success/50 disabled:opacity-50 w-full sm:w-auto text-sm shadow-md hover:shadow-lg"
                            disabled={loading}
                        >
                            <FaPlus className="inline-block mr-2" /> Crear Nuevo
                        </button>
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
                                <p className="text-lg font-semibold text-neutral-800 mb-2">No se encontraron resultados</p>
                                <p className="text-sm text-neutral-600 mb-1">La búsqueda de <span className="font-semibold text-neutral-800">"{activeSearchTerm}"</span> no produjo coincidencias.</p>
                                <p className="text-xs text-neutral-500 mt-3">Intente con otros términos de búsqueda</p>
                            </div>
                        ) : (
                            <>
                                {/* Renderizado Condicional */}
                                <PaginatedTable
                                    data={sortedData}
                                    columns={columns}
                                    onRowClick={handleRowClickEvent}
                                    onSort={handleSort}
                                    sortColumn={sortColumn}
                                    sortDirection={sortDirection}
                                />
                                <PaginatedCardList data={sortedData} columns={columns} onRowClick={handleRowClickEvent} />
                            </>
                        )}
                    </>
                )}

                {/* Mensaje si no hay items después de cargar */}
                {!loading && totalItems === 0 && !error && activeSearchTerm === "" && (
                    <div className="py-12 text-center animate-fade-in">
                        <svg className="w-16 h-16 mx-auto mb-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-semibold text-neutral-800 mb-2">No hay registros disponibles</p>
                        <p className="text-sm text-neutral-600">Comience creando una nueva entrada.</p>
                    </div>
                )}
                </div>

                {/* Paginación - STICKY FOOTER */}
                {!loading && totalItems > 0 && (
                    <div className="sticky bottom-0 z-20 bg-white border-t border-neutral-200 p-3 md:p-4 flex flex-col lg:flex-row justify-between items-center space-y-2 lg:space-y-0 gap-3 w-full">
                        {/* Selector de tamaño de página */}
                        <div className="flex items-center space-x-2 bg-neutral-50 px-3 py-2 rounded-lg border border-neutral-200 order-1 lg:order-none">
                            <span className="text-xs font-medium text-neutral-600 whitespace-nowrap">Mostrar:</span>
                            <select
                                value={pageSize}
                                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                                className="bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                                disabled={loading}
                            >
                                {PAGE_SIZE_OPTIONS.map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                            <span className="text-xs font-medium text-neutral-600">por página</span>
                        </div>

                        {/* Info de paginación */}
                        <p className="text-xs font-medium text-neutral-700 text-center bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-200 order-3 lg:order-none">
                            Mostrando <span className="font-bold text-primary">{data.length}</span> de <span className="font-bold text-primary">{totalItems}</span> | Página <span className="font-bold text-primary">{currentPage}</span> de <span className="font-bold text-primary">{totalPages}</span>
                        </p>

                        {/* Controles de paginación */}
                        <div className="flex space-x-2 order-2 lg:order-none">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-neutral-700 disabled:hover:border-neutral-300 transition-all duration-200"
                            >
                                <FaAngleLeft className="w-4 h-4" />
                            </button>
                            <span className="px-4 py-2 bg-gradient-to-r from-primary to-purple-600 text-white rounded-lg font-bold flex items-center justify-center min-w-[50px] text-sm shadow-sm">
                                {currentPage}
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 font-medium hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-neutral-700 disabled:hover:border-neutral-300 transition-all duration-200"
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
