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
      className={`relative overflow-hidden rounded-2xl shadow-md cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black aspect-[5/2] xl:aspect-[1024/341] xl:self-start ${className}`}
      aria-label="Programa de indicação iGestorPhone — Enviar meu convite"
    >
      {/* Mobile: altura compacta (~2.5:1, como o concorrente); a arte é cortada com object-cover */}
      <img
        src="/assets/images/referral-banner-mobile.jpg"
        alt="Programa de indicação iGestorPhone: indique lojistas e use grátis"
        className="absolute inset-0 h-full w-full object-cover object-[center_30%] xl:hidden"
        loading="lazy"
        decoding="async"
      />

      {/* Desktop: proporção da arte do designer */}
      <img
        src="/assets/images/referral-banner-desktop.jpg"
        alt="Programa de indicação iGestorPhone: indique lojistas e use grátis"
        className="absolute inset-0 hidden h-full w-full object-cover object-center xl:block"
        loading="lazy"
        decoding="async"
      />
    </motion.div>
  )
}
