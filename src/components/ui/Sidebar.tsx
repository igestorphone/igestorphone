import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Settings,
  X,
  ChevronDown,
  FileText,
  Users,
  Building2,
  UserPlus,
  Bug,
  Activity,
  Code2,
  CreditCard,
  MessageCircle,
  Monitor,
  Moon,
  Sun,
  LogOut,
  User,
  Clock,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { usePermissions } from '@/hooks/usePermissions'
import { useAppStore } from '@/stores/appStore'
import { calendarDaysRemainingSaoPaulo } from '@/lib/subscriptionExpiryCalendar'

interface SidebarProps {
  onClose: () => void
}

const adminNavigation = [
  { name: 'Processar lista', href: '/process-list', icon: FileText },
  { name: 'Gerenciar Usuários', href: '/manage-users', icon: Users },
  { name: 'Gerenciar Fornecedores', href: '/admin/manage-suppliers', icon: Building2 },
  { name: 'Indicações de Fornecedores', href: '/supplier-suggestions', icon: UserPlus },
  { name: 'Monitor ao vivo', href: '/admin/monitor', icon: Activity },
  { name: 'Reportes de Bug', href: '/bug-reports', icon: Bug },
  { name: 'Controle de TI', href: '/dev-log', icon: Code2 },
]

const userLinks = [
  { name: 'Meus Dados', href: '/profile', icon: User },
  { name: 'Dispositivos', href: '/devices', icon: Monitor },
  { name: 'Assinatura', href: '/subscription', icon: CreditCard },
  { name: 'Fale Conosco', href: '/support', icon: MessageCircle },
]

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useAppStore()
  const { canAccessSearchCheapest } = usePermissions()
  const isAdmin = user?.tipo === 'admin'
  const [isAdminOpen, setIsAdminOpen] = useState(false)

  const subscriptionDaysLeft = calendarDaysRemainingSaoPaulo(user?.subscription_expires_at)
  const subscriptionUrgent =
    user?.subscription_status === 'overdue' ||
    user?.subscription_status === 'pending_payment' ||
    (subscriptionDaysLeft !== null && subscriptionDaysLeft <= 7)

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  const firstName = (user?.nome || user?.name || 'Usuário').trim().split(' ')[0] || 'Usuário'

  const mainRowClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl text-[15px] font-semibold transition-colors ${
      isActive
        ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
        : 'bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10'
    }`

  const userRowClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
        : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10'
    }`

  return (
    <div className="bg-white dark:bg-black flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/10 max-h-[calc(100dvh-1rem)]">
      {/* Cabeçalho: logo + tema + fechar */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
        <img
          src={theme === 'dark' ? '/assets/images/logo-dark.png' : '/assets/images/logo-light.png'}
          alt="iGestorPhone"
          className="h-9 w-auto object-contain"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-white" />
            ) : (
              <Moon className="w-5 h-5 text-gray-700" />
            )}
          </button>
          <button
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
          >
            <X className="w-5 h-5 text-gray-700 dark:text-white" />
          </button>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 custom-scrollbar">
        {user && subscriptionDaysLeft !== null && (
          <Link
            to="/subscription"
            onClick={onClose}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-colors ${
              subscriptionUrgent
                ? 'border-amber-300/80 bg-amber-50 hover:bg-amber-100/90 dark:border-amber-500/40 dark:bg-amber-500/10 dark:hover:bg-amber-500/15'
                : 'border-emerald-200/80 bg-emerald-50 hover:bg-emerald-100/80 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15'
            }`}
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                subscriptionUrgent
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
              }`}
            >
              <Clock className="w-5 h-5" />
            </span>
            <span className="min-w-0 text-left leading-tight">
              <span className="block text-[15px] font-bold text-gray-900 dark:text-white">
                {subscriptionDaysLeft} dias restantes
              </span>
              <span className="block text-xs text-gray-500 dark:text-white/60">Toque para ver a assinatura</span>
            </span>
          </Link>
        )}

        {canAccessSearchCheapest() && (
          <NavLink to="/search-cheapest-iphone" onClick={onClose} className={mainRowClass}>
            <Search className="w-5 h-5 shrink-0" />
            <span>Preços</span>
          </NavLink>
        )}

        {isAdmin && (
          <div>
            <button
              onClick={() => setIsAdminOpen((v) => !v)}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl text-[15px] font-semibold bg-gray-50 text-gray-800 hover:bg-gray-100 dark:bg-white/5 dark:text-white/90 dark:hover:bg-white/10 transition-colors"
            >
              <span className="flex items-center gap-3">
                <Settings className="w-5 h-5 shrink-0" />
                Administração
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAdminOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {isAdminOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-1 space-y-1 pl-2"
                >
                  {adminNavigation.map((item) => (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                            : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </nav>

      {/* Rodapé: usuário */}
      <div className="border-t border-gray-100 dark:border-white/10 px-3 py-3 space-y-1 shrink-0">
        <div className="flex items-center gap-2 px-4 py-2 text-sm">
          <User className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="text-gray-500 dark:text-white/60">Logado como:</span>
          <span className="font-semibold text-gray-900 dark:text-white truncate">{firstName}</span>
        </div>
        {userLinks.map((item) => (
          <NavLink key={item.href} to={item.href} onClick={onClose} className={userRowClass}>
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.name}</span>
          </NavLink>
        ))}
        <button
          onClick={() => {
            logout()
            onClose()
          }}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  )
}
