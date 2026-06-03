import { motion } from 'framer-motion'

/** Faixa estilo bandeira do Brasil no topo do card */
export function LoginCopaCardStripe() {
  return (
    <div
      className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl overflow-hidden flex"
      aria-hidden
    >
      <span className="flex-1 bg-[#009739]" />
      <span className="flex-[0.35] bg-[#FFDF00]" />
      <span className="flex-[0.2] bg-[#002776]" />
    </div>
  )
}

/** Decoração de fundo — só na rota /login (via AuthLayout) */
export function LoginCopaBackground({ isDark }: { isDark: boolean }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0" aria-hidden>
      {/* Gradiente Brasil suave */}
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-gradient-to-br from-[#009739]/12 via-zinc-950 to-[#002776]/15'
            : 'bg-gradient-to-br from-[#009739]/8 via-[#f3f4f6] to-[#FFDF00]/10'
        }`}
      />

      {/* Círculos decorativos */}
      <motion.div
        className={`absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl ${
          isDark ? 'bg-[#009739]/25' : 'bg-[#009739]/20'
        }`}
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.7, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className={`absolute -bottom-32 -left-20 h-80 w-80 rounded-full blur-3xl ${
          isDark ? 'bg-[#FFDF00]/15' : 'bg-[#FFDF00]/25'
        }`}
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className={`absolute top-1/3 left-1/4 h-48 w-48 rounded-full blur-3xl ${
          isDark ? 'bg-[#002776]/20' : 'bg-[#002776]/10'
        }`}
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Confetes discretos */}
      {[
        { top: '12%', left: '8%', color: '#009739', delay: 0 },
        { top: '18%', right: '12%', color: '#FFDF00', delay: 0.5 },
        { top: '75%', left: '6%', color: '#FFDF00', delay: 1 },
        { top: '82%', right: '10%', color: '#009739', delay: 1.2 },
        { top: '45%', right: '5%', color: '#002776', delay: 0.8 },
      ].map((dot, i) => (
        <motion.span
          key={i}
          className="absolute h-2 w-2 rounded-full opacity-60"
          style={{
            top: dot.top,
            left: 'left' in dot ? dot.left : undefined,
            right: 'right' in dot ? dot.right : undefined,
            backgroundColor: dot.color,
          }}
          animate={{ y: [0, -8, 0], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, delay: dot.delay }}
        />
      ))}

      {/* Bolinhas flutuantes (estilo campo) */}
      <motion.span
        className="absolute text-4xl sm:text-5xl opacity-[0.12] select-none"
        style={{ top: '14%', right: '18%' }}
        animate={{ y: [0, -12, 0], rotate: [0, 15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        ⚽
      </motion.span>
      <motion.span
        className="absolute text-3xl sm:text-4xl opacity-[0.1] select-none"
        style={{ bottom: '22%', left: '12%' }}
        animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      >
        🇧🇷
      </motion.span>
    </div>
  )
}

/** Faixa dentro do card, acima do formulário */
export function LoginCopaBanner({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className={`mb-5 flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-center text-sm font-medium ${
        isDark
          ? 'border-[#009739]/35 bg-gradient-to-r from-[#009739]/20 via-[#FFDF00]/10 to-[#002776]/20 text-white/90'
          : 'border-[#009739]/25 bg-gradient-to-r from-[#009739]/10 via-[#FFDF00]/15 to-[#002776]/10 text-gray-800'
      }`}
    >
      <span className="text-lg leading-none" aria-hidden>
        🇧🇷
      </span>
      <span>
        <span className="font-bold text-[#009739] dark:text-emerald-400">Bora, Brasil!</span>
        <span className={`font-normal ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
          {' '}
          — Rumo ao Hexa
        </span>
      </span>
      <span className="text-lg leading-none" aria-hidden>
        ⚽
      </span>
    </motion.div>
  )
}
