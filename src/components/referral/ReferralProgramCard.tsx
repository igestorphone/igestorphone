import { Gift, MessageCircle, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { createWhatsAppUrl } from '@/lib/utils'
import { WHATSAPP_ATENDIMENTO } from '@/constants/contact'

export function buildReferralWhatsAppMessage(opts: {
  userName?: string | null
  userEmail?: string | null
}): string {
  const who = opts.userName?.trim() || 'usuário iGestorPhone'
  const emailLine = opts.userEmail?.trim() ? `\nE-mail: ${opts.userEmail.trim()}` : ''
  return `Olá! Vim pelo programa *Indique e Ganhe* do iGestorPhone.

Quero indicar um lojista:

• Nome / loja do indicado:
• WhatsApp do indicado:

Meu cadastro: ${who}${emailLine}

Obrigado!`
}

type ReferralProgramCardProps = {
  userName?: string | null
  userEmail?: string | null
  className?: string
}

export default function ReferralProgramCard({ userName, userEmail, className = '' }: ReferralProgramCardProps) {
  const openReferralWhatsApp = () => {
    const url = createWhatsAppUrl(
      WHATSAPP_ATENDIMENTO,
      buildReferralWhatsAppMessage({ userName, userEmail })
    )
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={openReferralWhatsApp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openReferralWhatsApp()
        }
      }}
      whileTap={{ scale: 0.99 }}
      className={`relative overflow-hidden rounded-xl border border-emerald-200/70 dark:border-emerald-400/30 shadow-md shadow-emerald-500/10 cursor-pointer touch-manipulation ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-400/30 blur-2xl dark:bg-emerald-500/20 xl:h-44 xl:w-44 xl:blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Mobile: faixa compacta estilo concorrente */}
      <motion.div
        className="relative flex items-center gap-3 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-700 dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-950 px-3 py-2.5 xl:hidden"
        initial={false}
      >
        <motion.div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-100/90">Indique e ganhe</p>
          <p className="mt-0.5 text-[15px] font-black leading-tight text-white">
            1 cliente = <span className="text-amber-200">1 mês grátis</span>
          </p>
        </motion.div>
        <motion.div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/15"
          aria-hidden
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Gift className="h-5 w-5 text-amber-200" strokeWidth={1.75} />
        </motion.div>
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366] text-white shadow-sm">
          <MessageCircle className="h-4 w-4" aria-hidden />
        </span>
      </motion.div>

      {/* Desktop: banner grande à direita */}
      <div className="relative hidden min-h-[210px] flex-col xl:flex">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full bg-teal-400/25 blur-3xl dark:bg-teal-500/15"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />

        <motion.div className="relative flex flex-1 flex-col bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-900 dark:via-emerald-950 dark:to-black p-5">
          <motion.div
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Indique e ganhe
          </motion.div>

          <div className="mt-4 flex flex-1 flex-row items-center justify-between gap-4">
            <motion.div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-white/95">Traga um lojista</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">Você indica</p>
                  <p className="text-2xl font-black text-white">1 cliente</p>
                </div>
                <span className="text-2xl font-black text-emerald-200/90" aria-hidden>
                  =
                </span>
                <div className="rounded-xl border border-amber-300/35 bg-amber-400/15 px-3 py-2 backdrop-blur-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-100/90">Você ganha</p>
                  <p className="text-2xl font-black text-amber-50">1 mês grátis</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-md"
              aria-hidden
              animate={{ y: [0, -6, 0], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Gift className="h-12 w-12 text-amber-200" strokeWidth={1.5} />
            </motion.div>
          </div>

          <motion.span
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/20"
            whileHover={{ backgroundColor: '#20bd5a' }}
          >
            <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
            Indicar pelo WhatsApp
          </motion.span>
        </motion.div>
      </div>
    </motion.div>
  )
}
