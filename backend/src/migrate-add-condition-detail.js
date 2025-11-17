import dotenv from 'dotenv';
import { query } from './config/database.js';

dotenv.config();

async function addConditionDetailColumn() {
  try {
    console.log('🔄 Adicionando coluna condition_detail à tabela products...');
    
    // Verificar se a coluna já existe
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
        AND column_name = 'condition_detail'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Coluna condition_detail já existe!');
      process.exit(0);
    }
    
    // Adicionar coluna
    await query(`
      ALTER TABLE products
      ADD COLUMN condition_detail VARCHAR(50);
    `);
    console.log('✅ Coluna condition_detail adicionada com sucesso!');

    // Criar índice
    console.log('🔄 Criando índice para condition_detail...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_condition_detail
      ON products(condition_detail);
    `);
    console.log('✅ Índice criado com sucesso!');
    
    console.log('✅ Migração concluída com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

addConditionDetailColumn();

