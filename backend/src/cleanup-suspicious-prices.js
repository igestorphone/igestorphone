import dotenv from 'dotenv';
import { query } from './config/database.js';

dotenv.config();

/**
 * Script para desativar produtos com preços suspeitosamente baixos
 * Preços muito baixos indicam que podem ser vitrine mesmo marcados como "Novo"
 */
async function cleanupSuspiciousPrices() {
  try {
    console.log('🧹 Limpando produtos com preços suspeitosamente baixos (possíveis vitrine)...\n');
    
    // Definir limites de preço mínimo por modelo (valores muito baixos indicam vitrine)
    const priceLimits = {
      'iPhone 11': 2000,  // iPhone 11 novo não custa menos de R$ 2.000
      'iPhone 12': 3000,  // iPhone 12 novo não custa menos de R$ 3.000
      'iPhone 13': 3500,  // iPhone 13 novo não custa menos de R$ 3.500
      'iPhone 14': 4000,  // iPhone 14 novo não custa menos de R$ 4.000
      'iPhone 15': 5000,  // iPhone 15 novo não custa menos de R$ 5.000
      'iPhone 16': 6000,  // iPhone 16 novo não custa menos de R$ 6.000
    };
    
    // Buscar produtos suspeitos
    const suspiciousQuery = `
      SELECT p.id, p.name, p.model, p.condition, p.price, p.condition_detail, s.name as supplier_name
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = true
        AND p.condition = 'Novo'
        AND (
          (p.name ILIKE '%iPhone 11%' AND p.price < 2000)
          OR (p.name ILIKE '%iPhone 12%' AND p.price < 3000)
          OR (p.name ILIKE '%iPhone 13%' AND p.price < 3500)
          OR (p.name ILIKE '%iPhone 14%' AND p.price < 4000)
          OR (p.name ILIKE '%iPhone 15%' AND p.price < 5000)
          OR (p.name ILIKE '%iPhone 16%' AND p.price < 6000)
          OR (p.model ILIKE '%iPhone 11%' AND p.price < 2000)
          OR (p.model ILIKE '%iPhone 12%' AND p.price < 3000)
          OR (p.model ILIKE '%iPhone 13%' AND p.price < 3500)
          OR (p.model ILIKE '%iPhone 14%' AND p.price < 4000)
          OR (p.model ILIKE '%iPhone 15%' AND p.price < 5000)
          OR (p.model ILIKE '%iPhone 16%' AND p.price < 6000)
        )
      ORDER BY p.price ASC
    `;
    
    const suspicious = await query(suspiciousQuery);
    
    console.log(`📊 ${suspicious.rows.length} produtos com preços SUSPEITOSAMENTE BAIXOS encontrados:\n`);
    
    if (suspicious.rows.length === 0) {
      console.log('✅ Nenhum produto com preço suspeito encontrado!');
      return;
    }
    
    // Listar produtos que serão desativados
    suspicious.rows.forEach((p, index) => {
      console.log(`   ${index + 1}. ID ${p.id}: ${p.name} (${p.model || 'sem modelo'})`);
      console.log(`      Fornecedor: ${p.supplier_name} | Preço: R$ ${p.price} | Condition: ${p.condition} ${p.condition_detail || ''}`);
      console.log('');
    });
    
    // Desativar produtos suspeitos
    console.log('🔄 Desativando produtos com preços suspeitosamente baixos...');
    const ids = suspicious.rows.map(p => p.id);
    
    if (ids.length > 0) {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
      const deactivateQuery = `
        UPDATE products 
        SET is_active = false,
            updated_at = NOW()
        WHERE id IN (${placeholders})
      `;
      
      const result = await query(deactivateQuery, ids);
      console.log(`✅ ${result.rowCount} produtos foram DESATIVADOS`);
    }
    
    // Estatísticas
    const stats = await query(`
      SELECT 
        COUNT(*) as total_ativos,
        COUNT(CASE WHEN condition = 'Novo' THEN 1 END) as novos
      FROM products 
      WHERE is_active = true
    `);
    
    console.log('\n📊 Estatísticas após limpeza:');
    console.log(`   - Produtos ativos: ${stats.rows[0].total_ativos}`);
    console.log(`   - Produtos novos: ${stats.rows[0].novos}`);
    
    console.log('\n✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

cleanupSuspiciousPrices()
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });




