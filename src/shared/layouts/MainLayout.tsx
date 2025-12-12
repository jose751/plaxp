import React, { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/security/hooks/useAuth';
import { ThemeToggle } from '../components';
import { FaChalkboardTeacher, FaSyncAlt, FaCreditCard, FaReceipt, FaUser, FaSignOutAlt, FaCamera, FaClipboardList, FaColumns, FaDoorOpen, FaClock } from 'react-icons/fa';
import { HiX, HiChevronDown } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';
import { UserAvatar } from '../../features/users/components/UserAvatar';
import { usePermissions } from '../hooks/usePermissions';
import { actualizarUsuarioApi } from '../../features/users/api/UsersApi';

interface MainLayoutProps {
  children: ReactNode;
}

/**
 * Modos del sidebar con nombres amigables:
 * - 'expandido': Siempre abierto mostrando iconos y texto
 * - 'compacto': Solo iconos, se expande al pasar el mouse
 * - 'auto': Igual que compacto pero pensado para usuarios que prefieren más espacio
 */
type SidebarMode = 'expandido' | 'compacto' | 'auto';

const SIDEBAR_MODE_KEY = 'plaxp_sidebar_mode';

const sidebarModeLabels: Record<SidebarMode, { label: string; description: string }> = {
  expandido: { label: 'Expandido', description: 'Siempre visible con texto' },
  compacto: { label: 'Compacto', description: 'Solo iconos, fijo' },
  auto: { label: 'Auto', description: 'Iconos, expande al hover' },
};

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  // Estado para móvil (drawer)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // Modo del sidebar (persistente)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    const saved = localStorage.getItem(SIDEBAR_MODE_KEY);
    return (saved as SidebarMode) || 'compacto';
  });
  // Estado para hover (solo aplica en modo compacto/auto)
  const [isHovered, setIsHovered] = useState(false);
  // Menú de modos abierto
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  // Estado para el refresh de permisos
  const [refreshingPermissions, setRefreshingPermissions] = useState(false);

  const { user, logout, refreshPermissions } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  // Estado para el dropdown del usuario
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });

  // Estado para el modal de editar perfil
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    contrasena: '',
    confirmarContrasena: '',
  });
  const [profileFoto, setProfileFoto] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  // Persistir modo en localStorage
  useEffect(() => {
    localStorage.setItem(SIDEBAR_MODE_KEY, sidebarMode);
  }, [sidebarMode]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefreshPermissions = async () => {
    setRefreshingPermissions(true);
    try {
      await refreshPermissions();
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
    } finally {
      setRefreshingPermissions(false);
    }
  };

  // Cerrar dropdown del usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node) &&
          userButtonRef.current && !userButtonRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [userMenuOpen]);

  // Calcular posición del menú cuando se abre
  const toggleUserMenu = () => {
    if (!userMenuOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
    setUserMenuOpen(!userMenuOpen);
  };

  // Abrir modal de perfil
  const openProfileModal = () => {
    setProfileForm({
      nombre: user?.nombre || '',
      contrasena: '',
      confirmarContrasena: '',
    });
    setProfileFoto(null);
    setProfilePreviewUrl(null);
    setProfileError(null);
    setProfileSuccess(false);
    setProfileModalOpen(true);
    setUserMenuOpen(false);
  };

  // Cerrar modal de perfil
  const closeProfileModal = () => {
    if (!profileLoading) {
      setProfileModalOpen(false);
      setProfileError(null);
      setProfileSuccess(false);
    }
  };

  // Manejar foto de perfil
  const handleProfileFotoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setProfileError('El archivo debe ser una imagen');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setProfileError('La imagen no debe superar los 5MB');
        return;
      }
      setProfileFoto(file);
      setProfilePreviewUrl(URL.createObjectURL(file));
      setProfileError(null);
    }
  }, []);

  // Guardar perfil
  const handleSaveProfile = async () => {
    setProfileError(null);

    // Validaciones
    if (!profileForm.nombre.trim()) {
      setProfileError('El nombre es requerido');
      return;
    }
    if (profileForm.nombre.trim().length < 3) {
      setProfileError('El nombre debe tener al menos 3 caracteres');
      return;
    }
    if (profileForm.contrasena && profileForm.contrasena.length < 6) {
      setProfileError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (profileForm.contrasena !== profileForm.confirmarContrasena) {
      setProfileError('Las contraseñas no coinciden');
      return;
    }

    setProfileLoading(true);

    try {
      const updateData: any = {
        nombre: profileForm.nombre.trim(),
        correo: user?.correo || '',
        estado: 1,
        idRol: user?.idRol || '',
      };

      if (profileForm.contrasena) {
        updateData.contrasena = profileForm.contrasena;
      }

      const response = await actualizarUsuarioApi(
        user?.id || '',
        updateData,
        profileFoto || undefined
      );

      if (response.success) {
        setProfileSuccess(true);
        // Refrescar los datos del usuario
        await refreshPermissions();
        setTimeout(() => {
          closeProfileModal();
        }, 1500);
      } else {
        setProfileError(response.message || 'Error al actualizar el perfil');
      }
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      setProfileError(error.message || 'Error al actualizar el perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  // Determinar si el sidebar está colapsado visualmente
  // En móvil: nunca colapsado (siempre drawer completo)
  // En desktop: depende del modo y hover
  const isCollapsed = (() => {
    if (mobileSidebarOpen) return false; // Móvil abierto = expandido
    if (sidebarMode === 'expandido') return false;
    if (sidebarMode === 'compacto') return true; // Siempre colapsado, NO expande con hover
    if (sidebarMode === 'auto') return !isHovered; // Se expande con hover
    return true;
  })();

  // Ancho del sidebar según estado
  const sidebarWidth = isCollapsed ? 'lg:w-20' : 'lg:w-64';
  const marginLeft = sidebarMode === 'expandido' ? 'lg:ml-64' : 'lg:ml-20';

  // Cerrar menú de modos al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => setModeMenuOpen(false);
    if (modeMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [modeMenuOpen]);

  return (
    <div className="h-screen bg-neutral-100 dark:bg-dark-bg flex overflow-hidden">

      {/* Overlay para móvil */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        onMouseEnter={() => {
          if (sidebarMode !== 'expandido') setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setModeMenuOpen(false);
        }}
        className={`
          fixed inset-y-0 left-0 z-50 h-screen
          flex flex-col border-r border-neutral-200 dark:border-dark-border
          bg-gradient-to-b from-white to-neutral-50 dark:from-dark-card dark:to-dark-bg shadow-strong
          transition-all duration-300 ease-in-out

          /* Móvil: drawer que se abre/cierra */
          ${mobileSidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0'}

          /* Desktop: ancho según modo y hover */
          ${sidebarWidth}
          ${!isCollapsed && sidebarMode !== 'expandido' ? 'lg:shadow-2xl' : ''}
        `}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-center border-b border-neutral-200 dark:border-dark-border px-4 bg-white dark:bg-dark-card flex-shrink-0 overflow-hidden whitespace-nowrap">
          <div className="flex items-center justify-center w-full transition-all duration-300">
            {isCollapsed && !mobileSidebarOpen ? (
              <img src="/icono.png" alt="Plaxp" className="w-8 h-8 object-contain transform hover:scale-110 transition-transform" />
            ) : (
              <>
                <img src="/logo_claro.png" alt="Plaxp Logo" className="h-8 object-contain dark:hidden" />
                <img src="/logo_oscuro.png" alt="Plaxp Logo" className="h-8 object-contain hidden dark:block" />
              </>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="space-y-1">

            {/* Dashboard */}
            <Link
              to="/dashboard"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                ${location.pathname === '/dashboard'
                  ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5 text-blue-600 shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                }
              `}
            >
              {location.pathname === '/dashboard' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full"></div>
              )}

              <div className={`
                relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                ${location.pathname === '/dashboard'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Dashboard
              </span>
            </Link>

            {/* Separador - Académico (solo si tiene permisos) */}
            {(hasPermission('estudiantes.ver') || hasPermission('profesores.ver') || hasPermission('cursos.ver') || hasPermission('categorias.ver')) && (
              <>
                <div className={`mt-4 mb-1 px-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Académico
                    </p>
                </div>
                {isCollapsed && <div className="h-4"></div>}
              </>
            )}

            {/* Estudiantes */}
            {hasPermission('estudiantes.ver') && (
              <Link
                to="/estudiantes"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname === '/estudiantes'
                    ? 'bg-gradient-to-r from-indigo-500/15 to-indigo-500/5 text-indigo-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname === '/estudiantes' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-500 to-indigo-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname === '/estudiantes'
                    ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30'
                    : 'bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Estudiantes
                </span>
              </Link>
            )}

            {/* Profesores */}
            {hasPermission('profesores.ver') && (
              <Link
                to="/profesores"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname.startsWith('/profesores')
                    ? 'bg-gradient-to-r from-cyan-500/15 to-cyan-500/5 text-cyan-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname.startsWith('/profesores') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-cyan-500 to-cyan-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname.startsWith('/profesores')
                    ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md shadow-cyan-500/30'
                    : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/30'
                  }
                `}>
                  <FaChalkboardTeacher className="w-4 h-4 text-white" />
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Profesores
                </span>
              </Link>
            )}

            {/* Cursos */}
            {hasPermission('cursos.ver') && (
              <Link
                to="/cursos"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname === '/cursos'
                    ? 'bg-gradient-to-r from-violet-500/15 to-violet-500/5 text-violet-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname === '/cursos' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-violet-500 to-violet-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname === '/cursos'
                    ? 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30'
                    : 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Cursos
                </span>
              </Link>
            )}

            {/* Categorías */}
            {hasPermission('categorias.ver') && (
              <Link
                to="/categorias"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname === '/categorias'
                    ? 'bg-gradient-to-r from-amber-500/15 to-amber-500/5 text-amber-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname === '/categorias' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-amber-500 to-amber-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname === '/categorias'
                    ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/30'
                    : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Categorías de Cursos
                </span>
              </Link>
            )}

            {/* Aulas */}
            <Link
              to="/aulas"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                ${location.pathname.startsWith('/aulas')
                  ? 'bg-gradient-to-r from-lime-500/15 to-lime-500/5 text-lime-600 shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                }
              `}
            >
              {location.pathname.startsWith('/aulas') && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-lime-500 to-lime-600 rounded-r-full"></div>
              )}
              <div className={`
                relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                ${location.pathname.startsWith('/aulas')
                  ? 'bg-gradient-to-br from-lime-500 to-lime-600 shadow-md shadow-lime-500/30'
                  : 'bg-gradient-to-br from-lime-500 to-lime-600 shadow-md shadow-lime-500/20 group-hover:shadow-lime-500/30'
                }
              `}>
                <FaDoorOpen className="w-4 h-4 text-white" />
              </div>
              <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Aulas
              </span>
            </Link>

            {/* Horarios */}
            <Link
              to="/horarios"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                ${location.pathname.startsWith('/horarios')
                  ? 'bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-600 shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                }
              `}
            >
              {location.pathname.startsWith('/horarios') && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-r-full"></div>
              )}
              <div className={`
                relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                ${location.pathname.startsWith('/horarios')
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/30'
                }
              `}>
                <FaClock className="w-4 h-4 text-white" />
              </div>
              <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Horarios
              </span>
            </Link>

            {/* Separador - CRM */}
            {hasPermission('crm.ver') && (
              <>
                <div className={`mt-4 mb-1 px-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      CRM
                    </p>
                </div>
                {isCollapsed && <div className="h-4"></div>}
              </>
            )}

            {/* Pipeline CRM */}
            {hasPermission('crm.ver') && (
              <Link
                to="/crm"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname === '/crm'
                    ? 'bg-gradient-to-r from-pink-500/15 to-pink-500/5 text-pink-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname === '/crm' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-pink-500 to-pink-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname === '/crm'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-md shadow-pink-500/30'
                    : 'bg-gradient-to-br from-pink-500 to-pink-600 shadow-md shadow-pink-500/20 group-hover:shadow-pink-500/30'
                  }
                `}>
                  <FaColumns className="w-4 h-4 text-white" />
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Etapa de Ventas
                </span>
              </Link>
            )}

            {/* Leads CRM */}
            {hasPermission('crm.ver') && (
              <Link
                to="/crm/leads"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname.startsWith('/crm/leads')
                    ? 'bg-gradient-to-r from-fuchsia-500/15 to-fuchsia-500/5 text-fuchsia-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname.startsWith('/crm/leads') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-fuchsia-500 to-fuchsia-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname.startsWith('/crm/leads')
                    ? 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-md shadow-fuchsia-500/30'
                    : 'bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 shadow-md shadow-fuchsia-500/20 group-hover:shadow-fuchsia-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Leads
                </span>
              </Link>
            )}

            {/* Calendario CRM */}
            {hasPermission('crm.ver') && (
              <Link
                to="/crm/calendario"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname === '/crm/calendario'
                    ? 'bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname === '/crm/calendario' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname === '/crm/calendario'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30'
                    : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Calendario
                </span>
              </Link>
            )}

            {/* Separador - Financiero */}
            {(hasPermission('periodos-lectivos.ver') || hasPermission('planes-pago.ver') || true) && (
              <>
                <div className={`mt-4 mb-1 px-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Financiero
                    </p>
                </div>
                {isCollapsed && <div className="h-4"></div>}
              </>
            )}

            {/* Periodos Lectivos */}
            {hasPermission('periodos-lectivos.ver') && (
              <Link
                to="/periodos-lectivos"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname.startsWith('/periodos-lectivos')
                    ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname.startsWith('/periodos-lectivos') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname.startsWith('/periodos-lectivos')
                    ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30'
                    : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Periodos Lectivos
                </span>
              </Link>
            )}

            {/* Planes de Pago */}
            {hasPermission('planes-pago.ver') && (
              <Link
                to="/planes-pago"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname.startsWith('/planes-pago')
                    ? 'bg-gradient-to-r from-rose-500/15 to-rose-500/5 text-rose-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname.startsWith('/planes-pago') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-rose-500 to-rose-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname.startsWith('/planes-pago')
                    ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-500/30'
                    : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-md shadow-rose-500/20 group-hover:shadow-rose-500/30'
                  }
                `}>
                  <FaCreditCard className="w-4 h-4 text-white" />
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Planes de Pago
                </span>
              </Link>
            )}

            {/* Matrículas */}
            <Link
              to="/matriculas"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                ${location.pathname.startsWith('/matriculas')
                  ? 'bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-600 shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                }
              `}
            >
              {location.pathname.startsWith('/matriculas') && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-r-full"></div>
              )}
              <div className={`
                relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                ${location.pathname.startsWith('/matriculas')
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/30'
                }
              `}>
                <FaClipboardList className="w-4 h-4 text-white" />
              </div>
              <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Matrículas
              </span>
            </Link>

            {/* Pagos */}
            <Link
              to="/pagos"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                ${location.pathname.startsWith('/pagos')
                  ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-600 shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                }
              `}
            >
              {location.pathname.startsWith('/pagos') && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-r-full"></div>
              )}
              <div className={`
                relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                ${location.pathname.startsWith('/pagos')
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30'
                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30'
                }
              `}>
                <FaReceipt className="w-4 h-4 text-white" />
              </div>
              <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Pagos
              </span>
            </Link>

            {/* Separador - Administración (solo si tiene permisos de usuarios o roles) */}
            {(hasPermission('usuarios.ver') || hasPermission('roles.ver')) && (
              <>
                <div className={`mt-4 mb-1 px-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Administración
                    </p>
                </div>
                {isCollapsed && <div className="h-4"></div>}
              </>
            )}

            {/* Usuarios */}
            {hasPermission('usuarios.ver') && (
              <Link
                to="/usuarios"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname === '/usuarios'
                    ? 'bg-gradient-to-r from-purple-500/15 to-purple-500/5 text-purple-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname === '/usuarios' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-500 to-purple-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname === '/usuarios'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/30'
                    : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Usuarios
                </span>
              </Link>
            )}

            {/* Roles */}
            {hasPermission('roles.ver') && (
              <Link
                to="/roles"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname === '/roles'
                    ? 'bg-gradient-to-r from-teal-500/15 to-teal-500/5 text-teal-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname === '/roles' && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-teal-500 to-teal-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname === '/roles'
                    ? 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/30'
                    : 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Roles
                </span>
              </Link>
            )}

            {/* Sucursales */}
            {hasPermission('sucursales.ver') && (
              <Link
                to="/sucursales"
                onClick={() => setMobileSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                  ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                  ${location.pathname.startsWith('/sucursales')
                    ? 'bg-gradient-to-r from-sky-500/15 to-sky-500/5 text-sky-600 shadow-sm'
                    : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                  }
                `}
              >
                {location.pathname.startsWith('/sucursales') && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-sky-500 to-sky-600 rounded-r-full"></div>
                )}
                <div className={`
                  relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                  ${location.pathname.startsWith('/sucursales')
                    ? 'bg-gradient-to-br from-sky-500 to-sky-600 shadow-md shadow-sky-500/30'
                    : 'bg-gradient-to-br from-sky-500 to-sky-600 shadow-md shadow-sky-500/20 group-hover:shadow-sky-500/30'
                  }
                `}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                  Sucursales
                </span>
              </Link>
            )}

            {/* Separador - Sistema */}
            <div className={`mt-4 mb-1 px-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Sistema
                </p>
            </div>
            {isCollapsed && <div className="h-4"></div>}

            {/* Configuración */}
            <Link
              to="/configuracion"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                ${location.pathname === '/configuracion'
                  ? 'bg-gradient-to-r from-emerald-500/15 to-emerald-500/5 text-emerald-600 shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                }
              `}
            >
              {location.pathname === '/configuracion' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-emerald-500 to-emerald-600 rounded-r-full"></div>
              )}
              <div className={`
                relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                ${location.pathname === '/configuracion'
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/30'
                  : 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-md shadow-emerald-500/20 group-hover:shadow-emerald-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Configuración
              </span>
            </Link>

            {/* Reportes */}
            <Link
              to="/reportes"
              onClick={() => setMobileSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden whitespace-nowrap
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
                ${location.pathname === '/reportes'
                  ? 'bg-gradient-to-r from-orange-500/15 to-orange-500/5 text-orange-600 shadow-sm'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/80 dark:hover:bg-dark-hover'
                }
              `}
            >
              {location.pathname === '/reportes' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-600 rounded-r-full"></div>
              )}
              <div className={`
                relative z-10 p-1.5 rounded-md transition-all duration-200 flex-shrink-0
                ${location.pathname === '/reportes'
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className={`relative z-10 font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                Reportes
              </span>
            </Link>

          </div>
        </nav>

        {/* Footer del Sidebar - Selector de modo (solo visible en desktop) */}
        <div className="hidden lg:block border-t border-neutral-200 dark:border-dark-border p-3">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setModeMenuOpen(!modeMenuOpen);
              }}
              className={`
                w-full flex items-center gap-3 py-2 rounded-lg transition-all duration-200
                text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100/80 dark:hover:bg-dark-hover
                ${isCollapsed ? 'justify-center px-0' : 'px-3'}
              `}
              title="Cambiar modo del menú"
            >
              {/* Icono según modo actual */}
              <div className="p-1.5 rounded-md bg-neutral-200 dark:bg-dark-hover flex-shrink-0">
                {sidebarMode === 'expandido' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
                {sidebarMode === 'compacto' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                  </svg>
                )}
                {sidebarMode === 'auto' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
              </div>
              <span className={`font-medium text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                {sidebarModeLabels[sidebarMode].label}
              </span>
              {!isCollapsed && (
                <svg className={`w-4 h-4 ml-auto transition-transform ${modeMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>

            {/* Menú de selección de modo */}
            {modeMenuOpen && (
              <div
                className={`
                  absolute bottom-full mb-2 bg-white dark:bg-dark-card rounded-lg shadow-xl border border-neutral-200 dark:border-dark-border overflow-hidden z-50
                  ${isCollapsed ? 'left-full ml-2' : 'left-0 right-0'}
                `}
                onClick={(e) => e.stopPropagation()}
              >
                {(Object.keys(sidebarModeLabels) as SidebarMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSidebarMode(mode);
                      setModeMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${sidebarMode === mode
                        ? 'bg-primary/10 text-primary'
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover'
                      }
                    `}
                  >
                    <div className={`p-1 rounded ${sidebarMode === mode ? 'bg-primary/20' : 'bg-neutral-200 dark:bg-dark-hover'}`}>
                      {mode === 'expandido' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      )}
                      {mode === 'compacto' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
                        </svg>
                      )}
                      {mode === 'auto' && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{sidebarModeLabels[mode].label}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">{sidebarModeLabels[mode].description}</p>
                    </div>
                    {sidebarMode === mode && (
                      <svg className="w-4 h-4 ml-auto text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col h-screen overflow-hidden ${marginLeft}`}>
        {/* Header */}
        <header className="h-16 bg-white dark:bg-dark-card shadow-soft flex items-center justify-between px-4 lg:px-6 border-b border-neutral-200 dark:border-dark-border flex-shrink-0">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="lg:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1></h1>

          <div className="flex items-center gap-2 lg:gap-4">
            {/* Botón del usuario */}
            <button
              ref={userButtonRef}
              onClick={toggleUserMenu}
              className="flex items-center gap-2 lg:gap-3 p-1.5 lg:p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-dark-hover transition-all duration-200"
            >
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.correo}</p>
              </div>
              <UserAvatar
                nombre={user?.nombre || 'Usuario'}
                pathFoto={user?.pathFoto}
                size="sm"
                className="ring-2 ring-primary/20 ring-offset-2 dark:ring-offset-dark-card"
              />
              <HiChevronDown className={`w-4 h-4 text-neutral-500 dark:text-neutral-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 md:py-6 md:px-4 bg-gray-100 dark:bg-dark-bg">{children}</main>
      </div>

      {/* Dropdown del usuario - renderizado con Portal */}
      {userMenuOpen && createPortal(
        <div
          ref={userMenuRef}
          className="w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-neutral-200 dark:border-dark-border py-1"
          style={{
            position: 'fixed',
            top: menuPosition.top,
            right: menuPosition.right,
            zIndex: 2147483647
          }}
        >
          <button
            onClick={openProfileModal}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors"
          >
            <FaUser className="w-4 h-4 text-neutral-500" />
            <span>Mi Perfil</span>
          </button>

          <button
            onClick={() => { handleRefreshPermissions(); setUserMenuOpen(false); }}
            disabled={refreshingPermissions}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-dark-hover transition-colors disabled:opacity-50"
          >
            <FaSyncAlt className={`w-4 h-4 text-neutral-500 ${refreshingPermissions ? 'animate-spin' : ''}`} />
            <span>Actualizar permisos</span>
          </button>

          <div className="my-1 border-t border-neutral-200 dark:border-dark-border"></div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <FaSignOutAlt className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>,
        document.body
      )}

      {/* Modal de editar perfil */}
      {profileModalOpen && createPortal(
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483647,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
          onClick={(e) => { if (e.target === e.currentTarget) closeProfileModal(); }}
        >
          <div
            className="bg-white dark:bg-dark-card rounded-xl shadow-xl border border-neutral-200 dark:border-dark-border"
            style={{ width: '100%', maxWidth: '420px', margin: '0 16px' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-dark-border">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Editar Perfil</h2>
              <button
                onClick={closeProfileModal}
                disabled={profileLoading}
                className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {/* Loading */}
              {profileLoading && (
                <div className="flex items-center justify-center py-8">
                  <CgSpinner className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              )}

              {/* Success */}
              {profileSuccess && !profileLoading && (
                <div className="flex flex-col items-center py-8">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Perfil actualizado</p>
                </div>
              )}

              {/* Formulario */}
              {!profileLoading && !profileSuccess && (
                <div className="space-y-4">
                  {/* Error */}
                  {profileError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
                    </div>
                  )}

                  {/* Foto de perfil */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Foto de perfil
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-neutral-200 dark:bg-dark-hover flex-shrink-0">
                        {profilePreviewUrl ? (
                          <img src={profilePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : user?.pathFoto ? (
                          <img src={user.pathFoto} alt="Foto actual" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                            <span className="text-purple-600 dark:text-purple-400 text-xl font-semibold">
                              {user?.nombre?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          ref={profileFileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleProfileFotoChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => profileFileInputRef.current?.click()}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                        >
                          <FaCamera className="w-3.5 h-3.5" />
                          Cambiar foto
                        </button>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">JPG, PNG o WebP. Máx 5MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={profileForm.nombre}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, nombre: e.target.value }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>

                  {/* Correo (disabled) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Correo
                    </label>
                    <input
                      type="email"
                      value={user?.correo || ''}
                      disabled
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-dark-border rounded-lg text-sm bg-neutral-50 dark:bg-dark-hover text-neutral-500 cursor-not-allowed"
                    />
                  </div>

                  {/* Rol (disabled) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Rol
                    </label>
                    <input
                      type="text"
                      value={user?.nombreRol || ''}
                      disabled
                      className="w-full px-3 py-2 border border-neutral-200 dark:border-dark-border rounded-lg text-sm bg-neutral-50 dark:bg-dark-hover text-neutral-500 cursor-not-allowed"
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Cambiar contraseña (opcional)</p>

                    {/* Nueva contraseña */}
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Nueva contraseña
                      </label>
                      <input
                        type="password"
                        value={profileForm.contrasena}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, contrasena: e.target.value }))}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>

                    {/* Confirmar */}
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                        Confirmar contraseña
                      </label>
                      <input
                        type="password"
                        value={profileForm.confirmarContrasena}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, confirmarContrasena: e.target.value }))}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-dark-border rounded-lg text-sm bg-white dark:bg-dark-bg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!profileLoading && !profileSuccess && (
              <div className="flex gap-3 px-5 py-4 border-t border-neutral-200 dark:border-dark-border">
                <button
                  onClick={closeProfileModal}
                  className="flex-1 px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-hover rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Guardar
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
