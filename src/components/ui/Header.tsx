import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Settings, LogOut, User, Smartphone, UserPlus, Bug } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useAppStore } from '@/stores/appStore'
import { useNavigate } from 'react-router-dom'
import SuggestSupplierModal from '@/components/forms/SuggestSupplierModal'
import ReportBugModal from '@/components/forms/ReportBugModal'

export default function Header() {
  const { user, logout } = useAuthStore()
  const { sidebarOpen, setSidebarOpen } = useAppStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const [showBugModal, setShowBugModal] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const navigate = useNavigate()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

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

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  const handleLogoClick = () => {
    navigate('/dashboard')
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <header className="bg-gradient-to-r from-slate-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-xl border-b border-white/10 shadow-2xl relative z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 relative">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={toggleSidebar}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 lg:hidden group"
            >
              <motion.div
                animate={{ rotate: sidebarOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {sidebarOpen ? (
                  <X className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                ) : (
                  <Menu className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
                )}
              </motion.div>
            </button>

            {/* Desktop menu button */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 group"
            >
              <Menu className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </button>

            {/* Logo Principal - CLICÁVEL */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={handleLogoClick}
              className="relative w-24 h-24 flex items-center justify-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              {!logoError ? (
                <img 
                  src="/assets/images/logo.png" 
                  alt="iGestorPhone Logo" 
                  className="w-full h-full object-contain drop-shadow-2xl filter brightness-120 contrast-120 hover:brightness-140 transition-all duration-200"
                  style={{
                    maxWidth: '96px',
                    maxHeight: '96px',
                    width: 'auto',
                    height: 'auto'
                  }}
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Smartphone className="w-12 h-12 text-white" />
                </div>
              )}
            </motion.button>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Botão Indicar Fornecedor */}
            <button
              onClick={() => setShowSuggestModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 rounded-xl text-white font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <UserPlus className="w-4 h-4" />
              <span>Indicar</span>
            </button>

            {/* Botão Reportar Bug */}
            <button
              onClick={() => setShowBugModal(true)}
              className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-500 hover:via-orange-500 hover:to-yellow-500 rounded-xl text-white font-medium transition-all shadow-lg hover:shadow-xl"
            >
              <Bug className="w-4 h-4" />
              <span>Bug</span>
            </button>

            {/* User menu */}
            <div className="relative z-[9998]" ref={userMenuRef}>
              <button
                ref={userButtonRef}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 group"
              >
                <div className="w-9 h-9 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-white group-hover:text-blue-200 transition-colors">
                    {user?.nome?.split(' ')[0] || user?.name?.split(' ')[0] || 'Usuário'}
                  </p>
                  <p className="text-xs text-white/70 font-medium capitalize">
                    {user?.tipo || 'user'}
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
                    className="fixed w-56 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-[99999]"
                    style={{
                      top: `${dropdownPosition.top}px`,
                      right: `${dropdownPosition.right}px`,
                      maxHeight: 'calc(100vh - 20px)',
                      overflowY: 'auto'
                    }}
                  >
                    <div className="py-2">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-white">{user?.nome?.split(' ')[0] || user?.name?.split(' ')[0] || 'Usuário'}</p>
                        <p className="text-xs text-white/70 capitalize">{user?.tipo || 'user'}</p>
                      </div>
                      
                      {/* Menu Items */}
                      <div className="py-1">
                        <button 
                          onClick={() => {
                            navigate('/profile')
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center space-x-3 group"
                        >
                          <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Meu Perfil</span>
                        </button>
                        <button className="w-full px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center space-x-3 group">
                          <Settings className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span>Configurações</span>
                        </button>
                        <hr className="my-2 border-white/10" />
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center space-x-3 group"
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