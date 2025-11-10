import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Criar nova indicação de fornecedor (público - não requer autenticação)
router.post('/', [
  body('supplier_name').trim().notEmpty().withMessage('Nome do fornecedor é obrigatório'),
  body('contact').optional().trim(),
  body('comment').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supplier_name, contact, comment } = req.body;
    const user_id = req.user?.id || null; // Se não autenticado, pode ser null

    const result = await query(`
      INSERT INTO supplier_suggestions (user_id, supplier_name, contact, comment, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *
    `, [user_id, supplier_name, contact || null, comment || null]);

    res.status(201).json({
      message: 'Indicação enviada com sucesso!',
      suggestion: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar indicação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar indicações (apenas admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin (o middleware auth.js adiciona como 'role')
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    // Buscar indicações com informações do usuário
    const result = await query(`
      SELECT 
        ss.*,
        u.name as user_name,
        u.email as user_email,
        reviewer.name as reviewer_name
      FROM supplier_suggestions ss
      LEFT JOIN users u ON ss.user_id = u.id
      LEFT JOIN users reviewer ON ss.reviewed_by = reviewer.id
      ${whereClause}
      ORDER BY ss.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...values, limit, offset]);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM supplier_suggestions
      ${whereClause}
    `, values);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      suggestions: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar indicações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar status de indicação (apenas admin)
router.patch('/:id', authenticateToken, [
  body('status').isIn(['pending', 'approved', 'rejected']).withMessage('Status inválido')
], async (req, res) => {
  try {
    // Verificar se é admin (o middleware auth.js adiciona como 'role')
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await query(`
      UPDATE supplier_suggestions
      SET status = $1,
          reviewed_by = $2,
          reviewed_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [status, req.user.id, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Indicação não encontrada' });
    }

    res.json({
      message: 'Status atualizado com sucesso',
      suggestion: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar indicação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Contar indicações pendentes (apenas admin)
router.get('/count/pending', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin (o middleware auth.js adiciona como 'role')
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const result = await query(`
      SELECT COUNT(*) as count
      FROM supplier_suggestions
      WHERE status = 'pending'
    `);

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Erro ao contar indicações pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

