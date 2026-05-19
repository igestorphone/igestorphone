import { query } from '../config/database.js';
import { rollYesterdayProductsToToday } from './rollYesterdayStock.js';

function envEnabled(name) {
  const v = String(process.env[name] || '').toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes';
}

function envDisabled(name) {
  const v = String(process.env[name] || '').toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes';
}

/** Em produção: promove ontem→hoje quando o estoque sumiu (ex.: após Zerar). */
export async function autoPromoteYesterdayStockIfNeeded(logger = console) {
  if (envDisabled('DISABLE_AUTO_STOCK_ROLL')) return null;
  if (process.env.NODE_ENV !== 'production') return null;

  if (envEnabled('STOCK_FORCE_ROLL_ON_BOOT')) {
    logger.info?.('📦 STOCK_FORCE_ROLL_ON_BOOT: promovendo ontem→hoje...');
    const forced = await rollYesterdayProductsToToday({ deactivateToday: true });
    logger.info?.(
      `✅ Forçado: ${forced.rolled} · ${forced.productsToday} ativos · ${forced.suppliersToday} fornecedores`
    );
    return forced;
  }

  const { rows } = await query(`
    SELECT
      COUNT(*) FILTER (
        WHERE p.is_active = true AND p.price > 0 AND p.price IS NOT NULL
          AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
              = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
      )::int AS active_today,
      COUNT(*) FILTER (
        WHERE p.is_active = false AND p.price > 0 AND p.price IS NOT NULL
      )::int AS inactive_with_price,
      COUNT(*) FILTER (
        WHERE p.is_active = false AND p.price > 0 AND p.price IS NOT NULL
          AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
              = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
          AND (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
              < (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
      )::int AS catalog_zeroed_today,
      COUNT(*) FILTER (
        WHERE p.is_active = false AND p.price > 0 AND p.price IS NOT NULL
          AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
              = ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 1)
      )::int AS inactive_yesterday
    FROM products p
  `);

  const {
    active_today = 0,
    inactive_with_price = 0,
    catalog_zeroed_today = 0,
    inactive_yesterday = 0,
  } = rows[0] || {};

  const needsRoll =
    catalog_zeroed_today >= 50 ||
    inactive_yesterday >= 50 ||
    inactive_with_price >= 500 ||
    (active_today <= 100 && inactive_with_price > active_today) ||
    (active_today <= 10 && catalog_zeroed_today >= 3);

  if (!needsRoll) return null;

  logger.info?.(
    `📦 Auto roll ontem→hoje (ativos=${active_today}, inativos=${inactive_with_price}, zerados=${catalog_zeroed_today}, ontem=${inactive_yesterday})`
  );

  const result = await rollYesterdayProductsToToday({ deactivateToday: true });
  logger.info?.(
    `✅ Estoque ontem→hoje: ${result.rolled} promovidos · ${result.productsToday} ativos hoje · ${result.suppliersToday} fornecedores`
  );
  return result;
}
