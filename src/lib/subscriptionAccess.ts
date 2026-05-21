import type { Usuario } from '@/types'
import { isSubscriptionExpiredByCalendarSaoPaulo } from '@/lib/subscriptionExpiryCalendar'

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
 * Planos legados anual/trimestral: enquanto `subscription_expires_at` estiver no futuro,
 * os dias restantes são a diferença até essa data; depois disso exige renovação (ciclos de 30 dias).
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

export function requiresCheckoutOnly(user: Usuario | null): boolean {
  if (!user) return false
  if (isSubscriptionAdmin(user)) return false
  return !hasActiveSubscriptionAccess(user)
}
