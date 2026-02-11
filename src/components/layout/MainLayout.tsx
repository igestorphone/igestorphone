import { Outlet } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAppStore } from '@/stores/appStore'

const DESKTOP_BREAKPOINT = 1024
const RESIZE_DEBOUNCE_MS = 150

export default function MainLayout() {
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen } = useAppStore()
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= DESKTOP_BREAKPOINT)
  const resizeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const update = () => {
      const isDesktopSize = window.innerWidth >= DESKTOP_BREAKPOINT
      setIsDesktop(isDesktopSize)
      if (!isDesktopSize && sidebarOpen) setSidebarOpen(false)
    }
    const handleResize = () => {
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current)
      resizeTimeout.current = setTimeout(update, RESIZE_DEBOUNCE_MS)
    }
    update()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimeout.current) clearTimeout(resizeTimeout.current)
    }
  }, [])

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
          <Outlet />
        </main>
      </div>
    </div>
  )
}