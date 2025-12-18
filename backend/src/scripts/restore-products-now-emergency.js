import { query } from '../config/database.js';

/**
 * SCRIPT DE EMERGÊNCIA: Restaurar TODOS os produtos de HOJE
 * Execute este script quando produtos forem zerados por engano
 */
async function restoreProductsTodayEmergency() {
  try {
    console.log('🚨 EMERGÊNCIA: Restaurando TODOS os produtos de HOJE...\n');
    
    // Obter data de hoje no timezone do Brasil
    const todayResult = await query(`
      SELECT 
        NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
        DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) as data_brasil
    `);
    
    const hojeBrasil = todayResult.rows[0].data_brasil;
    const agoraBrasil = todayResult.rows[0].agora_brasil;
    
    console.log(`📅 Data/Hora atual no Brasil: ${agoraBrasil}`);
    console.log(`📅 Data de hoje (Brasil): ${hojeBrasil}\n`);
    
    // Contar produtos desativados de hoje
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = false
        AND (
          DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
          OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
        )
    `, [hojeBrasil]);
    
    const totalDesativados = parseInt(countResult.rows[0].total);
    console.log(`📦 Produtos desativados de hoje encontrados: ${totalDesativados}\n`);
    
    if (totalDesativados === 0) {
      console.log('✅ Nenhum produto desativado hoje para restaurar!');
      process.exit(0);
    }
    
    // Restaurar TODOS os produtos de hoje
    console.log('🔄 Restaurando produtos de hoje...');
    const result = await query(`
      UPDATE products 
      SET is_active = true,
          updated_at = NOW()
      WHERE is_active = false
        AND (
          DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
          OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
        )
    `, [hojeBrasil]);
    
    const restoredCount = result.rowCount || 0;
    console.log(`\n✅ ${restoredCount} produtos RESTAURADOS!\n`);
    
    // Verificar produtos ativos de hoje
    const produtosAtivosHoje = await query(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = true
        AND (
          DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
          OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
        )
    `, [hojeBrasil]);
    
    console.log(`📊 Produtos ativos de hoje: ${produtosAtivosHoje.rows[0].total}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao restaurar produtos:', error);
    process.exit(1);
  }
}

restoreProductsTodayEmergency();

