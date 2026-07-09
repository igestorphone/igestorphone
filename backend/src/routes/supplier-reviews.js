import express from 'express'
import { body, validationResult, query as queryValidator } from 'express-validator'
import { query } from '../config/database.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

async function recalculateSupplierRating(supplierId) {
  const stats = await query(
    `SELECT
       COALESCE(AVG(rating)::numeric(3,2), 0) AS rating_avg,
       COUNT(*)::int AS rating_count
     FROM supplier_reviews
     WHERE supplier_id = $1 AND status = 'submitted' AND rating IS NOT NULL`,
    [supplierId]
  )
  const avg = Number(stats.rows[0]?.rating_avg || 0)
  const count = Number(stats.rows[0]?.rating_count || 0)
  await query(
    `UPDATE suppliers
     SET rating_avg = $1, rating_count = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [avg, count, supplierId]
  )
  return { rating_avg: avg, rating_count: count }
}

/** Após clique no WhatsApp: cria/reativa pendente (não sobrescreve submitted). */
router.post(
  '/contact',
  [body('supplier_id').isInt({ min: 1 }).withMessage('supplier_id inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      const supplierId = Number(req.body.supplier_id)
      const userId = req.user.id

      const supplier = await query('SELECT id FROM suppliers WHERE id = $1 AND is_active = true', [supplierId])
      if (supplier.rows.length === 0) {
        return res.status(404).json({ message: 'Fornecedor não encontrado' })
      }

      const existing = await query(
        `SELECT * FROM supplier_reviews WHERE supplier_id = $1 AND user_id = $2`,
        [supplierId, userId]
      )

      if (existing.rows.length > 0) {
        const row = existing.rows[0]
        if (row.status === 'submitted') {
          return res.json({ review: row, created: false, skipped: true })
        }
        const updated = await query(
          `UPDATE supplier_reviews
           SET status = 'pending',
               contacted_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP,
               rating = NULL,
               comment = NULL,
               submitted_at = NULL
           WHERE id = $1
           RETURNING *`,
          [row.id]
        )
        return res.json({ review: updated.rows[0], created: false })
      }

      const inserted = await query(
        `INSERT INTO supplier_reviews (supplier_id, user_id, status, contacted_at)
         VALUES ($1, $2, 'pending', CURRENT_TIMESTAMP)
         RETURNING *`,
        [supplierId, userId]
      )
      return res.status(201).json({ review: inserted.rows[0], created: true })
    } catch (error) {
      console.error('Erro ao registrar contato para avaliação:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

/**
 * Pendentes = fornecedores ativos que o usuário ainda NÃO avaliou e NÃO dispensou.
 * (Igual concorrente: lista quem falta avaliar, não só após WhatsApp.)
 */
router.get('/pending', async (req, res) => {
  try {
    const result = await query(
      `SELECT
         s.id AS supplier_id,
         s.name AS supplier_name,
         s.photo_url AS supplier_photo_url,
         s.store_address AS supplier_store_address,
         s.rating_avg AS supplier_rating_avg,
         s.rating_count AS supplier_rating_count,
         r.id,
         r.status,
         r.contacted_at,
         r.created_at
       FROM suppliers s
       LEFT JOIN supplier_reviews r
         ON r.supplier_id = s.id AND r.user_id = $1
       WHERE s.is_active = true
         AND (r.id IS NULL OR r.status = 'pending')
       ORDER BY
         CASE WHEN r.contacted_at IS NOT NULL THEN 0 ELSE 1 END,
         r.contacted_at DESC NULLS LAST,
         s.name ASC`,
      [req.user.id]
    )
    res.json({ reviews: result.rows })
  } catch (error) {
    console.error('Erro ao listar avaliações pendentes:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

/** Avaliações já enviadas pelo usuário */
router.get('/mine', async (req, res) => {
  try {
    const result = await query(
      `SELECT r.*,
              s.name AS supplier_name,
              s.photo_url AS supplier_photo_url,
              s.store_address AS supplier_store_address
       FROM supplier_reviews r
       JOIN suppliers s ON s.id = r.supplier_id
       WHERE r.user_id = $1 AND r.status = 'submitted'
       ORDER BY r.submitted_at DESC NULLS LAST, r.id DESC`,
      [req.user.id]
    )
    res.json({ reviews: result.rows })
  } catch (error) {
    console.error('Erro ao listar minhas avaliações:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

/** Top fornecedores avaliados */
router.get(
  '/top',
  [queryValidator('limit').optional().isInt({ min: 1, max: 100 })],
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit || '12', 10) || 12, 100)
      const result = await query(
        `SELECT id, name, photo_url, store_address, city, rating_avg, rating_count, whatsapp
         FROM suppliers
         WHERE is_active = true AND rating_count > 0
         ORDER BY rating_avg DESC, rating_count DESC, name ASC
         LIMIT $1`,
        [limit]
      )
      res.json({ suppliers: result.rows })
    } catch (error) {
      console.error('Erro ao listar top avaliados:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

/** Busca/listagem de fornecedores com nota + foto */
router.get(
  '/',
  [
    queryValidator('search').optional().trim(),
    queryValidator('limit').optional().isInt({ min: 1, max: 200 }),
    queryValidator('rated_only').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const search = (req.query.search || '').trim()
      const limit = Math.min(parseInt(req.query.limit || '50', 10) || 50, 200)
      const ratedOnly = req.query.rated_only === 'true' || req.query.rated_only === true

      const values = []
      let where = 'WHERE s.is_active = true'
      if (ratedOnly) where += ' AND s.rating_count > 0'
      if (search) {
        values.push(`%${search}%`)
        where += ` AND (s.name ILIKE $${values.length} OR COALESCE(s.store_address, '') ILIKE $${values.length} OR COALESCE(s.city, '') ILIKE $${values.length})`
      }
      values.push(limit)

      const result = await query(
        `SELECT s.id, s.name, s.photo_url, s.store_address, s.city, s.rating_avg, s.rating_count, s.whatsapp
         FROM suppliers s
         ${where}
         ORDER BY
           CASE WHEN s.rating_count > 0 THEN 0 ELSE 1 END,
           s.rating_avg DESC,
           s.rating_count DESC,
           s.name ASC
         LIMIT $${values.length}`,
        values
      )
      res.json({ suppliers: result.rows })
    } catch (error) {
      console.error('Erro ao buscar fornecedores para avaliações:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

/** Enviar avaliação por supplier_id (cria o registro se ainda não existir). */
router.post(
  '/submit',
  [
    body('supplier_id').isInt({ min: 1 }).withMessage('supplier_id inválido'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Nota deve ser de 1 a 5'),
    body('comment').optional({ nullable: true }).trim().isLength({ max: 1000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      const supplierId = Number(req.body.supplier_id)
      const userId = req.user.id
      const rating = Number(req.body.rating)
      const comment = req.body.comment?.trim() || null

      const supplier = await query('SELECT id FROM suppliers WHERE id = $1 AND is_active = true', [supplierId])
      if (supplier.rows.length === 0) {
        return res.status(404).json({ message: 'Fornecedor não encontrado' })
      }

      const existing = await query(
        `SELECT * FROM supplier_reviews WHERE supplier_id = $1 AND user_id = $2`,
        [supplierId, userId]
      )

      let review
      if (existing.rows.length > 0) {
        if (existing.rows[0].status === 'dismissed') {
          return res.status(400).json({ message: 'Esta avaliação foi dispensada' })
        }
        const updated = await query(
          `UPDATE supplier_reviews
           SET rating = $1,
               comment = $2,
               status = 'submitted',
               submitted_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $3
           RETURNING *`,
          [rating, comment, existing.rows[0].id]
        )
        review = updated.rows[0]
      } else {
        const inserted = await query(
          `INSERT INTO supplier_reviews (supplier_id, user_id, rating, comment, status, submitted_at, contacted_at)
           VALUES ($1, $2, $3, $4, 'submitted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           RETURNING *`,
          [supplierId, userId, rating, comment]
        )
        review = inserted.rows[0]
      }

      const stats = await recalculateSupplierRating(supplierId)
      res.json({ review, supplier_stats: stats })
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

/** Dispensar por supplier_id */
router.post(
  '/dismiss',
  [body('supplier_id').isInt({ min: 1 }).withMessage('supplier_id inválido')],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      const supplierId = Number(req.body.supplier_id)
      const userId = req.user.id

      const supplier = await query('SELECT id FROM suppliers WHERE id = $1 AND is_active = true', [supplierId])
      if (supplier.rows.length === 0) {
        return res.status(404).json({ message: 'Fornecedor não encontrado' })
      }

      const existing = await query(
        `SELECT * FROM supplier_reviews WHERE supplier_id = $1 AND user_id = $2`,
        [supplierId, userId]
      )

      if (existing.rows.length > 0) {
        if (existing.rows[0].status === 'submitted') {
          return res.status(400).json({ message: 'Avaliação já enviada não pode ser dispensada' })
        }
        const updated = await query(
          `UPDATE supplier_reviews
           SET status = 'dismissed',
               updated_at = CURRENT_TIMESTAMP,
               rating = NULL,
               comment = NULL,
               submitted_at = NULL
           WHERE id = $1
           RETURNING *`,
          [existing.rows[0].id]
        )
        return res.json({ review: updated.rows[0] })
      }

      const inserted = await query(
        `INSERT INTO supplier_reviews (supplier_id, user_id, status, contacted_at)
         VALUES ($1, $2, 'dismissed', CURRENT_TIMESTAMP)
         RETURNING *`,
        [supplierId, userId]
      )
      res.json({ review: inserted.rows[0] })
    } catch (error) {
      console.error('Erro ao dispensar avaliação:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

/** Compat: submit/dismiss por id da review (legado) */
router.post(
  '/:id/submit',
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Nota deve ser de 1 a 5'),
    body('comment').optional({ nullable: true }).trim().isLength({ max: 1000 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() })

      const reviewId = Number(req.params.id)
      const existing = await query(
        `SELECT * FROM supplier_reviews WHERE id = $1 AND user_id = $2`,
        [reviewId, req.user.id]
      )
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: 'Avaliação não encontrada' })
      }

      req.body.supplier_id = existing.rows[0].supplier_id
      // Reusa lógica via redirect interno: atualiza direto
      if (existing.rows[0].status === 'dismissed') {
        return res.status(400).json({ message: 'Esta avaliação foi dispensada' })
      }

      const updated = await query(
        `UPDATE supplier_reviews
         SET rating = $1,
             comment = $2,
             status = 'submitted',
             submitted_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [Number(req.body.rating), req.body.comment?.trim() || null, reviewId]
      )
      const stats = await recalculateSupplierRating(updated.rows[0].supplier_id)
      res.json({ review: updated.rows[0], supplier_stats: stats })
    } catch (error) {
      console.error('Erro ao enviar avaliação:', error)
      res.status(500).json({ message: 'Erro interno do servidor' })
    }
  }
)

router.post('/:id/dismiss', async (req, res) => {
  try {
    const reviewId = Number(req.params.id)
    const existing = await query(
      `SELECT * FROM supplier_reviews WHERE id = $1 AND user_id = $2`,
      [reviewId, req.user.id]
    )
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Avaliação não encontrada' })
    }
    if (existing.rows[0].status === 'submitted') {
      return res.status(400).json({ message: 'Avaliação já enviada não pode ser dispensada' })
    }

    const updated = await query(
      `UPDATE supplier_reviews
       SET status = 'dismissed',
           updated_at = CURRENT_TIMESTAMP,
           rating = NULL,
           comment = NULL,
           submitted_at = NULL
       WHERE id = $1
       RETURNING *`,
      [reviewId]
    )
    res.json({ review: updated.rows[0] })
  } catch (error) {
    console.error('Erro ao dispensar avaliação:', error)
    res.status(500).json({ message: 'Erro interno do servidor' })
  }
})

export default router
