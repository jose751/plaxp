import React, { useEffect, useState } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';
import { obtenerAulasPorSucursalApi } from '../api/aulasApi';
import type { Aula } from '../types/aula.types';

interface AulaSelectProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  sucursalId?: string; // Filtrar aulas por sucursal (obligatorio)
}

export const AulaSelect: React.FC<AulaSelectProps> = ({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  label = 'Aula',
  placeholder = 'Seleccionar aula',
  sucursalId,
}) => {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (sucursalId) {
      loadAulas(sucursalId);
    } else {
      setAulas([]);
      setLoading(false);
    }
  }, [sucursalId]);

  const loadAulas = async (sucId: string) => {
    setLoading(true);
    setLoadError(null);

    try {
      const response = await obtenerAulasPorSucursalApi(sucId, true);
      if (response.success) {
        setAulas(response.data);
      } else {
        setLoadError('Error al cargar las aulas');
      }
    } catch (err: any) {
      console.error('Error al cargar aulas:', err);
      setLoadError(err.message || 'Error al cargar las aulas');
    } finally {
      setLoading(false);
    }
  };

  // Si no hay sucursalId, mostrar mensaje
  if (!sucursalId) {
    return (
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="w-full px-3 py-2 bg-neutral-50 dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg">
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Selecciona una sucursal primero</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="w-full px-3 py-2 bg-neutral-50 dark:bg-dark-bg border border-neutral-300 dark:border-dark-border rounded-lg flex items-center justify-center gap-2">
          <CgSpinner className="w-4 h-4 animate-spin text-neutral-500" />
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Cargando...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="w-full px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg flex items-center gap-2">
          <FaExclamationCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-600 dark:text-red-400">{loadError}</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="aula-select" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          id="aula-select"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full px-3 py-2 bg-white dark:bg-dark-bg border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all text-neutral-900 dark:text-neutral-100 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed appearance-none pr-8 ${
            error
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
              : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
          }`}
        >
          <option value="">{placeholder}</option>
          {aulas.map((aula) => (
            <option key={aula.id} value={aula.id}>
              {aula.nombre} {aula.capacidadMaxima > 0 ? `(Cap: ${aula.capacidadMaxima})` : ''}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
          <FaExclamationCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};
