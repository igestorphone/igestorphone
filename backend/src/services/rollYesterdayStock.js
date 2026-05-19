import { query } from '../config/database.js';

const dayCol = (alias) =>
  `(${alias}.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`;
const createdDayCol = (alias) =>
  `(${alias}.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`;

/**
 * Promove estoque de ONTEM para HOJE (SP):
 * 1) Desativa lixo ativo de hoje (listas ruins do dia)
 * 2) Ativos de ontem → updated_at agora
 * 3) Inativos de ontem → reativa + updated_at agora
 * 4) Após "Zerar estoque": inativos com data de HOJE mas criados antes de hoje (= catálogo de ontem)
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
        AND ${dayCol('products')} = $1::date
    `,
      [hoje]
    );
    deactivatedToday = offToday.rowCount || 0;
  }

  const bumpActiveYesterday = await query(
    `
    UPDATE products
    SET updated_at = NOW()
    WHERE is_active = true
      AND price > 0
      AND price IS NOT NULL
      AND ${dayCol('products')} = $1::date
  `,
    [ontem]
  );

  const restoreInactiveYesterday = await query(
    `
    UPDATE products
    SET is_active = true, updated_at = NOW()
    WHERE is_active = false
      AND price > 0
      AND price IS NOT NULL
      AND ${dayCol('products')} = $1::date
  `,
    [ontem]
  );

  // Zerar estoque: ontem ativo virou inativo com updated_at = hoje; não reativar itens criados hoje.
  const restoreZeroedCatalog = await query(
    `
    UPDATE products
    SET is_active = true, updated_at = NOW()
    WHERE is_active = false
      AND price > 0
      AND price IS NOT NULL
      AND ${dayCol('products')} = $1::date
      AND ${createdDayCol('products')} < $1::date
  `,
    [hoje]
  );

  const rolled =
    (bumpActiveYesterday.rowCount || 0) +
    (restoreInactiveYesterday.rowCount || 0) +
    (restoreZeroedCatalog.rowCount || 0);

  const suppliersToday = await query(
    `
    SELECT COUNT(DISTINCT supplier_id)::int AS n
    FROM products p
    WHERE p.is_active = true
      AND p.price > 0
      AND ${dayCol('p')} = $1::date
  `,
    [hoje]
  );

  const productsToday = await query(
    `
    SELECT COUNT(*)::int AS n
    FROM products p
    WHERE p.is_active = true
      AND p.price > 0
      AND ${dayCol('p')} = $1::date
  `,
    [hoje]
  );

  return {
    hoje,
    ontem,
    deactivatedToday,
    rolled,
    bumpedActiveYesterday: bumpActiveYesterday.rowCount || 0,
    restoredInactiveYesterday: restoreInactiveYesterday.rowCount || 0,
    restoredZeroedCatalog: restoreZeroedCatalog.rowCount || 0,
    suppliersToday: suppliersToday.rows[0]?.n ?? 0,
    productsToday: productsToday.rows[0]?.n ?? 0,
  };
}
