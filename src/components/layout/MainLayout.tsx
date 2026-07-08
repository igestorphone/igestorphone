import { Outlet } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import Sidebar from '@/components/ui/Sidebar'
import Header from '@/components/ui/Header'
import { useAppStore } from '@/stores/appStore'

const DESKTOP_BREAKPOINT = 1024
const RESIZE_DEBOUNCE_MS = 150

export default function MainLayout() {
  const { sidebarOpen, setSidebarOpen } = useAppStore()
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
      {/* Mobile: menu como cartão flutuante que cobre a barra do topo (estilo concorrente) */}
      {!isDesktop && (
        <>
          {/* Backdrop cobre tudo, inclusive o header */}
          <div
            aria-hidden={!sidebarOpen}
            className={`fixed inset-0 z-[55] bg-black/50 backdrop-blur-[1px] transition-opacity duration-200 ${
              sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            style={{ touchAction: 'manipulation' }}
            onClick={() => setSidebarOpen(false)}
          />
          {/* Cartão flutuante do menu, ancorado no topo */}
          <div
            aria-hidden={!sidebarOpen}
            className={`fixed left-2 right-2 top-2 z-[60] origin-top transition-all duration-200 ease-out ${
              sidebarOpen
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
            }`}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent', paddingTop: 'env(safe-area-inset-top, 0px)' }}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* Main content - full width (navegação agora fica no topo) */}
      <div className="flex-1 flex flex-col overflow-x-hidden w-0 min-w-0">
        <Header />
        <main className="flex-1 overflow-x-hidden w-full max-w-full pt-16 sm:pt-20 lg:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}