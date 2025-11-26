import { useState, type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import PaginatedDataTable, {
  type PaginatedResponse,
  type ColumnDefinition,
  type BaseItem,
} from '../../../shared/components/PaginatedDataTable';
import { listarCategoriasApi } from '../api/categoriasApi';
import type { Categoria } from '../types/categoria.types';

interface CategoriaItem extends BaseItem {
  id: string;
  nombre: string;
  slug: string;
  nivel: string;
  esVisible: JSX.Element;
  permiteCursos: JSX.Element;
  activo: JSX.Element;
}

const columns: ColumnDefinition<CategoriaItem>[] = [
  { key: 'nombre', header: 'Nombre' },
  { key: 'slug', header: 'Código' },
  { key: 'nivel', header: 'Nivel' },
  { key: 'esVisible', header: 'Visible' },
  { key: 'permiteCursos', header: 'Permite Cursos' },
  { key: 'activo', header: 'Estado' },
];

const fetchCategorias = async (
  page: number,
  limit: number,
  query: string
): Promise<PaginatedResponse<CategoriaItem>> => {
  try {
    const response = await listarCategoriasApi({
      page,
      limit: limit,
      nombre: query || undefined,
    });

    if (!response.success) {
      throw new Error('Error al obtener categorías');
    }

    // Validar que data sea un array
    if (!Array.isArray(response.data)) {
      console.error('Respuesta inesperada de la API:', response);
      throw new Error('La respuesta de la API no tiene el formato esperado');
    }

    const transformedData: CategoriaItem[] = response.data.map((cat: Categoria) => {
      const visibleBadge = cat.esVisible ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700 shadow-sm">
          <FaEye className="w-3 h-3" />
          Visible
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/30 dark:to-gray-800/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 shadow-sm">
          <FaEyeSlash className="w-3 h-3" />
          Oculto
        </span>
      );

      const permiteCursosBadge = cat.permiteCursos ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-700 shadow-sm">
          <FaCheckCircle className="w-3 h-3" />
          Sí
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-900/30 dark:to-gray-800/20 text-gray-700 dark:text-gray-400 border border-gray-300 dark:border-gray-700 shadow-sm">
          <FaTimesCircle className="w-3 h-3" />
          No
        </span>
      );

      const estadoBadge = cat.activo ? (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-800/20 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 shadow-sm">
          <FaCheckCircle className="w-3 h-3" />
          Activo
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-700 shadow-sm">
          <FaTimesCircle className="w-3 h-3" />
          Inactivo
        </span>
      );

      return {
        id: cat.id,
        nombre: cat.nombre,
        slug: cat.slug,
        nivel: `Nivel ${cat.nivel}`,
        esVisible: visibleBadge,
        permiteCursos: permiteCursosBadge,
        activo: estadoBadge,
      };
    });

    return {
      data: transformedData,
      total: response.pagination.totalRecords,
      page: response.pagination.page,
      limit: response.pagination.pageSize,
    };
  } catch (error: any) {
    console.error('Error al obtener categorías:', error);
    throw new Error(error.message || 'Error al cargar las categorías');
  }
};

export const CategoriasPage = () => {
  const navigate = useNavigate();
  const [refreshTrigger] = useState(0);

  const handleRowClick = (categoria: CategoriaItem) => {
    navigate(`/categorias/view/${categoria.id}`);
  };

  const handleView = (categoria: CategoriaItem) => {
    navigate(`/categorias/view/${categoria.id}`);
  };

  const handleCreateNew = () => {
    navigate('/categorias/create');
  };

  const handleEdit = (categoria: CategoriaItem) => {
    navigate(`/categorias/edit/${categoria.id}`);
  };

  return (
    <PaginatedDataTable
      title="Gestión de Categorías de Cursos"
      columns={columns}
      fetchDataFunction={fetchCategorias}
      onRowClick={handleRowClick}
      onCreateNew={handleCreateNew}
      onEdit={handleEdit}
      onView={handleView}
      refreshTrigger={refreshTrigger}
    />
  );
};
