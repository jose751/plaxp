import { useState, useEffect } from 'react';
import { HiX, HiUserAdd } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { asignarLeadApi } from '../api/crmApi';

interface Usuario {
  id: string;
  nombre: string;
  correo: string;
}

interface AsignarLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  leadId: string;
  usuarios: Usuario[];
  usuariosAsignados: string[];
}

export const AsignarLeadModal = ({
  isOpen,
  onClose,
  onSuccess,
  leadId,
  usuarios,
  usuariosAsignados,
}: AsignarLeadModalProps) => {
  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUsuarios(usuariosAsignados);
    }
  }, [isOpen, usuariosAsignados]);

  const toggleUsuario = (usuarioId: string) => {
    setSelectedUsuarios(prev =>
      prev.includes(usuarioId)
        ? prev.filter(id => id !== usuarioId)
        : [...prev, usuarioId]
    );
  };

  const handleSave = async () => {
    if (selectedUsuarios.length === 0) return;

    setSaving(true);
    try {
      const response = await asignarLeadApi(leadId, {
        usuarioIds: selectedUsuarios,
        sobrescribir: true
      });

      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error asignando lead:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-neutral-200 dark:border-dark-border w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <HiUserAdd className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                Asignar Lead
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Selecciona los usuarios responsables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-xl transition-colors"
          >
            <HiX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="max-h-64 overflow-y-auto border border-neutral-300 dark:border-dark-border rounded-xl p-2 space-y-1">
            {usuarios.map(usuario => (
              <label
                key={usuario.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-dark-hover cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUsuarios.includes(usuario.id)}
                  onChange={() => toggleUsuario(usuario.id)}
                  className="w-4 h-4 text-primary bg-white border-neutral-300 rounded focus:ring-primary/30"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                    {usuario.nombre}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">{usuario.correo}</p>
                </div>
              </label>
            ))}
          </div>
          {selectedUsuarios.length > 0 && (
            <p className="text-xs text-neutral-500 mt-2">
              {selectedUsuarios.length} usuario(s) seleccionado(s)
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-neutral-200 dark:border-dark-border bg-neutral-50 dark:bg-dark-bg rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-dark-hover rounded-xl transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={selectedUsuarios.length === 0 || saving}
            className="flex-1 px-4 py-2.5 text-sm bg-primary hover:bg-primary/90 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
          >
            {saving && <CgSpinner className="w-4 h-4 animate-spin" />}
            Asignar
          </button>
        </div>
      </div>
    </div>
  );
};
