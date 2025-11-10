import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const ensureAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar anotações.' });
  }
  next();
};

// Listar todas as anotações do usuário
router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT *
       FROM notes
       ORDER BY updated_at DESC`
    );

    res.json({ notes: result.rows });
  } catch (error) {
    console.error('Erro ao listar anotações:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar nova anotação
router.post(
  '/',
  authenticateToken,
  ensureAdmin,
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Título é obrigatório (máx. 255)'),
    body('content').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content } = req.body;
      const result = await query(
        `INSERT INTO notes (user_id, title, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [req.user.id, title, content || null]
      );

      res.status(201).json({ note: result.rows[0] });
    } catch (error) {
      console.error('Erro ao criar anotação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// Atualizar anotação
router.put(
  '/:id',
  authenticateToken,
  ensureAdmin,
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('content').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const { title, content } = req.body;

      const fields = [];
      const values = [];
      let paramIndex = 1;

      if (title !== undefined) {
        fields.push(`title = $${paramIndex++}`);
        values.push(title);
      }
      if (content !== undefined) {
        fields.push(`content = $${paramIndex++}`);
        values.push(content);
      }

      if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo informado para atualização' });
      }

      fields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const result = await query(
        `UPDATE notes
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Anotação não encontrada' });
      }

      res.json({ note: result.rows[0] });
    } catch (error) {
      console.error('Erro ao atualizar anotação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// Deletar anotação
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM notes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Anotação não encontrada' });
    }

    res.json({ message: 'Anotação removida com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar anotação:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;






