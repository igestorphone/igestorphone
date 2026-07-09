import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  LogOut,
  User,
  UserPlus,
  Bug,
  Moon,
  Sun,
  Clock,
  Monitor,
  Search,
  Settings,
  ChevronDown,
  FileText,
  Users,
  Building2,
  Activity,
  Code2,
  CreditCard,
  MessageCircle,
  Star,
} from 'lucide-react'
import AvatarDisplay from '@/components/ui/AvatarDisplay'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { useNavigate } from 'react-router-dom'
import ReportBugModal from '@/components/forms/ReportBugModal'
import { calendarDaysRemainingSaoPaulo } from '@/lib/subscriptionExpiryCalendar'

const adminNavigation = [
  { name: 'Processar lista', href: '/process-list', icon: FileText },
  { name: 'Gerenciar Usuários', href: '/manage-users', icon: Users },
  { name: 'Gerenciar Fornecedores', href: '/admin/manage-suppliers', icon: Building2 },
  { name: 'Indicações de Fornecedores', href: '/supplier-suggestions', icon: UserPlus },
  { name: 'Monitor ao vivo', href: '/admin/monitor', icon: Activity },
  { name: 'Reportes de Bug', href: '/bug-reports', icon: Bug },
  { name: 'Controle de TI', href: '/dev-log', icon: Code2 },
]

