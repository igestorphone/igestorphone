import { query } from '../config/database.js';

const dayCol = (alias) =>
  `(${alias}.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`;
const createdDayCol = (alias) =>
  `(${alias}.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`;
const todaySP = `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`;

/**
 * Promove estoque de ONTEM para HOJE (SP):
 * 1) Desativa lixo ativo de hoje (listas ruins do dia)
 * 2) Ativos de ontem → updated_at agora
 * 3) Inativos de ontem → reativa + updated_at agora
 * 4) Após "Zerar estoque": inativos (hoje ou ontem) criados antes de hoje
 * 5) Se ainda poucos ativos: reativa todo inativo com preço (exceto criados hoje)
 */
export async function rollYesterdayProductsToToday({ deactivateToday = true } = {}) {
  const meta = await query(`
    SELECT
      ${todaySP} AS hoje,
      (${todaySP} - 1) AS ontem
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

  // Zerar estoque: catálogo fica inativo com data hoje OU ontem; não reativar itens criados hoje.
  const restoreZeroedCatalog = await query(
    `
    UPDATE products
    SET is_active = true, updated_at = NOW()
    WHERE is_active = false
      AND price > 0
      AND price IS NOT NULL
      AND ${dayCol('products')} IN ($1::date, $2::date)
      AND ${createdDayCol('products')} < $1::date
  `,
    [hoje, ontem]
  );

  let fallbackRestore = 0;
  const activeCheck = await query(
    `
    SELECT COUNT(*)::int AS n
    FROM products
    WHERE is_active = true AND price > 0 AND price IS NOT NULL
      AND ${dayCol('products')} = $1::date
  `,
    [hoje]
  );
  const activeNow = activeCheck.rows[0]?.n ?? 0;

  if (activeNow < 200) {
    const fallback = await query(
      `
      UPDATE products
      SET is_active = true, updated_at = NOW()
      WHERE is_active = false
        AND price > 0
        AND price IS NOT NULL
        AND ${createdDayCol('products')} < $1::date
    `,
      [hoje]
    );
    fallbackRestore = fallback.rowCount || 0;
  }

  const rolled =
    (bumpActiveYesterday.rowCount || 0) +
    (restoreInactiveYesterday.rowCount || 0) +
    (restoreZeroedCatalog.rowCount || 0) +
    fallbackRestore;

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
    fallbackRestore,
    suppliersToday: suppliersToday.rows[0]?.n ?? 0,
    productsToday: productsToday.rows[0]?.n ?? 0,
  };
}
