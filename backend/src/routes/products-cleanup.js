import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rota para LIMPAR (deletar definitivamente) produtos/listas antigos
// Regra: manter apenas 3 dias (hoje/ontem/anteontem) com base no horário de São Paulo
router.post('/cleanup-old-products', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // OBTER HORÁRIO DE SÃO PAULO (America/Sao_Paulo) - CRÍTICO
    const nowBrasil = await query(`
      SELECT 
        NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
        EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) as hora_brasil,
        EXTRACT(MINUTE FROM (NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) as minuto_brasil
    `);
    
    const horaBrasil = parseInt(nowBrasil.rows[0].hora_brasil);
    const minutoBrasil = parseInt(nowBrasil.rows[0].minuto_brasil);
    const agoraBrasil = nowBrasil.rows[0].agora_brasil;
    
    console.log(`🕐 Horário atual em Brasília: ${horaBrasil.toString().padStart(2, '0')}:${minutoBrasil.toString().padStart(2, '0')}`);
    
    // Verificar se é meia-noite (00h) em SP - com tolerância de 5 minutos
    // OU se for solicitado via query param ?force=true (apenas para emergências)
    const force = req.query.force === 'true';
    
    if (!force && (horaBrasil !== 0 || minutoBrasil > 5)) {
      return res.status(400).json({ 
        message: `Esta operação só pode ser executada à meia-noite (00h) horário de São Paulo. Horário atual em SP: ${horaBrasil.toString().padStart(2, '0')}:${minutoBrasil.toString().padStart(2, '0')}. Use ?force=true para forçar (apenas em emergências).` 
      });
    }
    
    console.log('🕛 Iniciando limpeza de produtos/listas (retenção 3 dias)...');
    console.log(`   Data/hora em SP: ${agoraBrasil}`);
    
    const todaySP = `(NOW() AT TIME ZONE 'America/Sao_Paulo')::date`;
    const cutoffExpr = `${todaySP} - 2`;

    const deletedProducts = await query(`
      DELETE FROM products p
      WHERE GREATEST(
        (p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date,
        (p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
      ) < ${cutoffExpr}
    `);

    const deletedRawLists = await query(`
      DELETE FROM supplier_raw_lists r
      WHERE (r.processed_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date < ${cutoffExpr}
    `);
    
    const deletedCount = deletedProducts.rowCount || 0;
    const deletedListsCount = deletedRawLists.rowCount || 0;
    
    console.log(`✅ ${deletedCount} produtos removidos definitivamente`);
    console.log(`✅ ${deletedListsCount} listas brutas removidas definitivamente`);
    
    // Estatísticas
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
        COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos,
        COUNT(*) as total
      FROM products
    `);
    
    res.json({
      message: 'Limpeza de produtos concluída',
      deleted_products: deletedCount,
      deleted_raw_lists: deletedListsCount,
      statistics: {
        active: parseInt(stats.rows[0].produtos_ativos),
        inactive: parseInt(stats.rows[0].produtos_inativos),
        total: parseInt(stats.rows[0].total)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para restaurar produtos desativados (útil se foram zerados por engano)
router.post('/restore-products', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { hours = 24 } = req.body; // Por padrão, restaurar produtos das últimas 24h
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    console.log(`🔄 Restaurando produtos desativados nas últimas ${hours} horas...`);
    
    // Reativar produtos que foram desativados recentemente
    const result = await query(`
      UPDATE products 
      SET is_active = true,
          updated_at = NOW()
      WHERE is_active = false
        AND updated_at >= $1
    `, [cutoffTime]);
    
    const restoredCount = result.rowCount || 0;
    
    console.log(`✅ ${restoredCount} produtos restaurados`);
    
    res.json({
      message: 'Produtos restaurados com sucesso',
      restored: restoredCount
    });
    
  } catch (error) {
    console.error('❌ Erro ao restaurar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota de EMERGÊNCIA: Restaurar TODOS os produtos de hoje
router.post('/restore-today-emergency', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    console.log('🚨 EMERGÊNCIA: Restaurando TODOS os produtos de hoje...');
    
    // Restaurar produtos criados OU atualizados HOJE no timezone do Brasil
    const result = await query(`
      UPDATE products 
      SET is_active = true,
          updated_at = NOW()
      WHERE is_active = false
        AND (
          DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
            DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
          OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
            DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
        )
    `);
    
    const restoredCount = result.rowCount || 0;
    
    // Estatísticas
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true 
          AND (DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
               DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
            OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
               DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')))) as produtos_ativos_hoje,
        COUNT(*) FILTER (WHERE is_active = false 
          AND (DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
               DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
            OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
               DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')))) as produtos_inativos_hoje
      FROM products
    `);
    
    console.log(`✅ ${restoredCount} produtos de HOJE restaurados`);
    console.log(`📊 Estatísticas: ${stats.rows[0].produtos_ativos_hoje} ativos hoje, ${stats.rows[0].produtos_inativos_hoje} inativos hoje`);
    
    res.json({
      message: 'Produtos de hoje restaurados com sucesso',
      restored: restoredCount,
      statistics: {
        active_today: parseInt(stats.rows[0].produtos_ativos_hoje),
        inactive_today: parseInt(stats.rows[0].produtos_inativos_hoje)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao restaurar produtos de hoje:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

export default router;

// NOTA IMPORTANTE:
// Para garantir que os produtos só sejam desativados às 00h horário de Brasília,
// configure um cron job no Render (ou outro serviço) para executar:
// 
// node backend/src/scripts/cleanup-products-midnight-brasil.js
// 
// O cron deve ser configurado para rodar às 03:00 UTC (que é 00:00 em Brasília durante horário padrão)
// OU usar um serviço que suporte timezone do Brasil diretamente

