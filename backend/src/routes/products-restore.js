import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Restaurar produtos que foram desativados recentemente (útil se foram zerados por engano)
router.post('/restore', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { hours = 3 } = req.body; // Por padrão, restaurar produtos das últimas 3 horas
    
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);
    
    console.log(`🔄 Restaurando produtos desativados nas últimas ${hours} horas...`);
    console.log(`   Cutoff time: ${cutoffTime.toISOString()}`);
    
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
    
    // Estatísticas
    const stats = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
        COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos
      FROM products
    `);
    
    res.json({
      message: 'Produtos restaurados com sucesso',
      restored: restoredCount,
      statistics: {
        active: parseInt(stats.rows[0].produtos_ativos),
        inactive: parseInt(stats.rows[0].produtos_inativos)
      }
    });
    
  } catch (error) {
    console.error('❌ Erro ao restaurar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

