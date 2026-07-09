/**
 * One-off: unifica iPad A16 → iPad 11 no catálogo existente.
 * Uso (na pasta backend): node src/scripts/normalize-ipad-a16.js
 */
import dotenv from 'dotenv';
dotenv.config();

import { query } from '../config/database.js';
import pool from '../config/database.js';
import { hasBaseIPad11Signal, normalizeIPadProduct } from '../utils/ipadNormalizer.js';

async function main() {
  const { rows } = await query(`
    SELECT id, name, model, storage, color, condition_detail
    FROM products
    WHERE is_active = true
      AND (
        LOWER(COALESCE(model, '')) LIKE '%a16%'
        OR LOWER(COALESCE(name, '')) LIKE '%a16%'
        OR LOWER(COALESCE(model, '')) LIKE '%a 16%'
        OR LOWER(COALESCE(name, '')) LIKE '%a 16%'
        OR (
          (LOWER(COALESCE(model, '')) LIKE '%ipad%11%' OR LOWER(COALESCE(name, '')) LIKE '%ipad%11%')
          AND LOWER(COALESCE(model, '')) NOT LIKE '%pro%'
          AND LOWER(COALESCE(name, '')) NOT LIKE '%pro%'
          AND LOWER(COALESCE(model, '')) NOT LIKE '%air%'
          AND LOWER(COALESCE(name, '')) NOT LIKE '%air%'
        )
      )
  `);

  console.log(`Encontrados ${rows.length} candidatos iPad A16/11`);

  let updated = 0;
  for (const row of rows) {
    if (!hasBaseIPad11Signal(row)) continue;
    const normalized = normalizeIPadProduct(row);
    if (normalized.model === row.model && normalized.name === row.name) continue;

    await query(
      `UPDATE products SET model = $1, name = $2, updated_at = NOW() WHERE id = $3`,
      [normalized.model, normalized.name, row.id]
    );
    updated += 1;
    console.log(`  #${row.id}: "${row.model}" → "${normalized.model}" | name: "${normalized.name}"`);
  }

  console.log(`Atualizados: ${updated}`);
  await pool.end();
}

main().catch(async (err) => {
  console.error(err);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
