import { query, getClient } from '../config/database.js';

async function runOptional(client, text, params) {
  try {
    await client.query(text, params);
  } catch (err) {
    console.warn('[deleteUserAccount] Ignorado:', err.message);
  }
}

/** Exclusão permanente (libera e-mail para novo cadastro). */
export async function deleteUserAccountPermanently(userId, { logUserId = null, reason = 'auto_grace_expired' } = {}) {
  const id = parseInt(String(userId), 10);
  if (!Number.isFinite(id)) return { deleted: false, reason: 'invalid_id' };

  const existing = await query('SELECT id, email, tipo FROM users WHERE id = $1', [id]);
  if (existing.rows.length === 0) return { deleted: false, reason: 'not_found' };

  const row = existing.rows[0];
  if ((row.tipo || '').toString().toLowerCase() === 'admin') {
    return { deleted: false, reason: 'admin_protected' };
  }

  const childIds = await query('SELECT id FROM users WHERE parent_id = $1', [id]);
  const idsToDelete = [id, ...childIds.rows.map((r) => r.id)];

  for (const uid of idsToDelete) {
    await query(
      `UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL`,
      [uid]
    ).catch(() => {});

    const client = await getClient();
    try {
      await runOptional(client, 'DELETE FROM user_permissions WHERE user_id = $1', [uid]);
      await runOptional(
        client,
        'UPDATE supplier_suggestions SET user_id = NULL, reviewed_by = NULL WHERE user_id = $1 OR reviewed_by = $1',
        [uid]
      );
      await runOptional(client, 'UPDATE registration_tokens SET used_by = NULL WHERE used_by = $1', [uid]);
      await runOptional(client, 'UPDATE registration_tokens SET created_by = NULL WHERE created_by = $1', [uid]);

      await client.query('BEGIN');
      await client.query('DELETE FROM subscriptions WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM goals WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM notes WHERE user_id = $1', [uid]);
      await client.query('DELETE FROM support_tickets WHERE user_id = $1', [uid]);
      await client.query(
        'UPDATE bug_reports SET user_id = NULL, resolved_by = NULL WHERE user_id = $1 OR resolved_by = $1',
        [uid]
      );
      await client.query('UPDATE users SET parent_id = NULL WHERE parent_id = $1', [uid]);
      await client.query('DELETE FROM users WHERE id = $1', [uid]);
      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK').catch(() => {});
      throw txError;
    } finally {
      client.release();
    }
  }

  try {
    await query(
      `
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, NULL, 'system')
    `,
      [
        logUserId,
        'user_deleted_grace',
        JSON.stringify({ deleted_user_id: id, email: row.email, reason, also_children: childIds.rows.length }),
      ]
    );
  } catch (_) {}

  return { deleted: true, email: row.email, children: childIds.rows.length };
}
