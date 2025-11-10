import { query } from './config/database.js';

/**
 * Script para limpar dados antigos do banco de dados
 * Mantém apenas os últimos 3 dias de dados
 */
async function cleanupOldData() {
  try {
    console.log('🧹 Iniciando limpeza de dados antigos...');
    
    // Limpar histórico de preços com mais de 3 dias
    const priceHistoryResult = await query(`
      DELETE FROM price_history 
      WHERE recorded_at < NOW() - INTERVAL '3 days'
    `);
    console.log(`✅ Histórico de preços: ${priceHistoryResult.rowCount} registros removidos`);

    // Limpar produtos que não foram atualizados há mais de 3 dias
    // (mas manter produtos que foram criados recentemente)
    const productsResult = await query(`
      DELETE FROM products 
      WHERE updated_at < NOW() - INTERVAL '3 days'
        AND created_at < NOW() - INTERVAL '3 days'
    `);
    console.log(`✅ Produtos: ${productsResult.rowCount} produtos removidos`);

    // Limpar logs de sistema com mais de 3 dias
    const logsResult = await query(`
      DELETE FROM system_logs 
      WHERE created_at < NOW() - INTERVAL '3 days'
    `);
    console.log(`✅ Logs de sistema: ${logsResult.rowCount} logs removidos`);

    // Estatísticas após limpeza
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM price_history) as price_history,
        (SELECT COUNT(*) FROM system_logs) as system_logs
    `);

    console.log('\n📊 Estatísticas após limpeza:');
    console.log(`   - Produtos ativos: ${stats.rows[0].products}`);
    console.log(`   - Histórico de preços: ${stats.rows[0].price_history}`);
    console.log(`   - Logs de sistema: ${stats.rows[0].system_logs}`);

    console.log('\n✅ Limpeza concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupOldData()
    .then(() => {
      console.log('✅ Script de limpeza finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export default cleanupOldData;





