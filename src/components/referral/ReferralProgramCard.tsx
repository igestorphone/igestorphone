import { Gift, MessageCircle } from 'lucide-react'
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
      className={`relative overflow-hidden rounded-xl border border-emerald-200/90 dark:border-emerald-400/25 bg-gradient-to-br from-emerald-600 to-teal-700 dark:from-emerald-900 dark:to-emerald-950 p-3 min-h-[84px] flex flex-col justify-between shadow-[0_1px_0_rgba(16,185,129,0.12)] ${className}`}
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-4 -top-4 h-16 w-16 rounded-full bg-white/15 blur-xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-[11px] uppercase tracking-wide font-semibold text-emerald-100/90">
            Indique e ganhe
          </p>
          <p className="mt-1 text-[13px] sm:text-sm font-black leading-tight text-white">
            1 cliente = <span className="text-amber-200">1 mês grátis</span>
          </p>
        </div>
        <motion.span
          className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/15 text-amber-200"
          aria-hidden
          animate={{ y: [0, -3, 0], rotate: [0, -6, 6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Gift className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={2} />
        </motion.span>
      </div>

      <button
        type="button"
        onClick={openReferralWhatsApp}
        className="relative mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#25D366] px-2 py-1.5 text-[11px] sm:text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#20bd5a] active:scale-[0.98]"
      >
        <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Indicar
      </button>
    </motion.div>
  )
}
