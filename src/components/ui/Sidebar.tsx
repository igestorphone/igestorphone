import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Home,
  FileText,
  Users,
  BarChart3,
  Search,
  Settings,
  HelpCircle,
  FileText as Terms,
  X,
  Brain,
  Building2,
  UserPlus,
  Bug,
  Target,
  ChevronDown
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'

interface SidebarProps {
  onClose: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const {
    canAccessConsultLists,
    canAccessPriceAverages,
    canAccessSearchCheapest
  } = usePermissions()

  const isAdmin = user?.tipo === 'admin'
  const [isAdminOpen, setIsAdminOpen] = useState(true)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      category: 'main'
    },
    {
      name: 'Consultar Listas',
      href: '/consult-lists',
      icon: FileText,
      permission: 'consultar_listas',
      category: 'consultation'
    },
    {
      name: 'Médias de Preço',
      href: '/price-averages',
      icon: BarChart3,
      permission: 'medias_preco',
      category: 'consultation'
    },
    {
      name: 'Buscar iPhone Mais Barato',
      href: '/search-cheapest-iphone',
      icon: Search,
      permission: 'buscar_iphone_barato',
      category: 'consultation'
    }
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

  const supportNavigation = [
    {
      name: 'Termos de Uso',
      href: '/terms',
      icon: Terms,
      category: 'support'
    },
    {
      name: 'Suporte',
      href: '/support',
      icon: HelpCircle,
      category: 'support'
    }
  ]

  const categories = {
    main: { name: 'Principal', icon: Home },
    ai: { name: 'Inteligência Artificial', icon: Brain },
    processing: { name: 'Processamento', icon: FileText },
    consultation: { name: 'Consultas', icon: Search },
    admin: { name: 'Administração', icon: Settings },
    support: { name: 'Suporte', icon: HelpCircle }
  }

  const filteredNavigation = navigation.filter(item => {
    if (isAdmin) {
      return true
    }
    if (item.permission) {
      let hasPermission = false
      switch (item.permission) {
        case 'consultar_listas':
          hasPermission = canAccessConsultLists()
          break
        case 'medias_preco':
          hasPermission = canAccessPriceAverages()
          break
        case 'buscar_iphone_barato':
          hasPermission = canAccessSearchCheapest()
          break
        default:
          hasPermission = true
      }
      return hasPermission
    }
    return true
  })

  const handleLogoClick = () => {
    navigate('/dashboard')
    onClose()
  }

  const NavItem = ({ item, onClick }: { item: any; onClick: () => void }) => {
    return (
      <NavLink
        to={item.href}
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
            isActive
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              : 'text-white/70 hover:text-white hover:bg-white/10'
          }`
        }
      >
        <item.icon className="w-5 h-5" />
        <span className="font-medium">{item.name}</span>
      </NavLink>
    )
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="h-full bg-white/5 backdrop-blur-md border-r border-white/10 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-lg font-bold text-white">iG</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">iGestorPhone</h1>
              <p className="text-xs text-white/60">Sistema Apple</p>
            </div>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-2 overflow-y-auto custom-scrollbar">
        {/* Main Navigation */}
        <div className="space-y-1">
          {filteredNavigation.map((item) => (
            <NavItem key={item.href} item={item} onClick={onClose} />
          ))}
        </div>

        {/* Admin Navigation - ROXO */}
        {isAdmin && (
          <div className="mt-8">
            <button
              onClick={() => setIsAdminOpen((prev) => !prev)}
              className="w-full flex items-center justify-between px-4 py-2 mb-2 rounded-lg text-purple-300 hover:bg-purple-500/10 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Administração</span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${isAdminOpen ? 'rotate-0' : '-rotate-90'}`}
              />
            </button>
            {isAdminOpen && (
              <div className="space-y-1">
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'text-purple-400 hover:bg-purple-500/10'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Support Navigation */}
        <div className="mt-8">
          <div className="flex items-center space-x-2 px-4 py-2 mb-3">
            <HelpCircle className="w-4 h-4 text-white/50" />
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">
              Suporte
            </span>
          </div>
          <div className="space-y-1">
            {supportNavigation.map((item) => (
              <NavItem key={item.href} item={item} onClick={onClose} />
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-center">
          <p className="text-xs text-white/50">
            © 2024 iGestorPhone
          </p>
          <p className="text-xs text-white/40 mt-1">
            Versão 1.0.0
          </p>
        </div>
      </div>
    </motion.div>
  )
}