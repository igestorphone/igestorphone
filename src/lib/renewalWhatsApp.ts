import { createWhatsAppUrl } from '@/lib/utils'
import { WHATSAPP_ATENDIMENTO } from '@/constants/contact'
import { formatExpiryDatePtBrSaoPaulo } from '@/lib/subscriptionExpiryCalendar'

export const RENEWAL_PLAN_PRICE_BRL = 150

export function getRenewalCheckoutUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/checkout`
  }
  return 'https://www.igestorphone.com.br/checkout'
}

/** Admin → cliente: lembrete de renovação com link direto. */
export function buildRenewalReminderToClient(opts: {
  clientName?: string | null
  daysRemaining?: number | null
  expiresAt?: string | null
  expired?: boolean
}): string {
  const name = (opts.clientName || 'lojista').trim().split(' ')[0]
  const dateStr = formatExpiryDatePtBrSaoPaulo(opts.expiresAt)
  const checkout = getRenewalCheckoutUrl()
  const price = `R$ ${RENEWAL_PLAN_PRICE_BRL.toFixed(2).replace('.', ',')}`

  if (opts.expired) {
    return `Olá, ${name}! 👋

Sua assinatura do *iGestorPhone* está vencida (${dateStr}).

Para voltar a usar o sistema, renove aqui:
${checkout}

💳 ${price}/mês · PIX ou cartão · +30 dias de acesso

Qualquer dúvida, é só responder esta mensagem.`
  }

  const days =
    opts.daysRemaining != null && Number.isFinite(opts.daysRemaining)
      ? Math.max(0, Math.round(opts.daysRemaining))
      : null
  const when =
    days === 0
      ? `vence *hoje* (${dateStr})`
      : days != null
        ? `vence em *${days} dia(s)* (${dateStr})`
        : `vence em ${dateStr}`

  return `Olá, ${name}! 👋

Passando para lembrar: sua assinatura do *iGestorPhone* ${when}.

Renove em 1 clique:
${checkout}

💳 ${price}/mês · PIX ou cartão · +30 dias de acesso

Precisando de ajuda, responda aqui.`
}

/** Cliente → suporte iGestorPhone. */
export function buildRenewalHelpToSupport(opts: {
  userName?: string | null
  userEmail?: string | null
  expiresAt?: string | null
  daysRemaining?: number | null
}): string {
  const name = opts.userName?.trim() || '—'
  const email = opts.userEmail?.trim() || '—'
  const dateStr = formatExpiryDatePtBrSaoPaulo(opts.expiresAt)
  const days =
    opts.daysRemaining != null ? `${Math.max(0, Math.round(opts.daysRemaining))} dias` : '—'

  return `Olá! Quero renovar minha assinatura *iGestorPhone*.

Nome: ${name}
E-mail: ${email}
Validade atual: ${dateStr} (${days})

Link que usei: ${getRenewalCheckoutUrl()}

Obrigado!`
}

export function openRenewalWhatsAppToClient(
  clientPhone: string,
  opts: Parameters<typeof buildRenewalReminderToClient>[0]
) {
  const url = createWhatsAppUrl(clientPhone, buildRenewalReminderToClient(opts))
  window.open(url, '_blank', 'noopener,noreferrer')
}

export function openRenewalWhatsAppToSupport(opts: Parameters<typeof buildRenewalHelpToSupport>[0]) {
  const url = createWhatsAppUrl(WHATSAPP_ATENDIMENTO, buildRenewalHelpToSupport(opts))
  window.open(url, '_blank', 'noopener,noreferrer')
}

export async function copyRenewalCheckoutLink(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(getRenewalCheckoutUrl())
    return true
  } catch {
    return false
  }
}
