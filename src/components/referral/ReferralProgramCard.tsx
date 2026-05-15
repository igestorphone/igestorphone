import { Gift, MessageCircle, Sparkles, UserPlus } from 'lucide-react'
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
    <div
      className={`relative overflow-hidden rounded-2xl border border-emerald-300/60 dark:border-emerald-500/35 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-900/30 ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-emerald-400/25 blur-3xl dark:bg-emerald-500/20"
        animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.75, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-500/15"
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.55, 0.35] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
      />

      <motion.div
        className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 dark:from-emerald-900 dark:via-emerald-950 dark:to-black p-4 sm:p-5"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <motion.div
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          Indique e ganhe
        </motion.div>

        <div className="mt-4 flex items-start gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold leading-tight text-white sm:text-xl">
              Traga um lojista para o iGestorPhone
            </h3>
            <p className="mt-2 text-sm text-emerald-100/90">
              Envie o WhatsApp do cliente que você está indicando. Validamos a indicação e você ganha benefício na
              assinatura.
            </p>

            <div className="mt-4 flex flex-wrap items-stretch gap-2 sm:gap-3">
              <div className="flex min-w-[120px] flex-1 flex-col justify-center rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-100/80">
                  <UserPlus className="h-3.5 w-3.5" aria-hidden />
                  Você indica
                </span>
                <span className="mt-0.5 text-xl font-black tabular-nums text-white sm:text-2xl">1 cliente</span>
              </div>
              <span className="flex items-center justify-center text-2xl font-black text-emerald-200/90" aria-hidden>
                =
              </span>
              <div className="flex min-w-[120px] flex-1 flex-col justify-center rounded-xl border border-amber-300/40 bg-amber-400/15 px-3 py-2.5 backdrop-blur-sm">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-100/90">
                  <Gift className="h-3.5 w-3.5" aria-hidden />
                  Você ganha
                </span>
                <span className="mt-0.5 text-xl font-black text-amber-50 sm:text-2xl">1 mês grátis</span>
              </div>
            </div>
          </div>

          <div
            className="hidden shrink-0 sm:flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-inner backdrop-blur-md"
            aria-hidden
          >
            <Gift className="h-10 w-10 text-amber-200" strokeWidth={1.5} />
          </div>
        </div>

        <button
          type="button"
          onClick={openReferralWhatsApp}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-black/20 transition-all hover:bg-[#20bd5a] active:scale-[0.98] sm:w-auto sm:min-w-[240px]"
        >
          <MessageCircle className="h-5 w-5 shrink-0" aria-hidden />
          Indicar pelo WhatsApp
        </button>
      </motion.div>
    </div>
  )
}
