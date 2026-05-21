import { query } from '../config/database.js';
import {
  isSubscriptionExpiredByCalendarSaoPaulo,
  isPastPaymentGracePeriodSaoPaulo,
} from '../utils/subscriptionExpiryCalendar.js';
import { deleteUserAccountPermanently } from './deleteUserAccount.js';

/** Remove contas vencidas há mais de 10 dias sem pagamento (não-admin). */
export async function purgeOverdueAccountsPastGrace(logger = console) {
  const result = await query(`
    SELECT id, email, subscription_expires_at, subscription_status, tipo
    FROM users
    WHERE subscription_expires_at IS NOT NULL
      AND LOWER(COALESCE(tipo, '')) <> 'admin'
  `);

  let purged = 0;
  for (const row of result.rows) {
    if (!isSubscriptionExpiredByCalendarSaoPaulo(row.subscription_expires_at)) continue;
    if (!isPastPaymentGracePeriodSaoPaulo(row.subscription_expires_at)) continue;

    try {
      const r = await deleteUserAccountPermanently(row.id, { reason: 'grace_period_expired' });
      if (r.deleted) {
        purged += 1;
        logger.info?.(`🗑️ Conta excluída (sem pagamento após tolerância): ${row.email}`);
      }
    } catch (e) {
      logger.error?.(`❌ Falha ao excluir ${row.email}:`, e);
    }
  }

  if (purged > 0) {
    logger.info?.(`✅ ${purged} conta(s) excluída(s) após ${process.env.SUBSCRIPTION_PAYMENT_GRACE_DAYS || 10} dias sem pagamento`);
  }
  return { purged };
}
