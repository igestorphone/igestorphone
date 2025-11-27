import dotenv from 'dotenv';
import { query } from './config/database.js';

dotenv.config();

/**
 * Script para limpar TODOS os produtos de vitrine/seminovos/swap do banco de dados
 * Desativa produtos que contêm qualquer indicação de vitrine/seminovo/swap
 */
async function cleanupVitrineProducts() {
  try {
    console.log('🧹 Iniciando limpeza de produtos de vitrine/seminovos/swap...');
    console.log('⚠️  ATENÇÃO: Esta operação irá DESATIVAR produtos de vitrine!');
    
    // Verificar quais colunas existem na tabela products
    const columnsResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
      ORDER BY column_name
    `);
    
    const existingColumns = columnsResult.rows.map(row => row.column_name);
    const hasConditionDetail = existingColumns.includes('condition_detail');
    const hasVariant = existingColumns.includes('variant');
    
    console.log(`\n📋 Colunas encontradas na tabela products: ${existingColumns.join(', ')}`);
    console.log(`   - condition_detail: ${hasConditionDetail ? '✅ existe' : '❌ não existe'}`);
    console.log(`   - variant: ${hasVariant ? '✅ existe' : '❌ não existe'}`);

    // Construir query dinamicamente baseado nas colunas existentes
    let whereClause = `
      WHERE is_active = true
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

    // Contar quantos produtos serão afetados
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await query(countQuery);
    const totalToDeactivate = parseInt(countResult.rows[0].total);
    
    console.log(`\n📊 Produtos de vitrine/seminovos encontrados: ${totalToDeactivate}`);

    if (totalToDeactivate === 0) {
      console.log('✅ Nenhum produto de vitrine encontrado! Banco de dados está limpo.');
      return;
    }

    // Listar alguns produtos antes de desativar (para confirmação)
    let selectColumns = 'id, name, model, condition, price';
    if (hasConditionDetail) selectColumns += ', condition_detail';
    if (hasVariant) selectColumns += ', variant';
    
    console.log('\n📋 Primeiros 10 produtos que serão desativados:');
    const sampleQuery = `SELECT ${selectColumns} FROM products ${whereClause} ORDER BY id LIMIT 10`;
    const sampleResult = await query(sampleQuery);

    sampleResult.rows.forEach((product, index) => {
      const detail = hasConditionDetail ? product.condition_detail || '' : '';
      const variant = hasVariant ? product.variant || '' : '';
      console.log(`   ${index + 1}. ID ${product.id}: ${product.name} (${product.model || 'sem modelo'}) - ${product.condition} ${detail} ${variant} - R$ ${product.price}`);
    });

    if (totalToDeactivate > 10) {
      console.log(`   ... e mais ${totalToDeactivate - 10} produtos`);
    }

    // Desativar todos os produtos de vitrine/seminovos
    console.log('\n🔄 Desativando produtos de vitrine/seminovos/swap...');
    const deactivateQuery = `
      UPDATE products 
      SET is_active = false,
          updated_at = NOW()
      ${whereClause}
    `;
    const deactivateResult = await query(deactivateQuery);

    console.log(`✅ ${deactivateResult.rowCount} produtos de vitrine/seminovos foram DESATIVADOS`);

    // Estatísticas após limpeza
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM products WHERE is_active = true) as produtos_ativos,
        (SELECT COUNT(*) FROM products WHERE is_active = false) as produtos_inativos,
        (SELECT COUNT(*) FROM products WHERE is_active = true AND condition = 'Novo') as produtos_novos
    `);

    console.log('\n📊 Estatísticas após limpeza:');
    console.log(`   - Produtos ativos: ${stats.rows[0].produtos_ativos}`);
    console.log(`   - Produtos inativos: ${stats.rows[0].produtos_inativos}`);
    console.log(`   - Produtos novos (condition = 'Novo'): ${stats.rows[0].produtos_novos}`);

    console.log('\n✅ Limpeza de produtos de vitrine concluída com sucesso!');
    console.log('ℹ️  Os produtos foram DESATIVADOS (soft delete), não deletados permanentemente.');
    console.log('ℹ️  Eles não aparecerão mais nas buscas, mas podem ser recuperados se necessário.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('cleanup-vitrine-products')) {
  cleanupVitrineProducts()
    .then(() => {
      console.log('✅ Script de limpeza finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export default cleanupVitrineProducts;
