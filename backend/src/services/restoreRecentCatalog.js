import { query } from '../config/database.js';

const todaySP = `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`;
const createdDay = `(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`;
const updatedDay = `(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`;
const recentFrom = `(${todaySP} - 2)`;

/** Reativa listas dos últimos 3 dias (SP); desativa catálogo antigo reativado por engano. */
export async function restoreRecentCatalog() {
  const before = await query(`
    SELECT COUNT(*) FILTER (WHERE is_active AND price > 0)::int AS ativos
    FROM products
  `);

  const offAncient = await query(
    `
    UPDATE products
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
      AND price > 0
      AND price IS NOT NULL
      AND ${createdDay} < ${recentFrom}
  `
  );

  const onRecent = await query(
    `
    UPDATE products
    SET is_active = true, updated_at = NOW()
    WHERE is_active = false
      AND price > 0
      AND price IS NOT NULL
      AND (
        ${updatedDay} >= ${recentFrom}
        OR ${createdDay} >= ${recentFrom}
      )
  `
  );

  await query(`
    UPDATE suppliers s
    SET is_active = true
    WHERE EXISTS (
      SELECT 1 FROM products p
      WHERE p.supplier_id = s.id AND p.is_active = true AND p.price > 0
    )
  `);

  const after = await query(`
    SELECT
      COUNT(*) FILTER (WHERE is_active AND price > 0)::int AS ativos,
      COUNT(DISTINCT supplier_id) FILTER (WHERE is_active AND price > 0 AND supplier_id IS NOT NULL)::int AS fornecedores
    FROM products
  `);

  return {
    deactivated_ancient: offAncient.rowCount || 0,
    reactivated_recent: onRecent.rowCount || 0,
    active_before: before.rows[0]?.ativos ?? 0,
    active_after: after.rows[0]?.ativos ?? 0,
    suppliers_after: after.rows[0]?.fornecedores ?? 0,
  };
}
