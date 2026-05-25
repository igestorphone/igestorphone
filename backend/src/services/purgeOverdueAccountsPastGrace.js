import { query } from '../config/database.js';
import {
  isSubscriptionExpiredByCalendarSaoPaulo,
  isPastPaymentGracePeriodSaoPaulo,
  isPastCustomGracePeriodSaoPaulo,
} from '../utils/subscriptionExpiryCalendar.js';
import { deleteUserAccountPermanently } from './deleteUserAccount.js';

/** Remove contas vencidas sem pagamento (trial=5d, padrão=10d). */
export async function purgeOverdueAccountsPastGrace(logger = console) {
  const result = await query(`
    SELECT id, email, subscription_expires_at, subscription_status, tipo, trial_grace_days
    FROM users
    WHERE subscription_expires_at IS NOT NULL
      AND LOWER(COALESCE(tipo, '')) <> 'admin'
  `);

  let purged = 0;
  for (const row of result.rows) {
    if (!isSubscriptionExpiredByCalendarSaoPaulo(row.subscription_expires_at)) continue;

    const customGrace = row.trial_grace_days != null ? Number(row.trial_grace_days) : null;
    const pastGrace = customGrace != null
      ? isPastCustomGracePeriodSaoPaulo(row.subscription_expires_at, customGrace)
      : isPastPaymentGracePeriodSaoPaulo(row.subscription_expires_at);
    if (!pastGrace) continue;

    try {
      const r = await deleteUserAccountPermanently(row.id, { reason: 'grace_period_expired' });
      if (r.deleted) {
        purged += 1;
        const grace = customGrace ?? (parseInt(process.env.SUBSCRIPTION_PAYMENT_GRACE_DAYS || '10', 10));
        logger.info?.(`🗑️ Conta excluída (sem pagamento após ${grace}d): ${row.email}`);
      }
    } catch (e) {
      logger.error?.(`❌ Falha ao excluir ${row.email}:`, e);
    }
  }

  if (purged > 0) {
    logger.info?.(`✅ ${purged} conta(s) excluída(s) por tolerância vencida`);
  }
  return { purged };
}
