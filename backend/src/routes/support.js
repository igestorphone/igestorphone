import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Listar apenas os tickets do usuário logado
router.get('/tickets', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query(`
      SELECT id, subject, message, status, priority, created_at, updated_at
      FROM support_tickets
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      success: true,
      tickets: result.rows.map((row) => ({
        id: String(row.id),
        subject: row.subject,
        message: row.message,
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null
      }))
    });
  } catch (error) {
    console.error('Erro ao listar tickets de suporte:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo ticket (do usuário logado)
router.post('/tickets', authenticateToken, [
  body('subject').trim().notEmpty().withMessage('Assunto é obrigatório').isLength({ max: 255 }),
  body('message').trim().notEmpty().withMessage('Mensagem é obrigatória'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Prioridade inválida')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { subject, message, priority = 'medium' } = req.body;

    const result = await query(`
      INSERT INTO support_tickets (user_id, subject, message, status, priority)
      VALUES ($1, $2, $3, 'pending', $4)
      RETURNING id, subject, message, status, priority, created_at
    `, [userId, subject, message, priority]);

    const row = result.rows[0];
    res.status(201).json({
      success: true,
      message: 'Ticket enviado com sucesso!',
      ticket: {
        id: String(row.id),
        subject: row.subject,
        message: row.message,
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : null
      }
    });
  } catch (error) {
    console.error('Erro ao criar ticket de suporte:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
