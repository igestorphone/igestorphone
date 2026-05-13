import crypto from 'crypto';
import { query } from '../config/database.js';

/** Máximo de JWTs/sessões ativas por usuário (novo login revoga as mais antigas). */
export function getMaxConcurrentSessions() {
  const n = parseInt(process.env.MAX_CONCURRENT_SESSIONS_PER_USER || '2', 10);
  if (Number.isNaN(n)) return 2;
  return Math.max(1, Math.min(20, n));
}

/**
 * Cria sessão e revoga as excedentes (mantém as `getMaxConcurrentSessions()` mais recentes).
 * @returns {string} UUID da sessão (claim `sid` no JWT)
 */
export async function createSessionForUser(userId) {
  const sessionId = crypto.randomUUID();
  const max = getMaxConcurrentSessions();

  await query(`INSERT INTO user_sessions (id, user_id) VALUES ($1::uuid, $2)`, [sessionId, userId]);

  await query(
    `WITH ranked AS (
       SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) AS rn
       FROM user_sessions
       WHERE user_id = $1 AND revoked_at IS NULL
     )
     UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP
     WHERE id IN (SELECT id FROM ranked WHERE rn > $2)`,
    [userId, max]
  );

  return sessionId;
}

export async function isSessionActive(sessionId, userId) {
  if (!sessionId || !userId) return false;
  const r = await query(
    `SELECT id FROM user_sessions
     WHERE id = $1::uuid AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId]
  );
  return r.rows.length > 0;
}

export async function touchSessionActivity(sessionId, userId) {
  if (!sessionId || !userId) return;
  await query(
    `UPDATE user_sessions SET last_activity_at = CURRENT_TIMESTAMP
     WHERE id = $1::uuid AND user_id = $2 AND revoked_at IS NULL`,
    [sessionId, userId]
  );
}

export async function revokeSession(sessionId) {
  if (!sessionId) return;
  await query(`UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1::uuid AND revoked_at IS NULL`, [
    sessionId,
  ]);
}
