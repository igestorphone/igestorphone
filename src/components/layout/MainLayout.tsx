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
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [sidebarOpen, setSidebarOpen])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black flex transition-colors duration-200 overflow-x-hidden">
      {/* Sidebar - Always visible and fixed on desktop */}
      <motion.div
        animate={{ width: sidebarCollapsed ? 80 : 264 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:block fixed inset-y-0 left-0 z-30"
      >
        <Sidebar onClose={() => {}} />
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-64"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile only */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main content - Adjust margin based on sidebar */}
      <div 
        className="flex-1 flex flex-col overflow-x-hidden transition-all duration-300 w-0 min-w-0"
        style={{ 
          marginLeft: isDesktop ? (sidebarCollapsed ? '80px' : '264px') : '0' 
        }}
      >
        <Header />
        <main className="flex-1 overflow-x-hidden w-full max-w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}