import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaEnvelope, FaGraduationCap, FaUser, FaKey, FaCopy, FaExclamationCircle, FaTimes } from 'react-icons/fa';
import type { Estudiante } from '../types/estudiante.types';

interface CredentialsScreenProps {
  student: Estudiante;
}

export const CredentialsScreen: React.FC<CredentialsScreenProps> = ({ student }) => {
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(true);
  const [showEmailToast, setShowEmailToast] = useState(true);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Auto-cerrar toasts después de 8 segundos
  useEffect(() => {
    const successTimer = setTimeout(() => setShowSuccessToast(false), 8000);
    const emailTimer = setTimeout(() => setShowEmailToast(false), 10000);
    return () => {
      clearTimeout(successTimer);
      clearTimeout(emailTimer);
    };
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Toast Notifications - Fixed position */}
      <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
        {/* Success Toast */}
        {showSuccessToast && (
          <div className="bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-700 rounded-xl p-4 shadow-lg animate-slide-in-right backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">Estudiante creado exitosamente</p>
              </div>
              <button
                onClick={() => setShowSuccessToast(false)}
                className="p-1 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors flex-shrink-0"
              >
                <FaTimes className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            </div>
          </div>
        )}

        {/* Email Toast */}
        {showEmailToast && (
          <div className="bg-blue-50 dark:bg-blue-900/90 border border-blue-200 dark:border-blue-700 rounded-xl p-4 shadow-lg animate-slide-in-right backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <FaEnvelope className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">Credenciales enviadas</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5 truncate">{student.correo}</p>
              </div>
              <button
                onClick={() => setShowEmailToast(false)}
                className="p-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors flex-shrink-0"
              >
                <FaTimes className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Credentials Card */}
      <div className="bg-white dark:bg-dark-card rounded-xl border border-neutral-200 dark:border-dark-border shadow-md">
        {/* Header */}
        <div className="bg-neutral-100 dark:bg-neutral-800 px-4 py-3 border-b border-neutral-200 dark:border-dark-border rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaGraduationCap className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                {student.nombre} {student.primerApellido} {student.segundoApellido || ''}
              </h2>
            </div>
          </div>
        </div>

        {/* Credentials Grid */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Usuario */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-200 dark:border-dark-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FaUser className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Usuario</p>
                    <p className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate">
                      {student.nombreUsuario}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(student.nombreUsuario || '', 'nombreUsuario')}
                  className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex-shrink-0"
                  title="Copiar"
                >
                  {copiedField === 'nombreUsuario' ? (
                    <FaCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FaCopy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Contraseña */}
            {student.contrasenaTemporal && (
              <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-200 dark:border-dark-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FaKey className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Contraseña</p>
                      <p className="text-sm font-mono font-bold text-neutral-900 dark:text-neutral-100 truncate">
                        {student.contrasenaTemporal}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(student.contrasenaTemporal || '', 'contrasenaTemporal')}
                    className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex-shrink-0"
                    title="Copiar"
                  >
                    {copiedField === 'contrasenaTemporal' ? (
                      <FaCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <FaCopy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Correo */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 border border-neutral-200 dark:border-dark-border md:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FaEnvelope className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Correo</p>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {student.correo}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(student.correo, 'correo')}
                  className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors flex-shrink-0"
                  title="Copiar"
                >
                  {copiedField === 'correo' ? (
                    <FaCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <FaCopy className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 dark:border-amber-500 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <FaExclamationCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200">
                El estudiante debe cambiar su contraseña en el primer acceso.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-50 dark:bg-neutral-800/50 px-4 py-3 border-t border-neutral-200 dark:border-dark-border rounded-b-xl flex justify-end">
          <button
            onClick={() => navigate(`/estudiantes/view/${student.id}`)}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Ver Estudiante
          </button>
        </div>
      </div>
    </div>
  );
};
