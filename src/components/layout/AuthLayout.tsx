import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface AuthLayoutProps {
  children: ReactNode
}

// Removido componente de neve para melhorar performance no mobile

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center p-4 relative overflow-hidden">
      {/* Emojis de Ano Novo (estáticos para melhor performance no mobile) */}
      <div className="absolute top-8 left-8 z-20 text-3xl opacity-50 pointer-events-none">🎉</div>
      <div className="absolute top-12 right-12 z-20 text-3xl opacity-50 pointer-events-none">✨</div>
      <div className="absolute bottom-20 right-16 z-20 text-3xl opacity-50 pointer-events-none">🎊</div>
      <div className="absolute bottom-16 left-12 z-20 text-2xl opacity-40 pointer-events-none">2025</div>

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-float" />
        
        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/3 w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '2.5s' }} />
        <div className="absolute top-2/3 right-1/4 w-1 h-1 bg-pink-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }} />
        
        {/* Animated lines */}
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo com decoração de Ano Novo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="w-40 h-40 mx-auto mb-6 flex items-center justify-center relative">
            {/* Decoração de Ano Novo no logo */}
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 z-10">
              <span className="text-5xl">🎆</span>
            </div>
            
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
