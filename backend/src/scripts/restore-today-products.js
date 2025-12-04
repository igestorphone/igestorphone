import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

// Configurar conexão com banco de dados
const isProduction = process.env.NODE_ENV === 'production';
let dbConfig;

if (process.env.DATABASE_URL) {
  dbConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
} else {
  dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'igestorphone',
    user: process.env.DB_USER || 'MAC',
    password: process.env.DB_PASSWORD || '',
    ssl: isProduction ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(dbConfig);

const query = async (text, params) => {
  const res = await pool.query(text, params);
  return res;
};

async function restoreTodayProducts() {
  try {
    console.log('🚨 RESTAURANDO TODOS OS PRODUTOS DE HOJE...\n');
    
    // Obter data de hoje no timezone do Brasil
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`📅 Data de hoje: ${todayStr}\n`);
    
    // Primeiro, verificar quantos produtos foram desativados hoje
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = false
        AND (
          DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
          OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
        )
    `, [todayStr]);
    
    const totalToRestore = parseInt(countResult.rows[0].total);
    console.log(`📦 Produtos desativados de hoje encontrados: ${totalToRestore}\n`);
    
    if (totalToRestore === 0) {
      console.log('✅ Nenhum produto desativado hoje para restaurar!');
      await pool.end();
      process.exit(0);
    }
    
    // Restaurar TODOS os produtos de hoje (atualizados OU criados hoje)
    console.log('🔄 Restaurando produtos...');
    const result = await query(`
      UPDATE products 
      SET is_active = true,
          updated_at = NOW()
      WHERE is_active = false
        AND (
          DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
          OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
        )
    `, [todayStr]);
    
    const restoredCount = result.rowCount || 0;
    console.log(`\n✅ ${restoredCount} produtos RESTAURADOS!\n`);
    
    // Verificar produtos ativos de hoje
    const activeCount = await query(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = true
        AND (
          DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
          OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $1::date
        )
    `, [todayStr]);
    
    const totalActiveToday = parseInt(activeCount.rows[0].total);
    
    // Estatísticas gerais
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
        COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos
      FROM products
    `);
    
    console.log('📊 Estatísticas:');
    console.log(`   - Produtos ativos de HOJE: ${totalActiveToday}`);
    console.log(`   - Total de produtos ativos: ${stats.rows[0].produtos_ativos}`);
    console.log(`   - Total de produtos inativos: ${stats.rows[0].produtos_inativos}`);
    
    console.log('\n✅ RESTAURAÇÃO CONCLUÍDA COM SUCESSO!');
    
  } catch (error) {
    console.error('❌ Erro ao restaurar produtos:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

restoreTodayProducts();

