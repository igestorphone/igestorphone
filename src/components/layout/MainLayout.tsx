import { Outlet } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
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

      {/* Mobile Sidebar - CSS transition (mais fluido no iPhone que Framer) */}
      {!isDesktop && (
        <>
          <div
            aria-hidden={!sidebarOpen}
            className={`fixed inset-y-0 left-0 z-[50] w-64 transform transition-transform duration-200 ease-out will-change-transform ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ touchAction: 'manipulation' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
          <div
            aria-hidden={!sidebarOpen}
            className={`fixed inset-0 bg-black/50 z-[45] transition-opacity duration-200 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ touchAction: 'manipulation' }}
            onClick={() => setSidebarOpen(false)}
          />
        </>
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