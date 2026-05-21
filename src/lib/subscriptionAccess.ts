import type { Usuario } from '@/types'
import {
  isSubscriptionExpiredByCalendarSaoPaulo,
  isPastPaymentGracePeriodSaoPaulo,
} from '@/lib/subscriptionExpiryCalendar'

function roleOf(user: Usuario | null): string {
  if (!user) return ''
  return String((user as { role?: string }).role || user.tipo || '').toLowerCase()
}

/** Administrador não fica preso no fluxo de pagamento. */
export function isSubscriptionAdmin(user: Usuario | null): boolean {
  return roleOf(user) === 'admin'
}

/**
 * Acesso ao app (fora do checkout) liberado: não pendente/atrasado/expirado por status
 * e com validade futura (1+ dia civil em SP; no dia do vencimento = 0 dias → checkout).
 */
export function hasActiveSubscriptionAccess(user: Usuario | null): boolean {
  if (!user) return false
  if (isSubscriptionAdmin(user)) return true

  const st = String(user.subscription_status || '').toLowerCase()
  if (['pending_payment', 'overdue', 'expired'].includes(st)) return false
  if (st === 'canceled' || st === 'cancelled') return false

  if (!user.subscription_expires_at) {
    return st === 'active' || st === 'trial'
  }

  if (isSubscriptionExpiredByCalendarSaoPaulo(user.subscription_expires_at)) {
    return false
  }

  return st === 'active' || st === 'trial' || st === ''
}

/** Passou 10 dias na tela de pagamento sem pagar — conta excluída no servidor. */
export function isAccountRemovedAfterGrace(user: Usuario | null): boolean {
  if (!user || isSubscriptionAdmin(user)) return false
  if (!user.subscription_expires_at) return false
  return isPastPaymentGracePeriodSaoPaulo(user.subscription_expires_at)
}

/** Checkout Asaas (R$ 150): vencido ou pendente, ainda dentro dos 10 dias de tolerância. */
export function requiresCheckoutOnly(user: Usuario | null): boolean {
  if (!user) return false
  if (isSubscriptionAdmin(user)) return false
  if (isAccountRemovedAfterGrace(user)) return false
  return !hasActiveSubscriptionAccess(user)
}