export default function Header() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, theme, setTheme } = useAppStore()
  const isAdmin = user?.tipo === 'admin'
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAdminMenu, setShowAdminMenu] = useState(false)
  const [showBugModal, setShowBugModal] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const navigate = useNavigate()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  const adminMenuRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  /** Re-render após meia-noite (SP) para o contador de dias baixar sem recarregar a página. */
  const [dayTick, setDayTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setDayTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const subscriptionDaysLeft = useMemo(
    () => calendarDaysRemainingSaoPaulo(user?.subscription_expires_at),
    [user?.subscription_expires_at, dayTick]
  )

  const subscriptionUrgent =
    user?.subscription_status === 'overdue' ||
    user?.subscription_status === 'pending_payment' ||
    (subscriptionDaysLeft !== null && subscriptionDaysLeft <= 7)

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  const topNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-out will-change-transform hover:-translate-y-0.5 ${
      isActive
        ? 'bg-gray-900 text-white shadow-md shadow-gray-900/25 hover:shadow-lg hover:shadow-gray-900/30 dark:bg-white dark:text-black dark:shadow-white/15 dark:hover:shadow-white/25'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 hover:shadow-md hover:shadow-gray-900/10 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10 dark:hover:shadow-black/30'
    }`

  useEffect(() => {
    const readScroll = () => {
      const y =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      setScrolled(y > 4)
    }
    readScroll()
    window.addEventListener('scroll', readScroll, { passive: true })
    document.addEventListener('scroll', readScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', readScroll)
      document.removeEventListener('scroll', readScroll)
    }
  }, [])

  useEffect(() => {
    if (showUserMenu && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX
      })
    }
  }, [showUserMenu])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
        setShowAdminMenu(false)
      }
    }

    if (showUserMenu || showAdminMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showAdminMenu])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <header
      className={`z-50 transition-[background-color,box-shadow,border-color,backdrop-filter] duration-300 max-lg:fixed max-lg:top-0 max-lg:left-0 max-lg:right-0 max-lg:pt-[env(safe-area-inset-top,0px)] lg:sticky lg:top-0 ${
        scrolled
          ? 'bg-white/80 dark:bg-black/45 backdrop-blur-xl border-b border-gray-200/60 dark:border-white/10 shadow-md'
          : 'bg-white dark:bg-black border-b border-gray-200 dark:border-white/10 shadow-lg dark:shadow-2xl'
      }`}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        {/*
          Mobile: 2 colunas (logo | ações). Se usarmos 3 colunas e o nav central
          ficar display:none, o grid remove esse item e as ações caem no meio.
        */}
        <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-3 sm:h-20 lg:grid-cols-[1fr_auto_1fr]">
          {/* Esquerda: logo */}
          <div className="flex min-w-0 items-center justify-self-start">
            <Link
              to="/search-cheapest-iphone"
              className="lg:hidden flex items-center shrink-0 group"
              onClick={() => sidebarOpen && setSidebarOpen(false)}
            >
              <img
                src={theme === 'dark' ? '/assets/images/logo-dark.png' : '/assets/images/logo-light.png'}
                alt="iGestorPhone"
                className="h-10 w-auto max-w-[150px] object-contain transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.06] group-hover:-translate-y-0.5 group-active:scale-[1.03]"
              />
            </Link>

            <Link
              to="/search-cheapest-iphone"
              className="hidden lg:flex items-center shrink-0 group"
            >
              <img
                src={theme === 'dark' ? '/assets/images/logo-dark.png' : '/assets/images/logo-light.png'}
                alt="iGestorPhone"
                className="h-10 w-auto object-contain transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.06] group-hover:-translate-y-0.5"
              />
            </Link>
          </div>

          {/* Centro: Preços + Avaliações (+ Administração no desktop) */}
          <nav className="hidden items-center justify-self-center gap-1 lg:flex">
            <NavLink to="/search-cheapest-iphone" className={topNavLinkClass}>
              <Search className="w-4 h-4 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-12" />
              <span>Preços</span>
            </NavLink>

            <NavLink to="/reviews" className={topNavLinkClass}>
              <Star className="w-4 h-4 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-12" />
              <span>Avaliações</span>
            </NavLink>

            {isAdmin && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => setShowAdminMenu((v) => !v)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    showAdminMenu
                      ? 'bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-white/70 dark:hover:text-white dark:hover:bg-white/10'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Administração</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAdminMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showAdminMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      transition={{ duration: 0.16 }}
                      className="absolute left-1/2 top-full mt-2 w-64 -translate-x-1/2 bg-white dark:bg-black border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl z-[9999] py-2"
                    >
                      {adminNavigation.map((item) => (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          onClick={() => setShowAdminMenu(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                              isActive
                                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                                : 'text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10'
                            }`
                          }
                        >
                          <item.icon className="w-4 h-4 shrink-0" />
                          <span className="font-medium truncate">{item.name}</span>
                        </NavLink>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Direita: dias, tema, menu mobile, usuário */}
          <div className="flex items-center justify-end justify-self-end space-x-3 shrink-0">
            {user && subscriptionDaysLeft !== null && (
              <Link
                to="/subscription"
                title="Assinatura e renovação"
                className={`hidden lg:flex items-center gap-2 rounded-xl border px-3 py-1.5 transition-colors ${
                  subscriptionUrgent
                    ? 'border-amber-300/80 bg-amber-50 hover:bg-amber-100/90 dark:border-amber-500/40 dark:bg-amber-500/10 dark:hover:bg-amber-500/15'
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                }`}
              >
                <Clock
                  className={`h-4 w-4 shrink-0 ${
                    subscriptionUrgent ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                />
                <div className="min-w-0 text-left leading-tight">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{subscriptionDaysLeft} dias</div>
                  <div className="text-[10px] font-medium text-gray-500 dark:text-white/50">restantes</div>
                </div>
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-200 group"
              title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              ) : (
                <Moon className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform" />
              )}
            </button>

            <button
              onClick={toggleSidebar}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-200 lg:hidden group flex items-center justify-center shrink-0"
              title="Menu"
            >
              <div className={`transition-transform duration-200 ${sidebarOpen ? 'rotate-90' : ''}`}>
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                )}
              </div>
            </button>

            <div className="relative z-[9998] hidden lg:block" ref={userMenuRef}>
              <button
                ref={userButtonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl border border-transparent dark:border-white/10 bg-white/50 hover:bg-gray-100/80 dark:bg-white/10 dark:hover:bg-white/15 transition-all duration-200 group"
              >
                <AvatarDisplay user={user} size="sm" className="w-9 h-9 rounded-xl bg-gray-400/25 dark:bg-white/20 group-hover:bg-gray-400/35 dark:group-hover:bg-white/25 transition-colors" gradient={false} />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {(user?.name || user?.nome || '').trim().split(' ')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60 font-medium capitalize">
                    {user?.tipo || user?.role || 'user'}
                  </p>
                </div>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed w-[min(100vw-1.5rem,16rem)] sm:w-56 bg-white dark:bg-black backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl shadow-2xl z-[99999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                      maxHeight: 'calc(100vh - 20px)',
                      overflowY: 'auto'
                    }}
                  >
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{(user?.name || user?.nome || '').trim().split(' ')[0] || 'Usuário'}</p>
                        <p className="text-xs text-gray-600 dark:text-white/70 capitalize">{user?.tipo || user?.role || 'user'}</p>
                        {user && subscriptionDaysLeft !== null && (
                          <Link
                            to="/subscription"
                            onClick={() => setShowUserMenu(false)}
                            className={`lg:hidden mt-3 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                              subscriptionUrgent
                                ? 'border-amber-300/80 bg-amber-50 hover:bg-amber-100/90 dark:border-amber-500/40 dark:bg-amber-500/10 dark:hover:bg-amber-500/15'
                                : 'border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'
                            }`}
                          >
                            <Clock
                              className={`h-4 w-4 shrink-0 ${
                                subscriptionUrgent
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-emerald-600 dark:text-emerald-400'
                              }`}
                            />
                            <div className="min-w-0 flex-1 text-left leading-tight">
                              <div className="text-sm font-bold text-gray-900 dark:text-white">
                                {subscriptionDaysLeft} dias restantes
                              </div>
                              <div className="text-[10px] font-medium text-gray-500 dark:text-white/55">
                                Toque para ver assinatura
                              </div>
                            </div>
                          </Link>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            navigate('/profile')
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center space-x-3 group"
                        >
                          <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Meu Perfil</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/devices')
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center space-x-3 group"
                        >
                          <Monitor className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Dispositivos</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/subscription')
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center space-x-3 group"
                        >
                          <CreditCard className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Assinatura</span>
                        </button>
                        <button
                          onClick={() => {
                            navigate('/support')
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center space-x-3 group"
                        >
                          <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Fale Conosco</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            setShowBugModal(true)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center space-x-3 group"
                        >
                          <Bug className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Reportar Bug</span>
                        </button>
                        <hr className="my-2 border-gray-200 dark:border-white/10" />
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center space-x-3 group"
                        >
                          <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Sair da Conta</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <ReportBugModal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
      />
    </header>
  )
}
