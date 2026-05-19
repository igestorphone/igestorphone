import { query } from '../config/database.js';

/**
 * Ban WPP / falha no processamento de hoje:
 * 1) Desativa produtos ativos de HOJE (SP) — lixo do dia ruim
 * 2) Promove ONTEM → updated_at = agora (aparecem em "Hoje")
 */
export async function rollYesterdayProductsToToday({ deactivateToday = true } = {}) {
  const meta = await query(`
    SELECT
      (NOW() AT TIME ZONE 'America/Sao_Paulo')::date AS hoje,
      ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 1) AS ontem
  `);
  const { hoje, ontem } = meta.rows[0];

  let deactivatedToday = 0;
  if (deactivateToday) {
    const offToday = await query(
      `
      UPDATE products
      SET is_active = false, updated_at = NOW()
      WHERE is_active = true
        AND (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
    `,
      [hoje]
    );
    deactivatedToday = offToday.rowCount || 0;
  }

  const countYesterday = await query(
    `
    SELECT COUNT(*)::int AS n
    FROM products p
    WHERE p.is_active = true
      AND p.price > 0
      AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
  `,
    [ontem]
  );
  const yesterdayActive = countYesterday.rows[0]?.n ?? 0;

  let rolled = 0;
  let emergencyRestore = 0;
  if (yesterdayActive > 0) {
    const upd = await query(
      `
      UPDATE products
      SET updated_at = NOW()
      WHERE is_active = true
        AND price > 0
        AND (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
    `,
      [ontem]
    );
    rolled = upd.rowCount || 0;
  } else {
    // Após "Zerar estoque": tudo fica inativo com data de HOJE — reativa o catálogo inteiro com preço.
    const emergency = await query(
      `
      UPDATE products
      SET is_active = true, updated_at = NOW()
      WHERE is_active = false
        AND price > 0
        AND price IS NOT NULL
    `
    );
    emergencyRestore = emergency.rowCount || 0;
    rolled = emergencyRestore;
  }

  const suppliersToday = await query(
    `
    SELECT COUNT(DISTINCT supplier_id)::int AS n
    FROM products p
    WHERE p.is_active = true
      AND p.price > 0
      AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
  `,
    [hoje]
  );

  const productsToday = await query(
    `
    SELECT COUNT(*)::int AS n
    FROM products p
    WHERE p.is_active = true
      AND p.price > 0
      AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
  `,
    [hoje]
  );

  return {
    hoje,
    ontem,
    deactivatedToday,
    rolled,
    emergencyRestore,
    suppliersToday: suppliersToday.rows[0]?.n ?? 0,
    productsToday: productsToday.rows[0]?.n ?? 0,
  };
}
