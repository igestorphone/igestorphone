/**
 * Reativa TODO produto inativo com preço (pós Zerar estoque).
 * npm run db:restore-all-stock
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { query } from '../config/database.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function main() {
  const before = await query(`
    SELECT COUNT(*)::int AS n FROM products WHERE is_active = false AND price > 0
  `)
  console.log(`Inativos com preço: ${before.rows[0]?.n ?? 0}`)

  const upd = await query(`
    UPDATE products
    SET is_active = true, updated_at = NOW()
    WHERE is_active = false AND price > 0 AND price IS NOT NULL
  `)
  console.log(`✅ Reativados: ${upd.rowCount}`)

  const after = await query(`
    SELECT
      COUNT(*)::int AS produtos,
      COUNT(DISTINCT supplier_id)::int AS fornecedores
    FROM products
    WHERE is_active = true AND price > 0
  `)
  console.log(`📊 Ativos agora: ${after.rows[0]?.produtos} produtos · ${after.rows[0]?.fornecedores} fornecedores`)
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
