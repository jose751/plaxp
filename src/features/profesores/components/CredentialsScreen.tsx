import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher, FaUserCircle, FaKey, FaCopy, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import type { Profesor } from '../types/profesor.types';

interface CredentialsScreenProps {
  profesor: Profesor;
}

export const CredentialsScreen: React.FC<CredentialsScreenProps> = ({ profesor }) => {
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50 dark:from-dark-bg dark:via-dark-bg dark:to-dark-bg flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg mb-4 animate-bounce">
            <FaCheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">¡Profesor Creado Exitosamente!</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            El profesor <span className="font-semibold text-cyan-600 dark:text-cyan-400">{profesor.nombre} {profesor.primerApellido}</span> ha sido registrado y sincronizado con Moodle
          </p>
        </div>

        {/* Credentials Card */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-xl border border-neutral-200 dark:border-dark-border overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <FaChalkboardTeacher className="w-6 h-6" />
              <h2 className="text-xl font-bold">Credenciales de Acceso a Moodle</h2>
            </div>
            <p className="text-cyan-100 text-sm">
              Guarda esta información de forma segura. El profesor debe cambiar su contraseña en el primer acceso.
            </p>
          </div>

          {/* Alert */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 m-6">
            <div className="flex items-start gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">Información Importante</p>
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  La contraseña temporal solo se muestra una vez. Asegúrate de comunicarla al profesor de forma segura.
                  El profesor <strong>debe cambiar la contraseña</strong> en su primer acceso a Moodle.
                </p>
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div className="p-6 space-y-4">
            {/* Nombre Completo */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                    <FaUserCircle className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Nombre Completo</p>
                    <p className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {profesor.nombre} {profesor.primerApellido} {profesor.segundoApellido || ''}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usuario */}
            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-4 border border-neutral-200 dark:border-dark-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FaUserCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Usuario Moodle</p>
                    <p className="text-base font-mono font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                      {profesor.nombreUsuario}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(profesor.nombreUsuario, 'username')}
                  className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors group"
                  title="Copiar usuario"
                >
                  {copiedField === 'username' ? (
                    <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <FaCopy className="w-5 h-5 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Contraseña Temporal */}
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border-2 border-amber-300 dark:border-amber-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 bg-amber-200 dark:bg-amber-800/50 rounded-lg">
                    <FaKey className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wide">Contraseña Temporal</p>
                    <p className="text-lg font-mono font-bold text-amber-900 dark:text-amber-100 mt-0.5">
                      {profesor.contrasenaTemporal}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Debe cambiarla en el primer acceso
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(profesor.contrasenaTemporal || '', 'password')}
                  className="p-2 hover:bg-amber-200 dark:hover:bg-amber-800/50 rounded-lg transition-colors group"
                  title="Copiar contraseña"
                >
                  {copiedField === 'password' ? (
                    <FaCheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <FaCopy className="w-5 h-5 text-amber-600 dark:text-amber-400 group-hover:text-amber-800 dark:group-hover:text-amber-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Información Adicional */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Correo</p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100">{profesor.correo}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">Identificación</p>
                <p className="text-sm text-neutral-900 dark:text-neutral-100">{profesor.identificacion}</p>
              </div>
              {profesor.idMoodle && (
                <div>
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-1">ID Moodle</p>
                  <p className="text-sm font-mono text-neutral-900 dark:text-neutral-100">{profesor.idMoodle}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/profesores')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <FaChalkboardTeacher className="w-5 h-5" />
            Ir a Lista de Profesores
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-white dark:bg-dark-card border-2 border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-300 font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
          >
            Imprimir Credenciales
          </button>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
