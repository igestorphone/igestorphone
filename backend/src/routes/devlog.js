import express from 'express'
import { body, validationResult } from 'express-validator'
import { query } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

const ensureAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem acessar o Dev Log.' })
  }
  next()
}

router.use(authenticateToken, ensureAdmin)

const handleValidation = (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return false
  }
  return true
}

/* ===================== BACKLOG (tasks) ===================== */

router.get('/tasks', async (_req, res) => {
  try {
    const result = await query(
      `SELECT * FROM dev_tasks
       ORDER BY
         CASE status WHEN 'todo' THEN 1 WHEN 'doing' THEN 2 WHEN 'done' THEN 3 ELSE 4 END,
         CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END,
         created_at DESC`
    )
    res.json({ tasks: result.rows })
  } catch (error) {
    console.error('Erro ao listar tarefas do dev log:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

router.post(
  '/tasks',
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Título é obrigatório (máx. 255)'),
    body('description').optional({ nullable: true }).trim(),
    body('status').optional().isIn(['todo', 'doing', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('target_version').optional({ nullable: true }).trim().isLength({ max: 50 })
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return
    try {
      const { title, description, status = 'todo', priority = 'medium', target_version } = req.body
      const completedAt = status === 'done' ? new Date() : null
      const result = await query(
        `INSERT INTO dev_tasks (user_id, title, description, status, priority, target_version, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.user.id, title, description || null, status, priority, target_version || null, completedAt]
      )
      res.status(201).json({ task: result.rows[0] })
    } catch (error) {
      console.error('Erro ao criar tarefa do dev log:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

router.put(
  '/tasks/:id',
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional({ nullable: true }).trim(),
    body('status').optional().isIn(['todo', 'doing', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('target_version').optional({ nullable: true }).trim().isLength({ max: 50 })
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return
    try {
      const { id } = req.params
      const { title, description, status, priority, target_version } = req.body
      const fields = []
      const values = []
      let i = 1
      if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title) }
      if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description || null) }
      if (priority !== undefined) { fields.push(`priority = $${i++}`); values.push(priority) }
      if (target_version !== undefined) { fields.push(`target_version = $${i++}`); values.push(target_version || null) }
      if (status !== undefined) {
        fields.push(`status = $${i++}`); values.push(status)
        fields.push(status === 'done' ? `completed_at = CURRENT_TIMESTAMP` : `completed_at = NULL`)
      }
      if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo informado para atualização' })
      }
      fields.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      const result = await query(
        `UPDATE dev_tasks SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      )
      if (result.rows.length === 0) return res.status(404).json({ message: 'Tarefa não encontrada' })
      res.json({ task: result.rows[0] })
    } catch (error) {
      console.error('Erro ao atualizar tarefa do dev log:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

router.delete('/tasks/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM dev_tasks WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Tarefa não encontrada' })
    res.json({ message: 'Tarefa removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar tarefa do dev log:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

/* ===================== VERSÕES (releases) ===================== */

router.get('/releases', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM dev_releases ORDER BY released_at DESC, id DESC')
    res.json({ releases: result.rows })
  } catch (error) {
    console.error('Erro ao listar releases do dev log:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

router.post(
  '/releases',
  [
    body('version').trim().isLength({ min: 1, max: 50 }).withMessage('Versão é obrigatória (máx. 50)'),
    body('title').optional({ nullable: true }).trim().isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim(),
    body('released_at').optional({ nullable: true }).isISO8601().withMessage('Data inválida'),
    body('is_public').optional().isBoolean()
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return
    try {
      const { version, title, description, released_at, is_public } = req.body
      const result = await query(
        `INSERT INTO dev_releases (user_id, version, title, description, released_at, is_public)
         VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE), $6)
         RETURNING *`,
        [req.user.id, version, title || null, description || null, released_at || null, is_public === true]
      )
      res.status(201).json({ release: result.rows[0] })
    } catch (error) {
      console.error('Erro ao criar release do dev log:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

router.put(
  '/releases/:id',
  [
    body('version').optional().trim().isLength({ min: 1, max: 50 }),
    body('title').optional({ nullable: true }).trim().isLength({ max: 255 }),
    body('description').optional({ nullable: true }).trim(),
    body('released_at').optional({ nullable: true }).isISO8601(),
    body('is_public').optional().isBoolean()
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return
    try {
      const { id } = req.params
      const { version, title, description, released_at, is_public } = req.body
      const fields = []
      const values = []
      let i = 1
      if (version !== undefined) { fields.push(`version = $${i++}`); values.push(version) }
      if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title || null) }
      if (description !== undefined) { fields.push(`description = $${i++}`); values.push(description || null) }
      if (released_at !== undefined) { fields.push(`released_at = $${i++}::date`); values.push(released_at) }
      if (is_public !== undefined) { fields.push(`is_public = $${i++}`); values.push(is_public === true) }
      if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo informado para atualização' })
      }
      values.push(id)
      const result = await query(
        `UPDATE dev_releases SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      )
      if (result.rows.length === 0) return res.status(404).json({ message: 'Versão não encontrada' })
      res.json({ release: result.rows[0] })
    } catch (error) {
      console.error('Erro ao atualizar release do dev log:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

router.delete('/releases/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM dev_releases WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Versão não encontrada' })
    res.json({ message: 'Versão removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar release do dev log:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

/* ===================== ANOTAÇÕES (notes) ===================== */

router.get('/notes', async (_req, res) => {
  try {
    const result = await query('SELECT * FROM dev_notes ORDER BY updated_at DESC, id DESC')
    res.json({ notes: result.rows })
  } catch (error) {
    console.error('Erro ao listar anotações do dev log:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

router.post(
  '/notes',
  [
    body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Título é obrigatório (máx. 255)'),
    body('content').optional({ nullable: true }).trim()
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return
    try {
      const { title, content } = req.body
      const result = await query(
        `INSERT INTO dev_notes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *`,
        [req.user.id, title, content || null]
      )
      res.status(201).json({ note: result.rows[0] })
    } catch (error) {
      console.error('Erro ao criar anotação do dev log:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

router.put(
  '/notes/:id',
  [
    body('title').optional().trim().isLength({ min: 1, max: 255 }),
    body('content').optional({ nullable: true }).trim()
  ],
  async (req, res) => {
    if (!handleValidation(req, res)) return
    try {
      const { id } = req.params
      const { title, content } = req.body
      const fields = []
      const values = []
      let i = 1
      if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title) }
      if (content !== undefined) { fields.push(`content = $${i++}`); values.push(content || null) }
      if (fields.length === 0) {
        return res.status(400).json({ message: 'Nenhum campo informado para atualização' })
      }
      fields.push('updated_at = CURRENT_TIMESTAMP')
      values.push(id)
      const result = await query(
        `UPDATE dev_notes SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      )
      if (result.rows.length === 0) return res.status(404).json({ message: 'Anotação não encontrada' })
      res.json({ note: result.rows[0] })
    } catch (error) {
      console.error('Erro ao atualizar anotação do dev log:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

router.delete('/notes/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM dev_notes WHERE id = $1 RETURNING id', [req.params.id])
    if (result.rows.length === 0) return res.status(404).json({ message: 'Anotação não encontrada' })
    res.json({ message: 'Anotação removida com sucesso' })
  } catch (error) {
    console.error('Erro ao deletar anotação do dev log:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

export default router
