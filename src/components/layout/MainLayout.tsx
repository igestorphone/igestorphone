import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAppStore } from '@/stores/appStore'

export default function MainLayout() {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useAppStore()
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const isDesktopSize = window.innerWidth >= 1024
      setIsDesktop(isDesktopSize)
      // No mobile, garante que o sidebar está fechado ao redimensionar
      if (!isDesktopSize && sidebarOpen) {
        setSidebarOpen(false)
      }
    }
    
    // Verifica na inicialização se é mobile e fecha o sidebar
    const isMobile = window.innerWidth < 1024
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false)
    }
    
    setIsDesktop(!isMobile)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, []) // Dependências vazias - só executa na montagem

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex transition-colors duration-200 overflow-x-hidden">
      {/* Sidebar - Always visible and fixed on desktop ONLY */}
      {isDesktop && (
        <motion.div
          animate={{ width: sidebarCollapsed ? 80 : 264 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="hidden lg:block fixed inset-y-0 left-0 z-30"
        >
          <Sidebar onClose={() => {}} />
        </motion.div>
      )}

      {/* Mobile Sidebar - ONLY on mobile */}
      {!isDesktop && (
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="fixed inset-y-0 left-0 z-[50] w-64"
              onClick={(e) => {
                // Previne que o clique dentro do sidebar feche ele
                e.stopPropagation()
              }}
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Overlay for mobile only */}
      {!isDesktop && (
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[45]"
              onClick={() => setSidebarOpen(false)}
              onTouchStart={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>
      )}

      {/* Main content - Adjust margin based on sidebar */}
      <div 
        className="flex-1 flex flex-col overflow-x-hidden transition-all duration-300 w-0 min-w-0"
        style={{ 
          marginLeft: isDesktop ? (sidebarCollapsed ? '80px' : '264px') : '0' 
        }}
      >
        <Header />
        <main className="flex-1 overflow-x-hidden w-full max-w-full">
          {/* Banner de Recesso */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className="relative overflow-hidden mx-4 mt-4 mb-6 rounded-3xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-pink-500/20 backdrop-blur-md p-6 md:p-8 shadow-2xl"
          >
            {/* Decoração de fundo */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <motion.div
                className="absolute -top-10 -left-10 text-6xl opacity-20"
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                🎄
              </motion.div>
              <motion.div
                className="absolute top-0 right-10 text-5xl opacity-20"
                animate={{
                  rotate: [360, 0],
                  scale: [1, 1.3, 1]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear"
                }}
              >
                ✨
              </motion.div>
              <motion.div
                className="absolute bottom-0 left-1/4 text-5xl opacity-20"
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, 15, -15, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🎁
              </motion.div>
              <motion.div
                className="absolute top-1/2 right-1/4 text-4xl opacity-15"
                animate={{
                  rotate: [0, -360],
                  scale: [0.8, 1.1, 0.8]
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🎅
              </motion.div>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <motion.div
                className="text-5xl md:text-6xl"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                🎉
              </motion.div>

              <div className="flex-1 text-center md:text-left">
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-yellow-200 via-orange-200 to-pink-200 bg-clip-text text-transparent"
                >
                  Entramos em Recesso! 🎊
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="text-base md:text-lg text-white/90 mb-3"
                >
                  Estamos de férias aproveitando o final de ano!
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 text-white/80"
                >
                  <span className="font-semibold">Voltamos em:</span>
                  <span className="px-4 py-2 rounded-full bg-white/20 border border-white/30 font-bold text-base md:text-lg">
                    05/01/2026
                  </span>
                </motion.div>
              </div>

              <motion.div
                className="text-4xl md:text-5xl lg:text-6xl"
                animate={{
                  scale: [1, 1.15, 1],
                  rotate: [0, -5, 5, 0]
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.5
                }}
              >
                🎄
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="relative z-10 mt-4 md:mt-6 text-center"
            >
              <p className="text-white/90 text-base md:text-lg font-medium">
                Desejamos a todos um feliz Natal e um próspero Ano Novo! 🎅✨
              </p>
              <p className="text-white/70 text-sm md:text-base mt-2">
                Que 2026 seja repleto de sucessos e realizações! 🌟
              </p>
            </motion.div>
          </motion.div>

          <Outlet />
        </main>
      </div>
    </div>
  )
}