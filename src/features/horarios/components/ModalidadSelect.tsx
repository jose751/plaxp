import React from 'react';
import { FaDesktop, FaBuilding } from 'react-icons/fa';
import type { Modalidad } from '../types/horario.types';

interface ModalidadSelectProps {
  value: Modalidad;
  onChange: (value: Modalidad) => void;
  disabled?: boolean;
}

export const ModalidadSelect: React.FC<ModalidadSelectProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        Modalidad <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => !disabled && onChange('presencial')}
          disabled={disabled}
          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
            value === 'presencial'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <FaBuilding className="w-5 h-5" />
          <span className="text-sm font-medium">Presencial</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Requiere aula física</span>
        </button>

        <button
          type="button"
          onClick={() => !disabled && onChange('virtual')}
          disabled={disabled}
          className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
            value === 'virtual'
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-neutral-200 dark:border-dark-border text-neutral-600 dark:text-neutral-400 hover:border-neutral-300 dark:hover:border-neutral-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <FaDesktop className="w-5 h-5" />
          <span className="text-sm font-medium">Virtual</span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Sin aula física</span>
        </button>
      </div>
    </div>
  );
};
