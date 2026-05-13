import crypto from 'crypto';
import { query } from '../config/database.js';

/** Máximo de JWTs/sessões ativas por usuário (novo login revoga as mais antigas). */
export function getMaxConcurrentSessions() {
  const n = parseInt(process.env.MAX_CONCURRENT_SESSIONS_PER_USER || '2', 10);
  if (Number.isNaN(n)) return 2;
  return Math.max(1, Math.min(20, n));
}

/** Rótulo curto para exibição (dispositivos / sessões). */
export function summarizeUserAgent(userAgent) {
  const ua = (userAgent || '').toString();
  if (!ua.trim()) return 'Dispositivo desconhecido';
  const u = ua.toLowerCase();
  let os = 'Outro sistema';
  if (u.includes('iphone') || u.includes('ipad') || u.includes('ios')) os = 'iOS';
  else if (u.includes('android')) os = 'Android';
  else if (u.includes('mac os') || u.includes('macintosh')) os = 'macOS';
  else if (u.includes('windows')) os = 'Windows';
  else if (u.includes('linux') || u.includes('cros')) os = 'Linux';
  let br = 'Navegador';
  if (u.includes('edg/') || u.includes('edgios')) br = 'Edge';
  else if (u.includes('opr/') || u.includes('opera')) br = 'Opera';
  else if (u.includes('firefox')) br = 'Firefox';
  else if (u.includes('safari') && !u.includes('chrome')) br = 'Safari';
  else if (u.includes('chrome')) br = 'Chrome';
  return `${os} · ${br}`;
}

/**
 * Cria sessão e revoga as excedentes (mantém as `getMaxConcurrentSessions()` mais recentes).
 * @param {number} userId
 * @param {{ ip?: string | null; userAgent?: string | null }} [meta]
 * @returns {string} UUID da sessão (claim `sid` no JWT)
 */
export async function createSessionForUser(userId, meta = {}) {
  const sessionId = crypto.randomUUID();
  const max = getMaxConcurrentSessions();
  const ip = meta.ip != null && String(meta.ip).trim() ? String(meta.ip).slice(0, 64) : null;
  const userAgent = meta.userAgent != null && String(meta.userAgent).trim() ? String(meta.userAgent) : null;

  await query(
    `INSERT INTO user_sessions (id, user_id, ip_address, user_agent) VALUES ($1::uuid, $2, $3, $4)`,
    [sessionId, userId, ip, userAgent]
  );

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
