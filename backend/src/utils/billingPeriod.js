/** Período padrão de acesso após cada pagamento confirmado (renovação mensal). */
export const BILLING_PERIOD_DAYS = 30

export function addCalendarDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Nova data de expiração após pagamento: +30 dias a partir do maior entre
 * (data do pagamento, agora, vencimento atual ainda futuro).
 */
export function computeExpiryAfterRenewal({ currentExpiresAt, paymentDate }) {
  const now = new Date()
  const paid = paymentDate ? new Date(paymentDate) : now
  let base = paid.getTime() > now.getTime() ? paid : now
  if (currentExpiresAt) {
    const cur = new Date(currentExpiresAt)
    if (!Number.isNaN(cur.getTime()) && cur > base) base = cur
  }
  return addCalendarDays(base, BILLING_PERIOD_DAYS)
}
