import dotenv from 'dotenv';
import { query } from './config/database.js';

dotenv.config();

/**
 * Script para limpar produtos de vitrine de um fornecedor específico
 * Desativa produtos que podem ser vitrine mesmo sem marcadores explícitos
 */
async function cleanupVitrineBySupplier(supplierName) {
  try {
    console.log(`🧹 Limpando produtos de vitrine do fornecedor: ${supplierName}...`);
    
    // Buscar ID do fornecedor
    const supplierResult = await query(
      'SELECT id, name FROM suppliers WHERE LOWER(name) = LOWER($1)',
      [supplierName]
    );
    
    if (supplierResult.rows.length === 0) {
      console.log(`❌ Fornecedor "${supplierName}" não encontrado!`);
      return;
    }
    
    const supplierId = supplierResult.rows[0].id;
    const supplierNameFound = supplierResult.rows[0].name;
    console.log(`✅ Fornecedor encontrado: ID ${supplierId} - ${supplierNameFound}`);
    
    // Verificar colunas existentes
    const columnsResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `);
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const hasConditionDetail = existingColumns.includes('condition_detail');
    const hasVariant = existingColumns.includes('variant');
    
    // Buscar TODOS os produtos ativos deste fornecedor
    let selectColumns = 'id, name, model, condition, price';
    if (hasConditionDetail) selectColumns += ', condition_detail';
    if (hasVariant) selectColumns += ', variant';
    
    const allProductsQuery = `
      SELECT ${selectColumns}
      FROM products 
      WHERE supplier_id = $1 AND is_active = true
      ORDER BY price ASC
    `;
    
    const allProducts = await query(allProductsQuery, [supplierId]);
    console.log(`\n📊 Total de produtos ativos do fornecedor: ${allProducts.rows.length}`);
    
    if (allProducts.rows.length === 0) {
      console.log('✅ Nenhum produto ativo encontrado para este fornecedor.');
      return;
    }
    
    // Listar todos os produtos para análise
    console.log('\n📋 Produtos ativos do fornecedor:');
    allProducts.rows.forEach((product, index) => {
      const detail = hasConditionDetail ? product.condition_detail || '' : '';
      const variant = hasVariant ? product.variant || '' : '';
      console.log(`   ${index + 1}. ID ${product.id}: ${product.name} (${product.model || 'sem modelo'}) - ${product.condition} ${detail} ${variant} - R$ ${product.price}`);
    });
    
    // Construir query para desativar produtos de vitrine
    let whereClause = `
      WHERE supplier_id = $1 
        AND is_active = true
        AND (
          -- Verificar name
          name ILIKE '%VITRINE%'
          OR name ILIKE '%SWAP%'
          OR name ILIKE '%SEMINOVO%'
          OR name ILIKE '%SEMI%NOVO%'
          OR name ILIKE '%USADO%'
          OR name ILIKE '%RECONDICIONADO%'
          -- Verificar model
          OR model ILIKE '%VITRINE%'
          OR model ILIKE '%SWAP%'
          OR model ILIKE '%SEMINOVO%'
          -- Verificar condition
          OR condition = 'Seminovo'
          OR condition = 'Usado'
          OR condition = 'Recondicionado'
    `;
    
    if (hasConditionDetail) {
      whereClause += `
          -- Verificar condition_detail
          OR condition_detail ILIKE '%VITRINE%' 
          OR condition_detail ILIKE '%SWAP%' 
          OR condition_detail ILIKE '%SEMINOVO%' 
          OR condition_detail ILIKE '%USADO%'
          OR condition_detail ILIKE '%RECONDICIONADO%'
      `;
    }
    
    if (hasVariant) {
      whereClause += `
          -- Verificar variant
          OR variant ILIKE '%VITRINE%'
          OR variant ILIKE '%SWAP%'
          OR variant ILIKE '%SEMINOVO%'
      `;
    }
    
    whereClause += `
        )
    `;
    
    // Contar produtos de vitrine
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await query(countQuery, [supplierId]);
    const totalVitrine = parseInt(countResult.rows[0].total);
    
    console.log(`\n🚫 Produtos de vitrine encontrados: ${totalVitrine}`);
    
    if (totalVitrine > 0) {
      // Desativar produtos de vitrine
      const deactivateQuery = `
        UPDATE products 
        SET is_active = false,
            updated_at = NOW()
        ${whereClause}
      `;
      const deactivateResult = await query(deactivateQuery, [supplierId]);
      console.log(`✅ ${deactivateResult.rowCount} produtos de vitrine foram DESATIVADOS`);
    }
    
    // Verificar produtos com preços suspeitosamente baixos (possíveis vitrine)
    // iPhone 11 por R$ 1.000 é muito barato para ser novo
    const suspiciousPriceQuery = `
      SELECT ${selectColumns}
      FROM products 
      WHERE supplier_id = $1 
        AND is_active = true
        AND (
          (name ILIKE '%iPhone 11%' AND price < 2000)
          OR (name ILIKE '%iPhone 12%' AND price < 3000)
          OR (name ILIKE '%iPhone 13%' AND price < 3500)
          OR (name ILIKE '%iPhone 14%' AND price < 4000)
          OR (name ILIKE '%iPhone 15%' AND price < 5000)
          OR (name ILIKE '%iPhone 16%' AND price < 6000)
        )
        AND condition = 'Novo'
      ORDER BY price ASC
    `;
    
    const suspiciousProducts = await query(suspiciousPriceQuery, [supplierId]);
    
    if (suspiciousProducts.rows.length > 0) {
      console.log(`\n⚠️  ATENÇÃO: ${suspiciousProducts.rows.length} produtos com preços SUSPEITOSAMENTE BAIXOS encontrados:`);
      suspiciousProducts.rows.forEach((product, index) => {
        const detail = hasConditionDetail ? product.condition_detail || '' : '';
        console.log(`   ${index + 1}. ID ${product.id}: ${product.name} (${product.model || 'sem modelo'}) - R$ ${product.price} - ${product.condition} ${detail}`);
      });
      
      console.log('\n❓ Deseja desativar estes produtos também? (Eles podem ser vitrine com preços baixos)');
      console.log('   Execute: UPDATE products SET is_active = false WHERE id IN (IDs_AQUI)');
    }
    
    // Estatísticas finais
    const finalStats = await query(`
      SELECT 
        COUNT(*) as total_ativos,
        COUNT(CASE WHEN condition = 'Novo' THEN 1 END) as novos,
        COUNT(CASE WHEN condition = 'Seminovo' THEN 1 END) as seminovos
      FROM products 
      WHERE supplier_id = $1 AND is_active = true
    `, [supplierId]);
    
    console.log('\n📊 Estatísticas finais do fornecedor:');
    console.log(`   - Produtos ativos: ${finalStats.rows[0].total_ativos}`);
    console.log(`   - Produtos novos: ${finalStats.rows[0].novos}`);
    console.log(`   - Produtos seminovos: ${finalStats.rows[0].seminovos}`);
    
    console.log('\n✅ Limpeza concluída!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

// Executar se chamado diretamente
const supplierName = process.argv[2] || 'Só Iphone';
cleanupVitrineBySupplier(supplierName)
  .then(() => {
    console.log('✅ Script finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });

