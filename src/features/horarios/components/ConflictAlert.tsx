import React from 'react';
import { FaExclamationTriangle, FaClock, FaBook } from 'react-icons/fa';
import type { Conflicto } from '../types/horario.types';

interface ConflictAlertProps {
  conflictos: Conflicto[];
  onClose?: () => void;
}

export const ConflictAlert: React.FC<ConflictAlertProps> = ({
  conflictos,
  onClose,
}) => {
  if (conflictos.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40">
          <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
            Conflicto de Horario Detectado
          </h4>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            El horario que intentas asignar se superpone con los siguientes cursos:
          </p>

          <div className="space-y-2">
            {conflictos.map((conflicto) => (
              <div
                key={conflicto.horarioId}
                className="bg-white dark:bg-dark-card border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <FaBook className="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                    {conflicto.cursoNombre}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-neutral-500 dark:text-neutral-400">
                    <FaClock className="w-3 h-3" />
                    <span>{conflicto.horaInicio} - {conflicto.horaFin}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-red-600 dark:text-red-400 mt-3">
            Por favor, selecciona un horario diferente o cambia el aula.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
