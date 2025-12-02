import { useState } from 'react';
import { HiTrash } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { eliminarLeadApi } from '../api/crmApi';
import type { CrmLead } from '../types/crm.types';

interface DeleteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  lead: CrmLead | null;
}

export const DeleteLeadModal = ({
  isOpen,
  onClose,
  onSuccess,
  lead,
}: DeleteLeadModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const getLeadDisplayName = (lead: CrmLead) => {
    return `${lead.alumno.nombre} ${lead.alumno.apellido}`;
  };

  const handleDelete = async () => {
    if (!lead) return;

    try {
      setDeleting(true);
      const response = await eliminarLeadApi(lead.id);
      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      console.error('Error al eliminar lead:', err);
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <HiTrash className="w-7 h-7 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">
            Eliminar prospecto
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            ¿Estás seguro de que deseas eliminar a{' '}
            <span className="font-semibold text-neutral-900 dark:text-white">
              {getLeadDisplayName(lead)}
            </span>?
          </p>
          <p className="text-sm text-neutral-500 mt-1">Esta acción no se puede deshacer.</p>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
          >
            {deleting && <CgSpinner className="w-4 h-4 animate-spin" />}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};
