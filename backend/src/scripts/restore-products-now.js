import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Script para restaurar produtos que foram desativados recentemente
 * Útil quando produtos foram zerados por engano antes da meia-noite
 * Uso: node src/scripts/restore-products-now.js   (padrão 24h)
 *      HOURS=48 node src/scripts/restore-products-now.js
 */
async function restoreProducts() {
  try {
    const hours = parseInt(process.env.HOURS || '24', 10);
    console.log(`🔄 Restaurando produtos desativados nas últimas ${hours}h...`);
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    console.log(`   Cutoff time: ${cutoffTime.toISOString()}`);
    
    // Ver quantos produtos foram desativados
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = false
        AND updated_at >= $1
    `, [cutoffTime]);
    
    const totalToRestore = parseInt(countResult.rows[0].total);
    console.log(`   Produtos desativados nas últimas ${hours}h: ${totalToRestore}`);
    
    if (totalToRestore === 0) {
      console.log('✅ Nenhum produto para restaurar!');
      return;
    }
    
    // Restaurar produtos
    const result = await query(`
      UPDATE products 
      SET is_active = true,
          updated_at = NOW()
      WHERE is_active = false
        AND updated_at >= $1
    `, [cutoffTime]);
    
    const restoredCount = result.rowCount || 0;
    console.log(`✅ ${restoredCount} produtos restaurados!`);
    
    // Estatísticas
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
        COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos
      FROM products
    `);
    
    console.log('\n📊 Estatísticas:');
    console.log(`   - Produtos ativos: ${stats.rows[0].produtos_ativos}`);
    console.log(`   - Produtos inativos: ${stats.rows[0].produtos_inativos}`);
    
    console.log('\n✅ Restauração concluída!');
    
  } catch (error) {
    console.error('❌ Erro ao restaurar produtos:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('restore-products-now')) {
  restoreProducts()
    .then(() => {
      console.log('✅ Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro:', error);
      process.exit(1);
    });
}

export default restoreProducts;

