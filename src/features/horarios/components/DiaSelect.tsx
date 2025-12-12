import React from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import type { DiaSemana } from '../types/horario.types';
import { DIAS_SEMANA } from '../types/horario.types';

interface DiaSelectProps {
  value: DiaSemana | '';
  onChange: (value: DiaSemana | '') => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
}

export const DiaSelect: React.FC<DiaSelectProps> = ({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  label = 'Día de la Semana',
  placeholder = 'Seleccionar día',
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange('');
    } else {
      onChange(parseInt(val) as DiaSemana);
    }
  };

  return (
    <div>
      <label htmlFor="dia-select" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          id="dia-select"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
          className={`w-full px-3 py-2 bg-white dark:bg-dark-bg border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all text-neutral-900 dark:text-neutral-100 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed appearance-none pr-8 ${
            error
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
              : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
          }`}
        >
          <option value="">{placeholder}</option>
          {(Object.entries(DIAS_SEMANA) as [string, string][]).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
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
