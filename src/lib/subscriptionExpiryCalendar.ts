/** Fuso usado para “dia de validade” e contagem de dias restantes (meia-noite local). */
export const SUBSCRIPTION_CALENDAR_TZ = 'America/Sao_Paulo'

/** Dias na tela de pagamento (Asaas) após o vencimento; depois a conta é excluída. */
export const SUBSCRIPTION_PAYMENT_GRACE_DAYS = 10

function ymdInTimeZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

function parseYmdUtcMidnight(ymd: string): number {
  const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return NaN
  return Date.UTC(y, m - 1, d)
}

/**
 * Dias entre “hoje” (data civil no fuso de SP) e o dia civil da expiração (no mesmo fuso).
 * No dia da expiração retorna 0; no dia anterior, 1. Atualiza à meia-noite de São Paulo.
 */
export function calendarDaysRemainingSaoPaulo(iso: string | null | undefined): number | null {
  if (!iso) return null
  const exp = new Date(iso)
  if (Number.isNaN(exp.getTime())) return null

  const todayYmd = ymdInTimeZone(new Date(), SUBSCRIPTION_CALENDAR_TZ)
  const expiryYmd = ymdInTimeZone(exp, SUBSCRIPTION_CALENDAR_TZ)
  const diffDays = Math.round((parseYmdUtcMidnight(expiryYmd) - parseYmdUtcMidnight(todayYmd)) / 86400000)
  return Math.max(0, diffDays)
}

/**
 * Vencido no dia do vencimento (0 dias) e depois — exige checkout Asaas (R$ 150) até pagar.
 * Com 1+ dia no contador o acesso continua liberado.
 */
export function isSubscriptionExpiredByCalendarSaoPaulo(iso: string | null | undefined): boolean {
  if (!iso) return false
  const exp = new Date(iso)
  if (Number.isNaN(exp.getTime())) return false

  const todayYmd = ymdInTimeZone(new Date(), SUBSCRIPTION_CALENDAR_TZ)
  const expiryYmd = ymdInTimeZone(exp, SUBSCRIPTION_CALENDAR_TZ)
  return parseYmdUtcMidnight(expiryYmd) <= parseYmdUtcMidnight(todayYmd)
}

function addCalendarDaysYmd(ymd: string, days: number): string {
  const base = new Date(parseYmdUtcMidnight(ymd))
  base.setUTCDate(base.getUTCDate() + days)
  return ymdInTimeZone(base, SUBSCRIPTION_CALENDAR_TZ)
}

export function paymentGraceDeadlineYmdSaoPaulo(iso: string | null | undefined): string | null {
  if (!iso) return null
  const exp = new Date(iso)
  if (Number.isNaN(exp.getTime())) return null
  const expiryYmd = ymdInTimeZone(exp, SUBSCRIPTION_CALENDAR_TZ)
  return addCalendarDaysYmd(expiryYmd, SUBSCRIPTION_PAYMENT_GRACE_DAYS)
}

/** Dias restantes para pagar R$ 150 antes da exclusão (só após vencer). */
export function calendarDaysLeftInPaymentGraceSaoPaulo(iso: string | null | undefined): number | null {
  const deadline = paymentGraceDeadlineYmdSaoPaulo(iso)
  if (!deadline || !isSubscriptionExpiredByCalendarSaoPaulo(iso)) return null
  const todayYmd = ymdInTimeZone(new Date(), SUBSCRIPTION_CALENDAR_TZ)
  return Math.max(0, Math.round((parseYmdUtcMidnight(deadline) - parseYmdUtcMidnight(todayYmd)) / 86400000))
}

export function isPastPaymentGracePeriodSaoPaulo(iso: string | null | undefined): boolean {
  const deadline = paymentGraceDeadlineYmdSaoPaulo(iso)
  if (!deadline || !isSubscriptionExpiredByCalendarSaoPaulo(iso)) return false
  const todayYmd = ymdInTimeZone(new Date(), SUBSCRIPTION_CALENDAR_TZ)
  return parseYmdUtcMidnight(todayYmd) > parseYmdUtcMidnight(deadline)
}

/** Data de validade exibida no mesmo critério do contador (civil em SP). */
export function formatExpiryDatePtBrSaoPaulo(iso: string | null | undefined): string {
  if (!iso) return '—'
  const exp = new Date(iso)
  if (Number.isNaN(exp.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: SUBSCRIPTION_CALENDAR_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(exp)
}
