import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), 'backend', '.env') });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER || 'MAC',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'igestorphone',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

async function clearSuppliersAndProducts() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Iniciando limpeza de fornecedores e produtos...');
    
    // Verificar quantidade antes
    const suppliersCount = await client.query('SELECT COUNT(*) as count FROM suppliers');
    const productsCount = await client.query('SELECT COUNT(*) as count FROM products');
    const priceHistoryCount = await client.query('SELECT COUNT(*) as count FROM price_history');
    
    console.log(`📊 Antes da limpeza:`);
    console.log(`   - Fornecedores: ${suppliersCount.rows[0].count}`);
    console.log(`   - Produtos: ${productsCount.rows[0].count}`);
    console.log(`   - Histórico de preços: ${priceHistoryCount.rows[0].count}`);
    
    // Iniciar transação
    await client.query('BEGIN');
    
    // Deletar histórico de preços primeiro (porque tem foreign key para products)
    await client.query('DELETE FROM price_history');
    console.log('✅ Histórico de preços deletado');
    
    // Deletar produtos (porque tem foreign key para suppliers)
    await client.query('DELETE FROM products');
    console.log('✅ Produtos deletados');
    
    // Deletar fornecedores (exceto se você quiser manter algum específico)
    await client.query('DELETE FROM suppliers');
    console.log('✅ Fornecedores deletados');
    
    // Resetar sequências
    await client.query("SELECT setval('suppliers_id_seq', 1, false)");
    await client.query("SELECT setval('products_id_seq', 1, false)");
    await client.query("SELECT setval('price_history_id_seq', 1, false)");
    console.log('✅ Sequências resetadas');
    
    // Commit da transação
    await client.query('COMMIT');
    
    // Verificar quantidade depois
    const suppliersCountAfter = await client.query('SELECT COUNT(*) as count FROM suppliers');
    const productsCountAfter = await client.query('SELECT COUNT(*) as count FROM products');
    const priceHistoryCountAfter = await client.query('SELECT COUNT(*) as count FROM price_history');
    
    console.log(`\n📊 Após a limpeza:`);
    console.log(`   - Fornecedores: ${suppliersCountAfter.rows[0].count}`);
    console.log(`   - Produtos: ${productsCountAfter.rows[0].count}`);
    console.log(`   - Histórico de preços: ${priceHistoryCountAfter.rows[0].count}`);
    
    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('✅ Usuários foram mantidos');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao limpar dados:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

clearSuppliersAndProducts()
  .then(() => {
    console.log('\n🎉 Processo finalizado!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });





