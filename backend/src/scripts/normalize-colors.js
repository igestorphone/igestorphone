import dotenv from 'dotenv';
dotenv.config();

import pkg from 'pg';
const { Pool } = pkg;

// Importar função de normalização
import { normalizeColor } from '../utils/colorNormalizer.js';

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

async function normalizeAllColors() {
  try {
    console.log('🔄 Normalizando cores de todos os produtos...\n');
    
    // Buscar todos os produtos com cor
    const productsResult = await query(`
      SELECT id, color, model, name
      FROM products
      WHERE color IS NOT NULL AND color != ''
      ORDER BY id
    `);
    
    const products = productsResult.rows;
    console.log(`📦 Encontrados ${products.length} produtos com cores para normalizar\n`);
    
    if (products.length === 0) {
      console.log('✅ Nenhum produto para normalizar!');
      await pool.end();
      process.exit(0);
    }
    
    let updated = 0;
    let unchanged = 0;
    let errors = 0;
    
    // Normalizar cada produto
    for (const product of products) {
      try {
        const originalColor = product.color;
        const normalizedColor = normalizeColor(originalColor, product.model);
        
        // Se a cor foi normalizada (mudou), atualizar no banco
        if (normalizedColor && normalizedColor !== originalColor) {
          await query(`
            UPDATE products
            SET color = $1, updated_at = NOW()
            WHERE id = $2
          `, [normalizedColor, product.id]);
          
          updated++;
          
          // Log a cada 100 produtos
          if (updated % 100 === 0) {
            console.log(`⏳ Processados ${updated} produtos...`);
          }
        } else {
          unchanged++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar produto ID ${product.id}:`, error.message);
        errors++;
      }
    }
    
    console.log('\n✅ Normalização concluída!');
    console.log(`📊 Estatísticas:`);
    console.log(`   - Produtos atualizados: ${updated}`);
    console.log(`   - Produtos sem alteração: ${unchanged}`);
    console.log(`   - Erros: ${errors}`);
    console.log(`   - Total processado: ${products.length}`);
    
  } catch (error) {
    console.error('❌ Erro na normalização:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

normalizeAllColors();
