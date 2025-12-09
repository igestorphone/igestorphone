import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rota para desativar produtos antigos apenas à meia-noite (00h) horário de Brasília
// Deve ser chamada por um cron job ou agendamento
router.post('/cleanup-old-products', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // OBTER HORÁRIO DE BRASÍLIA (America/Sao_Paulo) - CRÍTICO
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
    
    // Verificar se é meia-noite (00h) em Brasília - com tolerância de 5 minutos
    if (horaBrasil !== 0 || minutoBrasil > 5) {
      return res.status(400).json({ 
        message: `Esta operação só pode ser executada à meia-noite (00h) horário de Brasília. Horário atual em Brasília: ${horaBrasil.toString().padStart(2, '0')}:${minutoBrasil.toString().padStart(2, '0')}` 
      });
    }
    
    console.log('🕛 Iniciando limpeza de produtos à meia-noite (horário de Brasília)...');
    console.log(`   Data/hora em Brasília: ${agoraBrasil}`);
    
    // Desativar produtos que não foram atualizados HOJE (no horário de Brasília)
    // Produtos atualizados ANTES de hoje à meia-noite em Brasília serão desativados
    const result = await query(`
      UPDATE products 
      SET is_active = false,
          updated_at = NOW()
      WHERE is_active = true
        AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') < 
            DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
    `);
    
    const deactivatedCount = result.rowCount || 0;
    
    console.log(`✅ ${deactivatedCount} produtos desativados (não atualizados desde ontem)`);
    
    // Estatísticas
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
        COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos
      FROM products
    `);
    
    res.json({
      message: 'Limpeza de produtos concluída',
      deactivated: deactivatedCount,
      statistics: {
        active: parseInt(stats.rows[0].produtos_ativos),
        inactive: parseInt(stats.rows[0].produtos_inativos)
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

export default router;

// NOTA IMPORTANTE:
// Para garantir que os produtos só sejam desativados às 00h horário de Brasília,
// configure um cron job no Render (ou outro serviço) para executar:
// 
// node backend/src/scripts/cleanup-products-midnight-brasil.js
// 
// O cron deve ser configurado para rodar às 03:00 UTC (que é 00:00 em Brasília durante horário padrão)
// OU usar um serviço que suporte timezone do Brasil diretamente

