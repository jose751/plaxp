import React from 'react';
import { FaExclamationCircle, FaClock } from 'react-icons/fa';

interface TimeInputProps {
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  min?: string;
  max?: string;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  onBlur,
  error,
  disabled = false,
  required = false,
  label = 'Hora',
  min = '06:00',
  max = '22:00',
}) => {
  return (
    <div>
      <label htmlFor="time-input" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="relative">
        <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
        <input
          type="time"
          id="time-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          disabled={disabled}
          min={min}
          max={max}
          className={`w-full pl-10 pr-3 py-2 bg-white dark:bg-dark-bg border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all text-neutral-900 dark:text-neutral-100 disabled:bg-neutral-50 dark:disabled:bg-neutral-700/50 disabled:cursor-not-allowed ${
            error
              ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50'
              : 'border-neutral-300 dark:border-dark-border focus:border-neutral-400 dark:focus:border-neutral-600 focus:ring-neutral-100 dark:focus:ring-neutral-800'
          }`}
        />
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
