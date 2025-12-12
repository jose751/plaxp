import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { FaTimes, FaCheckCircle, FaExclamationCircle, FaInfoCircle } from 'react-icons/fa';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION = 4000;

const toastStyles: Record<ToastType, { bg: string; icon: ReactNode; iconBg: string }> = {
  error: {
    bg: 'bg-red-50 dark:bg-red-900/90 border-red-200 dark:border-red-700',
    icon: <FaExclamationCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
    iconBg: 'bg-red-100 dark:bg-red-800',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/90 border-green-200 dark:border-green-700',
    icon: <FaCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />,
    iconBg: 'bg-green-100 dark:bg-green-800',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/90 border-blue-200 dark:border-blue-700',
    icon: <FaInfoCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
    iconBg: 'bg-blue-100 dark:bg-blue-800',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/90 border-yellow-200 dark:border-yellow-700',
    icon: <FaExclamationCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />,
    iconBg: 'bg-yellow-100 dark:bg-yellow-800',
  },
};

const textStyles: Record<ToastType, string> = {
  error: 'text-red-800 dark:text-red-200',
  success: 'text-green-800 dark:text-green-200',
  info: 'text-blue-800 dark:text-blue-200',
  warning: 'text-yellow-800 dark:text-yellow-200',
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, TOAST_DURATION);
  }, [removeToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto animate-in slide-in-from-right fade-in duration-300 ${style.bg} border rounded-lg shadow-lg p-4 max-w-sm flex items-start gap-3`}
            >
              <div className={`flex-shrink-0 w-6 h-6 rounded-full ${style.iconBg} flex items-center justify-center`}>
                {style.icon}
              </div>
              <p className={`flex-1 text-sm font-medium ${textStyles[toast.type]}`}>
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 dark:text-neutral-500 dark:hover:text-neutral-300"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
