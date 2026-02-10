/**
 * Zera TODOS os produtos (is_active = false).
 * Use para começar do zero antes de processar novas listas (ex.: teste com 17 Pro e 17 Pro Max).
 *
 * Uso: cd backend && node src/scripts/zero-all-products.js
 */
import { query } from '../config/database.js'
import dotenv from 'dotenv'

dotenv.config()

async function zeroAllProducts() {
  try {
    const count = await query(`
      SELECT COUNT(*) AS total FROM products WHERE is_active = true
    `)
    const total = parseInt(count.rows[0].total, 10)
    console.log(`\n⚠️  Zerando todos os produtos (${total} ativos serão desativados)...\n`)

    const result = await query(`
      UPDATE products SET is_active = false, updated_at = NOW() WHERE is_active = true
    `)
    const updated = result.rowCount || 0
    console.log(`✅ ${updated} produtos desativados. Banco zerado para processar novas listas.\n`)
    process.exit(0)
  } catch (err) {
    console.error('❌ Erro ao zerar produtos:', err)
    process.exit(1)
  }
}

zeroAllProducts()
