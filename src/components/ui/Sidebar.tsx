import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  FileText,
  Users,
  Search,
  Settings,
  X,
  Brain,
  Building2,
  UserPlus,
  Bug,
  Target,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Trophy,
  Moon,
  Sun,
  MessageCircle,
  Calendar,
  BarChart3
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useAppStore } from '@/stores/appStore'

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const { theme, sidebarCollapsed, toggleSidebarCollapsed, setTheme } = useAppStore()
  const navigate = useNavigate()
  const {
    canAccessSearchCheapest,
    canAccessPriceAverages
  } = usePermissions()

  const isAdmin = user?.tipo === 'admin'
  const [isAdminOpen, setIsAdminOpen] = useState(true)
  const [isConfigOpen, setIsConfigOpen] = useState(true)
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(true)

  // Navegação principal (topo)
  const mainNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Buscar iPhone Novo', href: '/search-cheapest-iphone', icon: Search, permission: 'buscar_iphone_barato' },
    { name: 'Média de Preço', href: '/price-averages', icon: BarChart3, permission: 'medias_preco' },
    { name: 'Calendário', href: '/calendar', icon: Calendar },
  ]

  // Configurações (seção recolhível)
  const configNavigation = [
    { name: 'Meus Dados', href: '/profile', icon: Users },
    { name: 'Plano & Assinatura', href: '/subscription', icon: CreditCard },
    { name: 'Preferências', href: '/preferences', icon: Settings },
  ]

  const adminNavigation = [
    {
      name: 'Inteligência Artificial',
      href: '/ai',
      icon: Brain,
      category: 'admin'
    },
    {
      name: 'Processar Lista Apple',
      href: '/process-list',
      icon: FileText,
      category: 'admin'
    },
    {
      name: 'Gerenciar Usuários',
      href: '/manage-users',
      icon: Users,
      category: 'admin'
    },
    {
      name: 'Gerenciar Fornecedores',
      href: '/admin/manage-suppliers',
      icon: Building2,
      category: 'admin'
    },
    {
      name: 'Indicações de Fornecedores',
      href: '/supplier-suggestions',
      icon: UserPlus,
      category: 'admin'
    },
    {
      name: 'Reportes de Bug',
      href: '/bug-reports',
      icon: Bug,
      category: 'admin'
    },
    {
      name: 'Metas & Anotações',
      href: '/goals',
      icon: Target,
      category: 'admin'
    }
  ]

  const filteredMainNavigation = mainNavigation.filter(item => {
    if (item.permission) {
      switch (item.permission) {
        case 'buscar_iphone_barato':
          return canAccessSearchCheapest()
        case 'medias_preco':
          return canAccessPriceAverages()
        default:
          return true
      }
    }
    return true
  })

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleLogoClick = () => {
    navigate('/search-cheapest-iphone')
    onClose()
  }

  const NavItem = ({ item, onClick }: { item: any; onClick: () => void }) => {
    const handleClick = () => {
      // No mobile, fecha o sidebar ao clicar em um link
      if (window.innerWidth < 1024) {
        onClose()
      }
      onClick()
    }

    return (
      <NavLink
        to={item.href}
        onClick={handleClick}
        className={({ isActive }) =>
          `flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
            isActive
              ? 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
              : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
          }`
        }
        title={sidebarCollapsed ? item.name : ''}
      >
        <item.icon className="w-5 h-5 flex-shrink-0" />
        {!sidebarCollapsed && <span className="font-medium truncate">{item.name}</span>}
      </NavLink>
    )
  }

  return (
    <div className="h-full bg-white dark:bg-black border-r border-gray-200 dark:border-white/10 flex flex-col shadow-lg relative">
      {/* Toggle Button */}
      <button
        onClick={toggleSidebarCollapsed}
        className="absolute -right-3 top-6 z-10 w-6 h-6 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-md hidden lg:flex"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-4 h-4 text-gray-700 dark:text-white" />
        ) : (
          <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-white" />
        )}
      </button>

      {/* Header */}
      <div className={`${sidebarCollapsed ? 'p-4' : 'p-6'} border-b border-gray-200 dark:border-white/10`}>
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className={`flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer group ${sidebarCollapsed ? 'w-full' : 'w-full'}`}
          >
            <div className="relative flex-shrink-0">
              {/* Logo - Tema Claro (visível quando theme === 'light') */}
              {theme === 'light' ? (
                <img
                  src="/assets/images/logo-light.png"
                  alt="iGestorPhone Logo"
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ) : (
                <img
                  src="/assets/images/logo-dark.png"
                  alt="iGestorPhone Logo"
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
            </div>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
        {/* Principal: Dashboard, Buscar iPhone Novo, Calendário */}
        <div className="space-y-1">
          {filteredMainNavigation.map((item) => (
            <NavItem key={item.href} item={item} onClick={onClose} />
          ))}
        </div>

        {/* Seção Configurações: Meus dados, Plano & Assinatura, Preferências */}
        {!sidebarCollapsed && (
          <div className="mt-6">
            <button
              onClick={() => setIsConfigOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-2 mb-2 rounded-lg text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">Configurações</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isConfigOpen ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            {isConfigOpen && (
              <div className="space-y-1">
                {configNavigation.map((item) => (
                  <NavItem key={item.href} item={item} onClick={onClose} />
                ))}
              </div>
            )}
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mt-6 space-y-1">
            {configNavigation.map((item) => (
              <NavItem key={item.href} item={item} onClick={onClose} />
            ))}
          </div>
        )}

        {/* Seção Preferências: Modo Claro/Escuro, Fale Conosco */}
        {!sidebarCollapsed && (
          <div className="mt-6">
            <button
              onClick={() => setIsPreferencesOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-2 mb-2 rounded-lg text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <span className="text-xs font-semibold uppercase tracking-wider">
                Preferências
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isPreferencesOpen ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            {isPreferencesOpen && (
              <div className="space-y-1">
                {/* Modo Escuro/Claro */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10"
                >
                  {theme === 'light' ? (
                    <Moon className="w-5 h-5 flex-shrink-0" />
                  ) : (
                    <Sun className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="font-medium truncate">
                    {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                  </span>
                </button>
                {/* Fale Conosco */}
                <NavLink
                  to="/support"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose()
                    }
                  }}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                      isActive
                        ? 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                    }`
                  }
                >
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium truncate">Fale Conosco</span>
                </NavLink>
              </div>
            )}
          </div>
        )}
        {sidebarCollapsed && (
          <div className="mt-8 space-y-1">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 group text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10"
              title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 flex-shrink-0" />
              ) : (
                <Sun className="w-5 h-5 flex-shrink-0" />
              )}
            </button>
            <NavLink
              to="/support"
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose()
                }
              }}
              className={({ isActive }) =>
                `flex items-center justify-center px-3 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-blue-500/20 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                    : 'text-gray-700 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                }`
              }
              title="Fale Conosco"
            >
              <MessageCircle className="w-5 h-5 flex-shrink-0" />
            </NavLink>
          </div>
        )}

        {/* Admin Navigation - No final */}
        {isAdmin && (
          <div className="mt-8">
            {!sidebarCollapsed && (
              <button
                onClick={() => setIsAdminOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-4 py-2 mb-2 rounded-lg text-gray-700 dark:text-purple-300 hover:bg-gray-100 dark:hover:bg-purple-500/10 transition-colors"
              >
                <span className="flex items-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Administração</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isAdminOpen ? 'rotate-0' : '-rotate-90'}`}
                />
              </button>
            )}
            {(sidebarCollapsed || isAdminOpen) && (
              <div className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) {
                        onClose()
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center ${sidebarCollapsed ? 'justify-center px-3' : 'space-x-3 px-4'} py-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-purple-500/20 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                          : 'text-gray-700 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-purple-500/10'
                      }`
                    }
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="font-medium truncate">{item.name}</span>}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Footer - User Profile */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 mt-auto">
        {!sidebarCollapsed ? (
          <>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.nome || user?.name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-600 dark:text-white/70 truncate">
                  {user?.email || ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                navigate('/profile')
                if (window.innerWidth < 1024) {
                  onClose()
                }
              }}
              className="w-full px-4 py-2 text-sm text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              Ver Perfil
            </button>
          </>
        ) : (
          <div className="flex justify-center">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}