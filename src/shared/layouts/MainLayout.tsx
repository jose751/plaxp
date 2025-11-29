import React, { useState, useEffect, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/security/hooks/useAuth';
import { ThemeToggle } from '../components';
import { FaChalkboardTeacher, FaSyncAlt, FaCreditCard } from 'react-icons/fa';
import { UserAvatar } from '../../features/users/components/UserAvatar';
import { usePermissions } from '../hooks/usePermissions';

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
        <div className="h-14 flex items-center justify-center border-b border-neutral-200 dark:border-dark-border px-4 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm flex-shrink-0 overflow-hidden whitespace-nowrap">
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

            {/* Separador - Corporativo (solo si tiene permiso de sucursales) */}
            {hasPermission('sucursales.ver') && (
              <>
                <div className={`mt-4 mb-1 px-3 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 hidden' : 'opacity-100'}`}>
                    <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                      Corporativo
                    </p>
                </div>
                {isCollapsed && <div className="h-4"></div>}
              </>
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

            {/* Separador - Financiero (solo si tiene permiso de periodos-lectivos o planes-pago) */}
            {(hasPermission('periodos-lectivos.ver') || hasPermission('planes-pago.ver')) && (
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
        <header className="h-16 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-soft flex items-center justify-between px-4 lg:px-6 border-b border-neutral-200/50 dark:border-dark-border/50 flex-shrink-0">
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
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.correo}</p>
              </div>
              <UserAvatar
                nombre={user?.nombre || 'Usuario'}
                pathFoto={user?.pathFoto}
                size="sm"
                className="ring-2 ring-primary/20 ring-offset-2"
              />
            </div>
            <button
              onClick={handleRefreshPermissions}
              disabled={refreshingPermissions}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200 disabled:opacity-50"
              title="Actualizar permisos"
            >
              <FaSyncAlt className={`w-4 h-4 ${refreshingPermissions ? 'animate-spin' : ''}`} />
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all duration-200"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 md:py-6 md:px-4 bg-gray-100 dark:bg-dark-bg">{children}</main>
      </div>
    </div>
  );
};
