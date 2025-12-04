import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Rota para desativar produtos antigos apenas à meia-noite (00h)
// Deve ser chamada por um cron job ou agendamento
router.post('/cleanup-old-products', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Verificar se é meia-noite (00h) - com tolerância de 5 minutos
    if (currentHour !== 0 || currentMinute > 5) {
      return res.status(400).json({ 
        message: `Esta operação só pode ser executada à meia-noite (00h). Horário atual: ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}` 
      });
    }
    
    // Calcular data de ontem (antes da meia-noite de hoje)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0); // Começo do dia de ontem
    
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0); // Começo do dia de hoje (meia-noite)
    
    console.log('🕛 Iniciando limpeza de produtos à meia-noite...');
    console.log(`   Data de referência: ${yesterday.toISOString().split('T')[0]}`);
    
    // Desativar produtos que não foram atualizados desde ontem (antes da meia-noite de hoje)
    // Apenas produtos que foram atualizados ANTES de hoje à meia-noite
    const result = await query(`
      UPDATE products 
      SET is_active = false,
          updated_at = NOW()
      WHERE is_active = true
        AND updated_at < $1
        AND DATE(updated_at) < DATE(NOW())
    `, [todayStart]);
    
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

