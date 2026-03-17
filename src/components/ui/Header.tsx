import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Settings, LogOut, User, UserPlus, Bug, Moon, Sun, Bell, ExternalLink } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { useNavigate } from 'react-router-dom'
import SuggestSupplierModal from '@/components/forms/SuggestSupplierModal'
import ReportBugModal from '@/components/forms/ReportBugModal'
import { notificationsApi } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen, theme, setTheme } = useAppStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [showBugModal, setShowBugModal] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const navigate = useNavigate()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifPos, setNotifPos] = useState({ top: 0, right: 0 })

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Calcular posição do dropdown quando abrir
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
    if (showNotifs && notifRef.current) {
      const rect = notifRef.current.getBoundingClientRect()
      setNotifPos({
        top: rect.bottom + window.scrollY + 8,
        right: window.innerWidth - rect.right + window.scrollX
      })
    }
  }, [showNotifs])

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifs(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    if (showNotifs) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu, showNotifs])

  const myNotifsQuery = useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => notificationsApi.my(),
    enabled: Boolean(user),
    staleTime: 10000,
    refetchOnWindowFocus: true,
  })
  const notifsRaw = (myNotifsQuery.data as any)?.data ?? myNotifsQuery.data
  const myNotifs = notifsRaw?.notifications ?? []
  const unreadCount = Number(notifsRaw?.unreadCount ?? 0)

  const markReadAndOpen = async (n: any) => {
    try {
      await notificationsApi.markRead(Number(n.id))
      myNotifsQuery.refetch()
    } catch (_) {}
    if (n.link_url) {
      window.open(n.link_url, '_blank')
    } else {
      toast.success('Notificação marcada como lida.')
    }
  }

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-black backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-lg dark:shadow-2xl">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 relative">
          {/* Left side */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Mobile menu button - min 44px tap target (iOS) */}
            <button
              onClick={toggleSidebar}
              className="min-w-[44px] min-h-[44px] p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-200 lg:hidden group flex items-center justify-center shrink-0"
            >
              <div className={`transition-transform duration-200 ${sidebarOpen ? 'rotate-90' : ''}`}>
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-800 dark:text-white group-hover:scale-110 transition-transform" />
                )}
              </div>
            </button>
            {/* Logo no mobile - centralizado, maior */}
            <Link
              to="/search-cheapest-iphone"
              className="lg:hidden flex items-center justify-center min-w-0 flex-1"
              onClick={() => sidebarOpen && setSidebarOpen(false)}
            >
              <img
                src={theme === 'dark' ? '/assets/images/logo-dark.png' : '/assets/images/logo-light.png'}
                alt="iGestorPhone"
                className="h-12 w-auto max-w-[160px] object-contain"
              />
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Notificações (todos os usuários) */}
            <div className="relative z-[9998]" ref={notifRef}>
                <button
                  onClick={() => setShowNotifs((v) => !v)}
                  className="relative p-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-white/10 dark:hover:bg-white/20 transition-all duration-200 group"
                  title="Notificações"
                >
                  <Bell className={`${theme === 'dark' ? 'text-white' : 'text-gray-800'} w-5 h-5 group-hover:scale-110 transition-transform`} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {showNotifs && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className="fixed w-[360px] max-w-[92vw] bg-white dark:bg-black backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl shadow-2xl z-[99999]"
                      style={{
                        top: `${notifPos.top}px`,
                        right: `${notifPos.right}px`,
                        maxHeight: 'calc(100vh - 20px)',
                        overflowY: 'auto'
                      }}
                    >
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Notificações</div>
                        <div className="text-xs text-gray-500 dark:text-white/60">
                          {unreadCount} não lida(s)
                        </div>
                      </div>
                      <div className="py-2">
                        {myNotifsQuery.isFetching && myNotifs.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-gray-500 dark:text-white/60">Carregando…</div>
                        ) : myNotifs.length === 0 ? (
                          <div className="px-4 py-6 text-sm text-gray-500 dark:text-white/60">Nenhuma notificação.</div>
                        ) : (
                          myNotifs.slice(0, 8).map((n: any) => {
                            const isUnread = !n.read_at
                            return (
                              <button
                                key={n.id}
                                onClick={() => markReadAndOpen(n)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors ${
                                  isUnread ? 'bg-indigo-50/60 dark:bg-indigo-500/10' : ''
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                      {n.title}
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-white/70 line-clamp-2 mt-0.5">
                                      {n.message}
                                    </div>
                                    <div className="text-[10px] text-gray-500 dark:text-white/50 mt-1">
                                      {new Date(n.created_at).toLocaleString('pt-BR')}
                                    </div>
                                  </div>
                                  {n.link_url && (
                                    <ExternalLink className="w-4 h-4 text-gray-400 dark:text-white/60 shrink-0 mt-0.5" />
                                  )}
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            {/* Toggle Theme Button */}
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

            {/* Botão Indicar Fornecedor */}
            <button
              onClick={() => setShowSuggestModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all border border-gray-300/60 dark:border-white/15 bg-white/50 hover:bg-gray-100/80 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-white/90"
            >
              <UserPlus className="w-4 h-4" />
              <span>Indicar</span>
            </button>

            {/* Botão Reportar Bug */}
            <button
              onClick={() => setShowBugModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all border border-gray-300/60 dark:border-white/15 bg-white/50 hover:bg-gray-100/80 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-white/90 hover:border-red-300/50 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400"
            >
              <Bug className="w-4 h-4" />
              <span>Bug</span>
            </button>

            {/* User menu */}
            <div className="relative z-[9998]" ref={userMenuRef}>
              <button
                ref={userButtonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl border border-transparent dark:border-white/10 bg-white/50 hover:bg-gray-100/80 dark:bg-white/10 dark:hover:bg-white/15 transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-400/25 dark:bg-white/20 group-hover:bg-gray-400/35 dark:group-hover:bg-white/25 transition-colors">
                  <User className="w-5 h-5 text-gray-600 dark:text-white/90" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-gray-800 dark:text-white">
                    {(user?.name || user?.nome || '').trim().split(' ')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/60 font-medium capitalize">
                    {user?.tipo || user?.role || 'user'}
                  </p>
                </div>
              </button>

              {/* User dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed w-56 bg-white dark:bg-black backdrop-blur-xl border border-gray-200 dark:border-white/20 rounded-2xl shadow-2xl z-[99999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                      maxHeight: 'calc(100vh - 20px)',
                      overflowY: 'auto'
                    }}
                  >
                    <div className="py-2">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{(user?.name || user?.nome || '').trim().split(' ')[0] || 'Usuário'}</p>
                        <p className="text-xs text-gray-600 dark:text-white/70 capitalize">{user?.tipo || user?.role || 'user'}</p>
                      </div>
                      
                      {/* Menu Items */}
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
                        <button className="w-full px-4 py-3 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center space-x-3 group">
                          <Settings className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Configurações</span>
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

      {/* Modal de Indicação */}
      <SuggestSupplierModal
        isOpen={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
      />

      {/* Modal de Reportar Bug */}
      <ReportBugModal
        isOpen={showBugModal}
        onClose={() => setShowBugModal(false)}
      />
    </header>
  )
}