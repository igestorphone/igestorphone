const SP = 'America/Sao_Paulo';

/**
 * Dias entre hoje (data civil em SP) e o dia civil da expiração em SP.
 * Igual ao frontend (`subscriptionExpiryCalendar.ts`).
 */
export function calendarDaysRemainingSaoPaulo(iso) {
  if (!iso) return null;
  const exp = new Date(iso);
  if (Number.isNaN(exp.getTime())) return null;

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayYmd = fmt.format(new Date());
  const expiryYmd = fmt.format(exp);
  const parseY = (ymd) => {
    const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
    return Date.UTC(y, m - 1, d);
  };
  const diff = Math.round((parseY(expiryYmd) - parseY(todayYmd)) / 86400000);
  return Math.max(0, diff);
}

/** Vencido só quando o dia civil da expiração (SP) é anterior a hoje — no dia do vencimento ainda tem acesso. */
export function isSubscriptionExpiredByCalendarSaoPaulo(iso) {
  if (!iso) return false;
  const exp = new Date(iso);
  if (Number.isNaN(exp.getTime())) return false;

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SP,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayYmd = fmt.format(new Date());
  const expiryYmd = fmt.format(exp);
  const parseY = (ymd) => {
    const [y, m, d] = ymd.split('-').map((n) => parseInt(n, 10));
    return Date.UTC(y, m - 1, d);
  };
  return parseY(expiryYmd) < parseY(todayYmd);
}
