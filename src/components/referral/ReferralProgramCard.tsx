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
      className={`relative overflow-hidden rounded-2xl shadow-md cursor-pointer touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black xl:self-start ${className}`}
      aria-label="Programa de indicação iGestorPhone — Enviar meu convite"
    >
      {/*
        Importante: a proporção fica NA própria <img> (não em um wrapper com filhos absolute).
        No Safari/iOS, aspect-ratio + só filhos position:absolute pode colapsar a altura a 0
        e o banner some no celular.
      */}
      <img
        src="/assets/images/referral-banner-mobile.jpg"
        alt="Programa de indicação iGestorPhone: indique lojistas e use grátis"
        className="block w-full aspect-[5/2] object-cover object-[center_30%] xl:hidden"
        loading="eager"
        decoding="async"
      />
      <img
        src="/assets/images/referral-banner-desktop.jpg"
        alt="Programa de indicação iGestorPhone: indique lojistas e use grátis"
        className="hidden w-full aspect-[1024/341] object-cover object-center xl:block"
        loading="eager"
        decoding="async"
      />
    </motion.div>
  )
}
