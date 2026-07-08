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
      className={`relative overflow-hidden rounded-2xl border border-emerald-200/70 dark:border-emerald-400/30 shadow-md shadow-emerald-500/10 cursor-pointer touch-manipulation aspect-[5/2] xl:aspect-[3/1] xl:self-start ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-400/30 blur-2xl dark:bg-emerald-500/20 xl:h-44 xl:w-44 xl:blur-3xl"
        animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.65, 0.4] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Mobile: altura ~2.5:1 como o banner do concorrente */}
      <motion.div
        className="relative flex h-full flex-col justify-between bg-gradient-to-br from-emerald-400/90 via-emerald-500 to-teal-600 dark:from-emerald-800 dark:via-emerald-900 dark:to-teal-950 px-3.5 py-3 xl:hidden"
        initial={false}
      >
        <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-950/70 dark:text-emerald-100/80">
          Indique e ganhe
        </p>

        <div className="flex min-h-0 flex-1 items-center justify-between gap-2 py-1">
          <p className="text-[15px] font-black leading-snug text-white">
            1 cliente = <span className="text-amber-100">1 mês grátis</span>
          </p>
          <motion.div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15"
            aria-hidden
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Gift className="h-5 w-5 text-amber-100" strokeWidth={1.75} />
          </motion.div>
        </div>

        <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#22c55e] py-2 text-[11px] font-bold text-white shadow-sm">
          <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Indicar pelo WhatsApp
        </span>
      </motion.div>

      {/* Desktop: banner grande (proporção 3:1 como o concorrente) */}
      <div className="relative hidden h-full flex-col xl:flex">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -bottom-14 -left-8 h-40 w-40 rounded-full bg-teal-400/25 blur-3xl dark:bg-teal-500/15"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />

        <motion.div className="relative flex h-full flex-row items-center justify-between gap-4 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-900 dark:via-emerald-950 dark:to-black p-4">
          <div className="min-w-0 flex-1">
            <motion.div
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
              animate={{ opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Indique e ganhe
            </motion.div>
            <p className="mt-2 text-xl font-black leading-tight text-white">
              1 cliente = <span className="text-amber-200">1 mês grátis</span>
            </p>
            <motion.span
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/20"
              whileHover={{ backgroundColor: '#20bd5a' }}
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              Indicar pelo WhatsApp
            </motion.span>
          </div>

          <motion.div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-md"
            aria-hidden
            animate={{ y: [0, -6, 0], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Gift className="h-9 w-9 text-amber-200" strokeWidth={1.5} />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
