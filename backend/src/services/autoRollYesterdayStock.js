import { rollYesterdayProductsToToday } from './rollYesterdayStock.js';

function envEnabled(name) {
  const v = String(process.env[name] || '').toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes';
}

function envDisabled(name) {
  const v = String(process.env[name] || '').toLowerCase().trim();
  return v === 'true' || v === '1' || v === 'yes';
}

/**
 * Só roda se STOCK_FORCE_ROLL_ON_BOOT=true (nunca automático no deploy).
 * Roll ontem→hoje troca o estoque do dia — usar só após Zerar estoque manual.
 */
export async function autoPromoteYesterdayStockIfNeeded(logger = console) {
  if (envDisabled('DISABLE_AUTO_STOCK_ROLL')) return null;
  if (process.env.NODE_ENV !== 'production') return null;

  if (!envEnabled('STOCK_FORCE_ROLL_ON_BOOT')) {
    return null;
  }

  if (envEnabled('STOCK_FORCE_ROLL_ON_BOOT')) {
    logger.info?.('📦 STOCK_FORCE_ROLL_ON_BOOT: promovendo ontem→hoje...');
    const forced = await rollYesterdayProductsToToday({ deactivateToday: true });
    logger.info?.(
      `✅ Forçado: ${forced.rolled} · ${forced.productsToday} ativos · ${forced.suppliersToday} fornecedores`
    );
    return forced;
  }

  return null;
}
