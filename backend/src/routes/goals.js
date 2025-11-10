import express from 'express'
import { body, validationResult } from 'express-validator'
import { query } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

const ensureAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem gerenciar metas.' })
  }
  next()
}

// Listar metas
router.get('/', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await query(
      `SELECT *
       FROM goals
       ORDER BY
         CASE status
           WHEN 'pending' THEN 1
           WHEN 'in_progress' THEN 2
           WHEN 'abandoned' THEN 3
           WHEN 'completed' THEN 4
         END,
         created_at DESC`
    )

    res.json({ goals: result.rows })
  } catch (error) {
    console.error('Erro ao listar metas:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

// Criar meta
router.post(
  '/',
  authenticateToken,
  ensureAdmin,
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Título é obrigatório (máx. 255)'),
    body('description').optional().trim(),
    body('status').optional().isIn(['pending', 'in_progress', 'abandoned', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { title, description, status = 'pending', priority = 'medium' } = req.body
      const result = await query(
        `INSERT INTO goals (user_id, title, description, status, priority)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [req.user.id, title, description || null, status, priority]
      )

      res.status(201).json({ goal: result.rows[0] })
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

// Atualizar meta
router.put(
  '/:id',
  authenticateToken,
  ensureAdmin,
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim(),
    body('status').optional().isIn(['pending', 'in_progress', 'abandoned', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high'])
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const { id } = req.params
      const { title, description, status, priority } = req.body

      const fields = []
      const values = []
      let paramIndex = 1

      if (title !== undefined) {
        fields.push(`title = $${paramIndex++}`)
        values.push(title)
      }
      if (description !== undefined) {
        fields.push(`description = $${paramIndex++}`)
        values.push(description)
      }
      if (status !== undefined) {
        fields.push(`status = $${paramIndex++}`)
        values.push(status)
        if (status === 'completed') {
          fields.push(`completed_at = CURRENT_TIMESTAMP`)
        } else {
          fields.push(`completed_at = NULL`)
        }
      }
      if (priority !== undefined) {
        fields.push(`priority = $${paramIndex++}`)
        values.push(priority)
      }

      if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo informado para atualização' })
      }

      fields.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)

      const result = await query(
        `UPDATE goals
         SET ${fields.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Meta não encontrada' })
      }

      res.json({ goal: result.rows[0] })
    } catch (error) {
      console.error('Erro ao atualizar meta:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

// Excluir meta
router.delete('/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const result = await query('DELETE FROM goals WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Meta não encontrada' })
    }

    res.json({ message: 'Meta removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar meta:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

export default router






