import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: ReactNode
}

// Imagens de fundo: coloque em public/assets/images/
// - login-bg-desktop.png (desktop, ex.: 1920x1080)
// - login-bg-mobile.png (mobile, ex.: 414x896)
// Use artes SEM o logo; o app já exibe o logo em cima.
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

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-40 h-40 mx-auto mb-6 flex items-center justify-center relative">
            <img 
              src="/assets/images/logo.png" 
              alt="iGestorPhone Logo" 
              className="w-full h-full object-contain drop-shadow-2xl relative z-0"
              onError={(e) => {
                // Fallback para emoji se a imagem não carregar
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = `
                    <div class="w-full h-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                      <div class="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-3xl"></div>
                      <div class="relative z-10">
                        <div class="w-20 h-20 bg-white/20 rounded-xl flex items-center justify-center">
                          <span class="text-4xl font-bold text-white">📱</span>
                        </div>
                      </div>
                    </div>
                  `;
                }
              }}
            />
          </div>
        </motion.div>

        {/* Auth Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="glass rounded-2xl p-6 shadow-2xl max-w-md mx-auto border border-white/20"
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
