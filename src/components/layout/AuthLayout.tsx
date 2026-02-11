import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: ReactNode
}

// Imagens de fundo: coloque em public/assets/images/
// - login-bg-desktop.png (desktop, ex.: 1920x1080)
// - login-bg-mobile.png (mobile, ex.: 414x896)
// Logo fica só na arte de fundo; a caixa de login é escura (bg-slate-900/90) para contraste.
const LOGIN_BG_DESKTOP = '/assets/images/login-bg-desktop.png'
const LOGIN_BG_MOBILE = '/assets/images/login-bg-mobile.png'

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-primary">

      {/* Fundo: imagem desktop (md+) e mobile, com fallback no gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden md:block"
          style={{ backgroundImage: `url(${LOGIN_BG_DESKTOP})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat md:hidden"
          style={{ backgroundImage: `url(${LOGIN_BG_MOBILE})` }}
          aria-hidden
        />
        {/* Overlay leve para o card e o logo continuarem legíveis em fundos claros */}
        <div className="absolute inset-0 bg-black/25" aria-hidden />
      </div>

      {/* Content — logo fica só no fundo; caixa escura para contraste no fundo claro */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl p-6 shadow-2xl max-w-md mx-auto border border-white/20 bg-slate-900/90 backdrop-blur-md"
        >
          {children}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-center mt-8 text-white/60 text-sm"
        >
          <p>© 2025 iGestorPhone. Todos os direitos reservados.</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
