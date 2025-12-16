import { query } from '../config/database.js'
import { normalizeColor } from '../utils/colorNormalizer.js'

/**
 * Script para atualizar as cores de todos os produtos no banco de dados
 * usando o novo sistema de normalização baseado no modelo
 */
async function updateProductColors() {
  try {
    console.log('🔄 Iniciando atualização de cores dos produtos...\n')

    // Buscar todos os produtos ativos
    const result = await query(`
      SELECT id, name, model, color
      FROM products
      WHERE is_active = true
      ORDER BY created_at DESC
    `)

    console.log(`📦 Total de produtos encontrados: ${result.rows.length}\n`)

    let updated = 0
    let unchanged = 0
    let errors = 0

    for (const product of result.rows) {
      try {
        const oldColor = product.color
        const newColor = normalizeColor(oldColor || '', product.model || product.name || '')

        // Se a cor mudou ou não estava normalizada
        if (oldColor !== newColor && newColor) {
          await query(
            `UPDATE products SET color = $1, updated_at = NOW() WHERE id = $2`,
            [newColor, product.id]
          )
          updated++
          
          if (updated <= 10 || updated % 100 === 0) {
            console.log(`✅ [${updated}] ID ${product.id}: "${oldColor}" → "${newColor}" (${product.model || product.name})`)
          }
        } else {
          unchanged++
        }
      } catch (error) {
        errors++
        console.error(`❌ Erro ao processar produto ID ${product.id}:`, error.message)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 Resumo da atualização:')
    console.log(`   ✅ Atualizados: ${updated}`)
    console.log(`   ⏭️  Sem alteração: ${unchanged}`)
    console.log(`   ❌ Erros: ${errors}`)
    console.log('='.repeat(60) + '\n')

    console.log('✅ Atualização de cores concluída com sucesso!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Erro ao atualizar cores:', error)
    process.exit(1)
  }
}

// Executar script
updateProductColors()

