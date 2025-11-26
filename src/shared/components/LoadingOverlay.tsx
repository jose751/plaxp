import React from "react";
import { CgSpinner } from "react-icons/cg";
import { FaCheckCircle } from "react-icons/fa";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  isSuccess?: boolean;
  successMessage?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Procesando...",
  isSuccess = false,
  successMessage = "Completado",
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20 backdrop-blur-sm animate-fade-in">
      {/* Card moderna */}
      <div
        className="
          bg-white/80 dark:bg-dark-card/80
          backdrop-blur-xl
          rounded-2xl
          px-8 py-10
          w-full max-w-sm
          border border-neutral-200/60 dark:border-dark-border/50
          shadow-soft dark:shadow-none
          animate-slide-up
        "
      >
        <div className="flex flex-col items-center text-center">

          {/* Ícono */}
          {!isSuccess ? (
            <CgSpinner className="w-10 h-10 text-primary animate-spin mb-5" />
          ) : (
            <FaCheckCircle className="w-10 h-10 text-success animate-pop mb-5" />
          )}

          {/* Título */}
          <h3 className="text-[17px] font-medium text-neutral-900 dark:text-neutral-100">
            {isSuccess ? successMessage : message}
          </h3>

          {!isSuccess && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              Por favor espera…
            </p>
          )}

          {/* Barra de progreso moderna */}
          {!isSuccess && (
            <div className="w-full mt-8 h-[3px] bg-neutral-200 dark:bg-dark-border rounded-full overflow-hidden">
              <div className="h-full bg-primary/80 dark:bg-primary/70 animate-progress-line" />
            </div>
          )}
        </div>
      </div>

      {/* Estilos extra */}
      <style>{`
        @keyframes progressLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .animate-progress-line {
          animation: progressLine 1.2s linear infinite;
        }

        @keyframes pop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        .animate-pop {
          animation: pop .25s ease-out;
        }
      `}</style>
    </div>
  );
};
