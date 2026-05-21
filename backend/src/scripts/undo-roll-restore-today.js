/**
 * @deprecated Use npm run db:restore-recent-catalog
 * Desfaz roll ontem→hoje (versão antiga só created_at=hoje).
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const todaySP = `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`;
const createdDay = `(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date`;

async function main() {
  const offOld = await query(
    `
    UPDATE products
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
      AND price > 0
      AND price IS NOT NULL
      AND ${createdDay} < ${todaySP}
  `
  );

  const onToday = await query(
    `
    UPDATE products
    SET is_active = true, updated_at = NOW()
    WHERE is_active = false
      AND price > 0
      AND price IS NOT NULL
      AND ${createdDay} = ${todaySP}
  `
  );

  const stats = await query(
    `
    SELECT
      COUNT(*) FILTER (WHERE is_active AND price > 0)::int AS ativos,
      COUNT(DISTINCT supplier_id) FILTER (WHERE is_active AND price > 0 AND supplier_id IS NOT NULL)::int AS fornecedores
    FROM products
  `
  );

  console.log(`🧹 Catálogo antigo desativado: ${offOld.rowCount || 0}`);
  console.log(`✅ Listas de hoje reativadas: ${onToday.rowCount || 0}`);
  console.log(`📊 Agora — produtos: ${stats.rows[0]?.ativos ?? 0} · fornecedores: ${stats.rows[0]?.fornecedores ?? 0}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
