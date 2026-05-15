/**
 * Promove produtos de ONTEM (SP) para HOJE: updated_at = agora.
 * Use quando não houve processamento de listas hoje (ex.: ban WPP 24h).
 *
 *   node backend/src/scripts/roll-yesterday-products-to-today.js
 *   node backend/src/scripts/roll-yesterday-products-to-today.js --dry-run
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import pkg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const { Pool } = pkg
const dryRun = process.argv.includes('--dry-run')

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'igestorphone',
        user: process.env.DB_USER || 'MAC',
        password: process.env.DB_PASSWORD || '',
      }
)

async function main() {
  const client = await pool.connect()
  try {
    const meta = await client.query(`
      SELECT
        (NOW() AT TIME ZONE 'America/Sao_Paulo')::date AS hoje,
        ((NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 1) AS ontem
    `)
    const { hoje, ontem } = meta.rows[0]
    console.log(`📅 Hoje (SP): ${hoje} · Ontem: ${ontem}`)
    if (dryRun) console.log('⚠️  Modo dry-run — nenhum UPDATE\n')

    const count = await client.query(
      `
      SELECT COUNT(*)::int AS n
      FROM products p
      WHERE p.is_active = true
        AND p.price > 0
        AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
    `,
      [ontem]
    )
    const n = count.rows[0]?.n ?? 0
    console.log(`📦 Produtos ativos de ontem a promover: ${n}`)

    if (n === 0) {
      console.log('✅ Nada para atualizar.')
      return
    }

    if (!dryRun) {
      const upd = await client.query(
        `
        UPDATE products
        SET updated_at = NOW()
        WHERE is_active = true
          AND price > 0
          AND (updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
      `,
        [ontem]
      )
      console.log(`✅ ${upd.rowCount} produto(s) com updated_at = agora (aparecem em "Hoje")`)
    }

    const suppliers = await client.query(
      `
      SELECT COUNT(DISTINCT supplier_id)::int AS n
      FROM products p
      WHERE p.is_active = true
        AND p.price > 0
        AND (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = $1::date
    `,
      [hoje]
    )
    console.log(`📊 Fornecedores com lista em hoje (após script): ${suppliers.rows[0]?.n ?? 0}`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
