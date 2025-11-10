import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Criar novo reporte de bug (público - não requer autenticação)
router.post('/', [
  body('title').trim().notEmpty().withMessage('Título do problema é obrigatório').isLength({ max: 100 }).withMessage('Título deve ter no máximo 100 caracteres'),
  body('severity').isIn(['low', 'medium', 'high', 'critical']).withMessage('Severidade inválida'),
  body('description').trim().notEmpty().withMessage('Descrição do problema é obrigatória').isLength({ max: 500 }).withMessage('Descrição deve ter no máximo 500 caracteres'),
  body('user_name').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, severity, description, user_name } = req.body;
    const user_id = req.user?.id || null; // Se não autenticado, pode ser null

    const result = await query(`
      INSERT INTO bug_reports (user_id, user_name, title, severity, description, status)
      VALUES ($1, $2, $3, $4, $5, 'pending')
      RETURNING *
    `, [user_id, user_name || null, title, severity, description]);

    res.status(201).json({
      message: 'Bug reportado com sucesso!',
      bug_report: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao criar reporte de bug:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Listar bugs reportados (apenas admin)
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🐛 GET /api/bug-reports - User:', req.user);
    console.log('🐛 GET /api/bug-reports - User role:', req.user?.role);
    
    // Verificar se é admin (o middleware auth.js adiciona como 'role')
    const userRole = req.user?.role;
    if (userRole !== 'admin') {
      console.log('❌ GET /api/bug-reports - Acesso negado. Role do usuário:', userRole);
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem visualizar bugs reportados.' });
    }

    const { status, severity, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (status) {
      whereClause += ` AND status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    if (severity) {
      whereClause += ` AND severity = $${paramCount}`;
      values.push(severity);
      paramCount++;
    }

    // Buscar bugs com informações do usuário
    const result = await query(`
      SELECT 
        br.*,
        u.email as user_email,
        resolver.name as resolver_name
      FROM bug_reports br
      LEFT JOIN users u ON br.user_id = u.id
      LEFT JOIN users resolver ON br.resolved_by = resolver.id
      ${whereClause}
      ORDER BY br.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...values, limit, offset]);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM bug_reports
      ${whereClause}
    `, values);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      bug_reports: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Erro ao listar bugs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar status de bug (apenas admin)
router.patch('/:id', authenticateToken, [
  body('status').isIn(['pending', 'in_progress', 'resolved', 'rejected']).withMessage('Status inválido')
], async (req, res) => {
  try {
    // Verificar se é admin (o middleware auth.js adiciona como 'role')
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem atualizar bugs.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Se for rejeitado, excluir do banco de dados
    if (status === 'rejected') {
      const deleteResult = await query(`
        DELETE FROM bug_reports
        WHERE id = $1
        RETURNING *
      `, [id]);

      if (deleteResult.rows.length === 0) {
        return res.status(404).json({ message: 'Bug não encontrado' });
      }

      return res.json({
        message: 'Bug rejeitado e removido do sistema',
        bug_report: deleteResult.rows[0]
      });
    }

    // Se for resolvido, marcar como finalizado
    if (status === 'resolved') {
      const result = await query(`
        UPDATE bug_reports
        SET status = $1,
            resolved_by = $2,
            resolved_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `, [status, req.user.id, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Bug não encontrado' });
      }

      return res.json({
        message: 'Bug marcado como resolvido',
        bug_report: result.rows[0]
      });
    }

    // Para outros status (in_progress, pending), apenas atualizar
    // Se for in_progress, atualizar resolved_by também
    if (status === 'in_progress') {
      const result = await query(`
        UPDATE bug_reports
        SET status = $1,
            resolved_by = $2
        WHERE id = $3
        RETURNING *
      `, [status, req.user.id, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Bug não encontrado' });
      }

      return res.json({
        message: 'Status atualizado com sucesso',
        bug_report: result.rows[0]
      });
    }

    // Para pending, apenas atualizar status
    const result = await query(`
      UPDATE bug_reports
      SET status = $1
      WHERE id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bug não encontrado' });
    }

    res.json({
      message: 'Status atualizado com sucesso',
      bug_report: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao atualizar bug:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Contar bugs pendentes (apenas admin)
router.get('/count/pending', authenticateToken, async (req, res) => {
  try {
    // Verificar se é admin (o middleware auth.js adiciona como 'role')
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Acesso negado' });
    }

    const result = await query(`
      SELECT COUNT(*) as count
      FROM bug_reports
      WHERE status = 'pending'
    `);

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Erro ao contar bugs pendentes:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

