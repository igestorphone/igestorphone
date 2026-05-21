const SP = 'America/Sao_Paulo';

export function subscriptionPaymentGraceDays() {
  const n = parseInt(process.env.SUBSCRIPTION_PAYMENT_GRACE_DAYS || '10', 10);
  return Number.isFinite(n) && n >= 0 ? n : 10;
}

function ymdFmt(d) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: SP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function parseY(ymd) {
  const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
  return Date.UTC(y, m - 1, d);
}

function addCalendarDaysYmd(ymd, days) {
  const base = new Date(parseY(ymd));
  base.setUTCDate(base.getUTCDate() + days);
  return ymdFmt(base);
}

/**
 * Dias entre hoje (data civil em SP) e o dia civil da expiração em SP.
 * Igual ao frontend (`subscriptionExpiryCalendar.ts`).
 */
export function calendarDaysRemainingSaoPaulo(iso) {
  if (!iso) return null;
  const exp = new Date(iso);
  if (Number.isNaN(exp.getTime())) return null;

  const todayYmd = ymdFmt(new Date());
  const expiryYmd = ymdFmt(exp);
  const diff = Math.round((parseY(expiryYmd) - parseY(todayYmd)) / 86400000);
  return Math.max(0, diff);
}

/** Último dia (SP) em que ainda pode pagar no checkout antes da exclusão automática. */
export function paymentGraceDeadlineYmdSaoPaulo(iso) {
  if (!iso) return null;
  const exp = new Date(iso);
  if (Number.isNaN(exp.getTime())) return null;
  return addCalendarDaysYmd(ymdFmt(exp), subscriptionPaymentGraceDays());
}

/** Dias restantes na tela de pagamento (0 = último dia; depois disso a conta é excluída). */
export function calendarDaysLeftInPaymentGraceSaoPaulo(iso) {
  const deadline = paymentGraceDeadlineYmdSaoPaulo(iso);
  if (!deadline) return null;
  if (!isSubscriptionExpiredByCalendarSaoPaulo(iso)) return null;
  const todayYmd = ymdFmt(new Date());
  return Math.max(0, Math.round((parseY(deadline) - parseY(todayYmd)) / 86400000));
}

/** Passou o prazo de tolerância após o vencimento → conta será / foi excluída. */
export function isPastPaymentGracePeriodSaoPaulo(iso) {
  const deadline = paymentGraceDeadlineYmdSaoPaulo(iso);
  if (!deadline || !isSubscriptionExpiredByCalendarSaoPaulo(iso)) return false;
  const todayYmd = ymdFmt(new Date());
  return parseY(todayYmd) > parseY(deadline);
}

/** Vencido no dia do vencimento (0 dias) e depois — checkout até pagar. */
export function isSubscriptionExpiredByCalendarSaoPaulo(iso) {
  if (!iso) return false;
  const exp = new Date(iso);
  if (Number.isNaN(exp.getTime())) return false;

  const todayYmd = ymdFmt(new Date());
  const expiryYmd = ymdFmt(exp);
  return parseY(expiryYmd) <= parseY(todayYmd);
}
