import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Moon, Sun, ChevronLeft } from 'lucide-react'
import { useAppStore } from '@/stores/appStore'

interface AuthLayoutProps {
  children: ReactNode
}

/** Mesma convenção do Header: tema escuro usa logo-dark, claro usa logo-light. */
function logoForTheme(theme: 'light' | 'dark') {
  return theme === 'dark' ? '/assets/images/logo-dark.png' : '/assets/images/logo-light.png'
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { theme, setTheme } = useAppStore()
  const isDark = theme === 'dark'
  const logoSrc = logoForTheme(theme)

  const cardClass = isDark
    ? 'auth-card-dark bg-zinc-900/95 border border-white/10 shadow-2xl shadow-black/50'
    : 'auth-card-light bg-white border border-gray-200/90 shadow-xl shadow-gray-300/40'

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-zinc-950' : 'bg-[#f3f4f6]'}`}>
      <header
        className={`shrink-0 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 ${
          isDark ? 'border-b border-white/10 bg-black/25' : 'border-b border-gray-200/90 bg-white/90 backdrop-blur-sm'
        }`}
      >
        <Link
          to="/"
          className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors rounded-lg px-2 py-1.5 -ml-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
            isDark ? 'text-white/80 hover:text-white' : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <ChevronLeft className="h-4 w-4 shrink-0 opacity-80" />
          Início
        </Link>
        <button
          type="button"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
            isDark
              ? 'border-white/15 bg-white/5 text-amber-200 hover:bg-white/10'
              : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
          }`}
          aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className={`${cardClass} rounded-2xl p-6 sm:p-8`}>
            <div className="flex justify-center mb-6">
              <img
                src={logoSrc}
                alt="iGestorPhone"
                className="h-12 sm:h-14 w-auto object-contain max-w-[240px]"
                width={240}
                height={56}
              />
            </div>
            {children}
          </div>

          <p className={`text-center text-xs mt-6 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
            © {new Date().getFullYear()} iGestorPhone. Todos os direitos reservados.
          </p>
          <nav
            className={`text-center text-xs mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 ${
              isDark ? 'text-white/45' : 'text-gray-500'
            }`}
            aria-label="Links legais"
          >
            <Link to="/terms" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-gray-800 transition-colors'}>
              Termos
            </Link>
            <span className="opacity-40" aria-hidden>
              |
            </span>
            <Link to="/privacy" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-gray-800 transition-colors'}>
              Privacidade
            </Link>
            <span className="opacity-40" aria-hidden>
              |
            </span>
            <Link to="/lgpd" className={isDark ? 'hover:text-white transition-colors' : 'hover:text-gray-800 transition-colors'}>
              LGPD
            </Link>
          </nav>
        </motion.div>
      </main>
    </div>
  )
}
