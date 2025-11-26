import React, { useState, type ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/security/hooks/useAuth';
import { ThemeToggle } from '../components';
import { FaChalkboardTeacher } from 'react-icons/fa';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-neutral-100 dark:bg-dark-bg flex overflow-hidden">
      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64 h-screen bg-gradient-to-b from-white to-neutral-50 dark:from-dark-card dark:to-dark-bg shadow-strong transition-all duration-300 flex flex-col border-r border-neutral-200 dark:border-dark-border
        `}
      >
        {/* Logo - Reducido a h-14 para ahorrar espacio */}
        <div className="h-14 flex items-center justify-center border-b border-neutral-200 dark:border-dark-border px-4 bg-white/50 dark:bg-dark-card/50 backdrop-blur-sm flex-shrink-0">
          {sidebarCollapsed ? (
            <img src="/icono.png" alt="Plaxp" className="w-8 h-8 object-contain transform hover:scale-110 transition-transform" />
          ) : (
            <>
              <img src="/logo_claro.png" alt="Plaxp Logo" className="h-8 object-contain dark:hidden" />
              <img src="/logo_oscuro.png" alt="Plaxp Logo" className="h-8 object-contain hidden dark:block" />
            </>
          )}
        </div>

        {/* Navigation Menu - Padding vertical reducido a py-4 */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="space-y-1"> {/* Space-y reducido de 1.5 a 1 */}
            
            {/* Dashboard - Changed py-3 to py-2 */}
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname === '/dashboard'
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/30'
                  : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <span className="relative z-10 font-medium text-sm">Dashboard</span>
              )}
            </Link>

            {/* Separador Compacto - Administración */}
            {!sidebarCollapsed && (
              <div className="mt-4 mb-1 px-3">
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Administración
                </p>
              </div>
            )}
            {sidebarCollapsed && <div className="h-4"></div>}

            {/* Usuarios */}
            <Link
              to="/usuarios"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname === '/usuarios'
                  ? 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/30'
                  : 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Usuarios</span>}
            </Link>

            {/* Roles */}
            <Link
              to="/roles"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname === '/roles'
                  ? 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/30'
                  : 'bg-gradient-to-br from-teal-500 to-teal-600 shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Roles</span>}
            </Link>

            {/* Separador Compacto - Académico */}
            {!sidebarCollapsed && (
              <div className="mt-4 mb-1 px-3">
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Académico
                </p>
              </div>
            )}
            {sidebarCollapsed && <div className="h-4"></div>}

            {/* Estudiantes */}
            <Link
              to="/estudiantes"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
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
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Estudiantes</span>}
            </Link>

            {/* Profesores */}
            <Link
              to="/profesores"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname.startsWith('/profesores')
                  ? 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md shadow-cyan-500/30'
                  : 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-md shadow-cyan-500/20 group-hover:shadow-cyan-500/30'
                }
              `}>
                <FaChalkboardTeacher className="w-4 h-4 text-white" />
              </div>
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Profesores</span>}
            </Link>

            {/* Cursos */}
            <Link
              to="/cursos"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname === '/cursos'
                  ? 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/30'
                  : 'bg-gradient-to-br from-violet-500 to-violet-600 shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Cursos</span>}
            </Link>

            {/* Categorías */}
            <Link
              to="/categorias"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname === '/categorias'
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/30'
                  : 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-md shadow-amber-500/20 group-hover:shadow-amber-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Categorías</span>}
            </Link>

            {/* Separador Compacto - Corporativo */}
            {!sidebarCollapsed && (
              <div className="mt-4 mb-1 px-3">
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Corporativo
                </p>
              </div>
            )}
            {sidebarCollapsed && <div className="h-4"></div>}

            {/* Sucursales */}
            <Link
              to="/sucursales"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname.startsWith('/sucursales')
                  ? 'bg-gradient-to-br from-sky-500 to-sky-600 shadow-md shadow-sky-500/30'
                  : 'bg-gradient-to-br from-sky-500 to-sky-600 shadow-md shadow-sky-500/20 group-hover:shadow-sky-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Sucursales</span>}
            </Link>

            {/* Separador Compacto - Sistema */}
            {!sidebarCollapsed && (
              <div className="mt-4 mb-1 px-3">
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  Sistema
                </p>
              </div>
            )}
            {sidebarCollapsed && <div className="h-4"></div>}

            {/* Configuración */}
            <Link
              to="/configuracion"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
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
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Configuración</span>}
            </Link>

            {/* Reportes */}
            <Link
              to="/reportes"
              onClick={() => setSidebarOpen(false)}
              className={`
                group flex items-center gap-3 py-2 rounded-lg transition-all duration-200 relative overflow-hidden
                ${sidebarCollapsed ? 'justify-center px-0' : 'px-3'}
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
                relative z-10 p-1.5 rounded-md transition-all duration-200
                ${location.pathname === '/reportes'
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/30'
                  : 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20 group-hover:shadow-orange-500/30'
                }
              `}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              {!sidebarCollapsed && <span className="relative z-10 font-medium text-sm">Reportes</span>}
            </Link>

          </div>
        </nav>

        {/* Toggle Sidebar Button */}
        <div className="hidden lg:block border-t border-neutral-200 dark:border-dark-border p-2 bg-white/50 dark:bg-dark-card/50">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:text-primary text-neutral-600 dark:text-neutral-400 transition-all duration-200 group"
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md shadow-soft flex items-center justify-between px-4 lg:px-6 border-b border-neutral-200/50 dark:border-dark-border/50 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-neutral-600 dark:text-neutral-400 hover:bg-primary/10 hover:text-primary rounded-lg transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Plaxp</h1>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{user?.correo}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-primary/20 ring-offset-2">
                <span className="text-white font-bold text-sm">{user?.nombre?.[0]?.toUpperCase() || 'U'}</span>
              </div>
            </div>
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