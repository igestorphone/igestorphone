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

// Função query simplificada para o script
const query = async (text, params) => {
  const res = await pool.query(text, params);
  return res;
};

async function removeZeroPriceProducts(supplierName = null) {
  try {
    console.log('🔍 Buscando produtos com preço R$ 0...\n');

    // Construir query baseada no fornecedor
    let whereClause = `
      WHERE p.is_active = true
        AND (p.price = 0 OR p.price IS NULL OR p.price < 0.01)
    `;
    let queryParams = [];

    if (supplierName) {
      whereClause += ` AND s.name ILIKE $1`;
      queryParams.push(`%${supplierName}%`);
    }

    // 1. Ver quais produtos serão desativados
    const checkQuery = `
      SELECT 
        p.id,
        p.name,
        p.model,
        p.price,
        p.color,
        p.storage,
        s.name as supplier_name,
        p.created_at
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.created_at DESC
    `;

    const checkResult = await query(checkQuery, queryParams);
    const productsToDeactivate = checkResult.rows;

    if (productsToDeactivate.length === 0) {
      console.log('✅ Nenhum produto com preço R$ 0 encontrado!');
      await pool.end();
      process.exit(0);
    }

    console.log(`📦 Encontrados ${productsToDeactivate.length} produtos com preço R$ 0:\n`);

    productsToDeactivate.forEach((product, index) => {
      console.log(`   ${index + 1}. ID ${product.id}: ${product.name}`);
      console.log(`      Modelo: ${product.model || 'N/A'} | Preço: R$ ${product.price || 0}`);
      console.log(`      Fornecedor: ${product.supplier_name}`);
      console.log(`      Cor: ${product.color || 'N/A'} | Capacidade: ${product.storage || 'N/A'}`);
      console.log('');
    });

    // 2. Desativar produtos
    console.log('🔄 Desativando produtos...\n');

    const ids = productsToDeactivate.map(p => p.id);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');

    const deactivateQuery = `
      UPDATE products 
      SET is_active = false,
          updated_at = NOW()
      WHERE id IN (${placeholders})
    `;

    const deactivateResult = await query(deactivateQuery, ids);
    const deactivatedCount = deactivateResult.rowCount || 0;

    console.log(`✅ ${deactivatedCount} produtos DESATIVADOS com sucesso!\n`);

    // 3. Estatísticas
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
        COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos
      FROM products
    `);

    console.log('📊 Estatísticas:');
    console.log(`   - Produtos ativos: ${stats.rows[0].produtos_ativos}`);
    console.log(`   - Produtos inativos: ${stats.rows[0].produtos_inativos}`);
    console.log('\n✅ Concluído!');

  } catch (error) {
    console.error('❌ Erro ao remover produtos:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Obter argumento da linha de comando (nome do fornecedor opcional)
const supplierName = process.argv[2] || null;

if (supplierName) {
  console.log(`🎯 Filtrando por fornecedor: "${supplierName}"\n`);
}

removeZeroPriceProducts(supplierName);

