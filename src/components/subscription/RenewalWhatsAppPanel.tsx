import { MessageCircle, Copy, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  openRenewalWhatsAppToSupport,
  copyRenewalCheckoutLink,
  getRenewalCheckoutUrl,
  RENEWAL_PLAN_PRICE_BRL,
} from '@/lib/renewalWhatsApp'

type Props = {
  userName?: string | null
  userEmail?: string | null
  expiresAt?: string | null
  daysRemaining?: number | null
  compact?: boolean
}

export default function RenewalWhatsAppPanel({
  userName,
  userEmail,
  expiresAt,
  daysRemaining,
  compact = false,
}: Props) {
  const handleCopyLink = async () => {
    const ok = await copyRenewalCheckoutLink()
    if (ok) toast.success('Link de renovação copiado!')
    else toast.error('Não foi possível copiar o link')
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        <Link
          to="/checkout"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 text-sm font-semibold"
        >
          <ExternalLink className="w-4 h-4" />
          Pagar agora
        </Link>
        <button
          type="button"
          onClick={() => openRenewalWhatsAppToSupport({ userName, userEmail, expiresAt, daysRemaining })}
          className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-3 py-2 text-sm font-semibold text-white"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/5 p-4">
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
        Renovar ficou mais fácil
      </p>
      <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-white/70">
        <li>
          Pague aqui no app (PIX ou cartão) —{' '}
          <strong className="text-gray-900 dark:text-white">
            R$ {RENEWAL_PLAN_PRICE_BRL.toFixed(2).replace('.', ',')}/mês
          </strong>
        </li>
        <li>Ou fale no WhatsApp — enviamos o passo a passo</li>
      </ol>
      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <Link
          to="/checkout"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold px-4 py-2.5"
        >
          <ExternalLink className="w-4 h-4" />
          Ir para pagamento
        </Link>
        <button
          type="button"
          onClick={() => openRenewalWhatsAppToSupport({ userName, userEmail, expiresAt, daysRemaining })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] font-semibold text-white px-4 py-2.5 shadow-sm hover:bg-[#20bd5a]"
        >
          <MessageCircle className="w-5 h-5" />
          Tirar dúvida no WhatsApp
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 dark:border-white/20 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/5"
        >
          <Copy className="w-4 h-4" />
          Copiar link
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-white/45 break-all">{getRenewalCheckoutUrl()}</p>
    </div>
  )
}
