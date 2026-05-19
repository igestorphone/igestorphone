/**
 * Promove produtos de ONTEM (SP) para HOJE: desativa lixo de hoje + updated_at = agora em ontem.
 *
 *   npm run db:roll-yesterday-to-today
 *   npm run db:roll-yesterday-to-today:dry
 */
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { rollYesterdayProductsToToday } from '../services/rollYesterdayStock.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const dryRun = process.argv.includes('--dry-run')

async function main() {
  if (dryRun) {
    console.log('⚠️  Dry-run: execute sem --dry-run para aplicar.\n')
    return
  }

  const r = await rollYesterdayProductsToToday({ deactivateToday: true })
  console.log(`📅 Hoje (SP): ${r.hoje} · Ontem: ${r.ontem}`)
  console.log(`🧹 Produtos de hoje desativados: ${r.deactivatedToday}`)
  console.log(`✅ Produtos de ontem promovidos: ${r.rolled}`)
  console.log(`📊 Após script — fornec.: ${r.suppliersToday} · produtos: ${r.productsToday}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
