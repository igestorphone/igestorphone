import express from 'express';
import { body, validationResult } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Helper: decide if a user matches target filter
function buildTargetWhere(target) {
  // target example: { scope: 'all' } or { scope: 'plan', plan_type: 'mensal' } or { scope: 'embaixador' }
  const scope = (target?.scope || 'all').toString();
  if (scope === 'all') return { where: '1=1', values: [] };
  if (scope === 'embaixador') {
    // Embaixador identificado pelo plan_label OU por subscription plan_type
    return {
      where: `(LOWER(COALESCE(u.plan_label,'')) LIKE '%embaixador%' OR LOWER(COALESCE((SELECT plan_type FROM subscriptions s WHERE s.user_id = u.id ORDER BY created_at DESC LIMIT 1),'')) = 'embaixador')`,
      values: [],
    };
  }
  if (scope === 'plan') {
    const planType = (target?.plan_type || '').toString().toLowerCase();
    if (!planType) return { where: '1=1', values: [] };
    return {
      where: `LOWER(COALESCE((SELECT plan_type FROM subscriptions s WHERE s.user_id = u.id ORDER BY created_at DESC LIMIT 1),'')) = $1`,
      values: [planType],
    };
  }
  return { where: '1=1', values: [] };
}

// ADMIN: criar notificação e entregar para usuários alvo
router.post(
  '/',
  authenticateToken,
  requireRole('admin'),
  [
    body('title').trim().isLength({ min: 2, max: 200 }),
    body('message').trim().isLength({ min: 2 }),
    body('link_url').optional().isString().trim(),
    body('target').optional().isObject(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

      const { title, message, link_url } = req.body;
      const target = req.body.target || { scope: 'all' };

      const created = await query(
        `INSERT INTO notifications (title, message, link_url, target, created_by)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         RETURNING id, title, message, link_url, target, created_at`,
        [title, message, link_url || null, JSON.stringify(target), req.user.id]
      );
      const notification = created.rows[0];

      // Deliver to matching users (non-admin only)
      const { where, values } = buildTargetWhere(target);
      const usersResult = await query(
        `SELECT u.id
         FROM users u
         WHERE u.is_active = true
           AND LOWER(COALESCE(u.tipo,'user')) <> 'admin'
           AND (${where})`,
        values
      );

      if (usersResult.rows.length > 0) {
        const userIds = usersResult.rows.map((r) => r.id);
        await query(
          `INSERT INTO user_notifications (user_id, notification_id)
           SELECT UNNEST($1::int[]), $2
           ON CONFLICT (user_id, notification_id) DO NOTHING`,
          [userIds, notification.id]
        );
      }

      res.status(201).json({ notification, delivered_to: usersResult.rows.length });
    } catch (e) {
      console.error('Erro ao criar notificação:', e);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// ADMIN: listar histórico
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await query(
      `SELECT n.*,
              (SELECT COUNT(*) FROM user_notifications un WHERE un.notification_id = n.id) as delivered_count,
              (SELECT COUNT(*) FROM user_notifications un WHERE un.notification_id = n.id AND un.read_at IS NOT NULL) as read_count
       FROM notifications n
       ORDER BY n.created_at DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit) || 50, Number(offset) || 0]
    );
    res.json({ notifications: result.rows });
  } catch (e) {
    console.error('Erro ao listar notificações:', e);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// USER: listar minhas notificações (com flag lida)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT n.id, n.title, n.message, n.link_url, n.created_at,
              un.read_at
       FROM user_notifications un
       JOIN notifications n ON n.id = un.notification_id
       WHERE un.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    const unreadCount = result.rows.filter((r) => !r.read_at).length;
    res.json({ notifications: result.rows, unreadCount });
  } catch (e) {
    console.error('Erro ao buscar minhas notificações:', e);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// USER: marcar como lida
router.post('/my/:id/read', authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: 'ID inválido' });
    await query(
      `UPDATE user_notifications
       SET read_at = COALESCE(read_at, NOW())
       WHERE user_id = $1 AND notification_id = $2`,
      [req.user.id, id]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('Erro ao marcar como lida:', e);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

