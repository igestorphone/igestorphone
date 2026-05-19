import { query } from '../config/database.js';
import { rollYesterdayProductsToToday } from './rollYesterdayStock.js';

function envDisabled(name) {
  const v = String(process.env[name] || '').toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes';
}

/** Em produção: se o estoque de ontem sumiu após Zerar, promove ontem→hoje sem ação manual. */
export async function autoPromoteYesterdayStockIfNeeded(logger = console) {
  if (envDisabled('DISABLE_AUTO_STOCK_ROLL')) return null;
  if (process.env.NODE_ENV !== 'production') return null;

  const { rows } = await query(`
    SELECT
      COUNT(*) FILTER (
        WHERE p.is_active = true AND p.price > 0 AND p.price IS NOT NULL
          AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
              = (NOW() AT TIME ZONE 'America/Sao_Paulo')::date
      )::int AS active_today,
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

  const { active_today = 0, catalog_zeroed_today = 0, inactive_yesterday = 0 } = rows[0] || {};

  const needsRoll =
    catalog_zeroed_today >= 200 ||
    (active_today <= 50 && inactive_yesterday >= 200) ||
    (active_today <= 10 && catalog_zeroed_today >= 50);

  if (!needsRoll) return null;

  logger.info?.(
    `📦 Auto roll ontem→hoje (ativos hoje=${active_today}, zerados=${catalog_zeroed_today}, inativos ontem=${inactive_yesterday})`
  );

  const result = await rollYesterdayProductsToToday({ deactivateToday: true });
  logger.info?.(
    `✅ Estoque ontem→hoje: ${result.rolled} promovidos · ${result.productsToday} ativos hoje · ${result.suppliersToday} fornecedores`
  );
  return result;
}
