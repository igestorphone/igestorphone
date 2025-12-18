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

/**
 * Script para desativar produtos antigos EXATAMENTE à meia-noite (00h) horário de Brasília
 * Este script DEVE ser executado por um cron job configurado para rodar às 00h no horário de Brasília
 * 
 * Para configurar no Render/Heroku/outro serviço:
 * - Use um cron job que rode às 00:00 UTC-3 (horário de Brasília)
 * - OU configure para rodar às 03:00 UTC (que é 00:00 em Brasília durante horário padrão)
 * - OU use um serviço de agendamento que suporte timezone do Brasil
 */
async function cleanupProductsAtMidnightBrasil() {
  try {
    // OBTER HORÁRIO ATUAL DE BRASÍLIA - CRÍTICO
    const timeCheck = await query(`
      SELECT 
        NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
        EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))::int as hora_brasil,
        EXTRACT(MINUTE FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))::int as minuto_brasil,
        DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) as data_brasil
    `);
    
    const horaBrasil = timeCheck.rows[0].hora_brasil;
    const minutoBrasil = timeCheck.rows[0].minuto_brasil;
    const agoraBrasil = timeCheck.rows[0].agora_brasil;
    const dataBrasil = timeCheck.rows[0].data_brasil;
    
    console.log('🕐 VERIFICAÇÃO DE HORÁRIO DE BRASÍLIA:');
    console.log(`   Data/Hora atual em Brasília: ${agoraBrasil}`);
    console.log(`   Hora: ${horaBrasil.toString().padStart(2, '0')}:${minutoBrasil.toString().padStart(2, '0')}`);
    console.log(`   Data: ${dataBrasil}\n`);
    
    // VERIFICAR SE É EXATAMENTE MEIA-NOITE EM BRASÍLIA (com tolerância de 10 minutos)
    // Permite execução entre 00:00 e 00:10
    if (horaBrasil !== 0 || minutoBrasil > 10) {
      console.log(`❌ ATENÇÃO: Este script só deve ser executado à meia-noite (00h) horário de Brasília.`);
      console.log(`   Horário atual em Brasília: ${horaBrasil.toString().padStart(2, '0')}:${minutoBrasil.toString().padStart(2, '0')}`);
      console.log(`   O script não foi executado. Configure o cron job para rodar às 00:00 horário de Brasília.\n`);
      
      // Se for modo forçado (--force), continuar mesmo assim
      if (process.argv.includes('--force')) {
        console.log('⚠️  Modo FORÇADO ativado - executando mesmo fora do horário de meia-noite...\n');
      } else {
        await pool.end();
        process.exit(0); // Sair sem erro se não for meia-noite
      }
    }
    
    console.log('🕛 Iniciando limpeza de produtos à meia-noite (horário de Brasília)...\n');
    
    // Contar produtos que serão desativados (produtos atualizados ANTES de hoje)
    // Usar CURRENT_DATE para simplificar (sem conversão complexa de timezone)
    const countQuery = await query(`
      SELECT COUNT(*) as total
      FROM products
      WHERE is_active = true
        AND DATE(updated_at) < CURRENT_DATE
        AND DATE(created_at) < CURRENT_DATE
    `);
    
    const totalToDeactivate = parseInt(countQuery.rows[0].total);
    console.log(`📊 Produtos que serão desativados: ${totalToDeactivate}`);
    console.log(`   (Produtos atualizados antes de hoje, ${dataBrasil})\n`);
    
    if (totalToDeactivate === 0) {
      console.log('✅ Nenhum produto para desativar!');
      await pool.end();
      process.exit(0);
    }
    
    // Desativar produtos que não foram atualizados HOJE
    // Produtos atualizados ANTES de hoje serão desativados
    console.log('🔄 Desativando produtos antigos...');
    const result = await query(`
      UPDATE products 
      SET is_active = false,
          updated_at = NOW()
      WHERE is_active = true
        AND DATE(updated_at) < CURRENT_DATE
        AND DATE(created_at) < CURRENT_DATE
    `);
    
    const deactivatedCount = result.rowCount || 0;
    console.log(`✅ ${deactivatedCount} produtos DESATIVADOS com sucesso!\n`);
    
    // Estatísticas finais
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
        COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos,
        COUNT(*) FILTER (
          WHERE is_active = true 
          AND (DATE(updated_at) = CURRENT_DATE OR DATE(created_at) = CURRENT_DATE)
        ) as produtos_ativos_hoje
      FROM products
    `);
    
    console.log('📊 Estatísticas finais:');
    console.log(`   - Produtos ativos: ${stats.rows[0].produtos_ativos}`);
    console.log(`   - Produtos ativos de HOJE (${dataBrasil}): ${stats.rows[0].produtos_ativos_hoje}`);
    console.log(`   - Produtos inativos: ${stats.rows[0].produtos_inativos}`);
    console.log(`\n✅ Limpeza concluída com sucesso à meia-noite de Brasília!`);
    
  } catch (error) {
    console.error('❌ Erro ao executar limpeza:', error);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

// Executar script
cleanupProductsAtMidnightBrasil();

