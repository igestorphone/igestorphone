import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/whatsapp/webhook
 * Endpoint de verificação do webhook (Meta WhatsApp Cloud API)
 */
router.get('/webhook', (req, res) => {
  try {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || '';

    if (mode === 'subscribe' && token && token === expectedToken) {
      return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
  } catch (error) {
    console.error('❌ Erro ao validar webhook do WhatsApp:', error);
    return res.sendStatus(500);
  }
});

/**
 * POST /api/whatsapp/webhook
 * Recebe eventos/mensagens da Meta
 */
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};

    // Ack rápido para evitar timeout da Meta
    res.sendStatus(200);

    // Log simples (MVP); depois podemos salvar no banco/fila
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages || [];
    const contacts = value?.contacts || [];

    if (messages.length > 0) {
      for (const msg of messages) {
        const waMessageId = msg?.id || null;
        const fromPhone = msg?.from || null;
        const messageType = msg?.type || 'unknown';
        const profileName = contacts?.[0]?.profile?.name || null;
        let messageText = '';
        if (messageType === 'text') messageText = msg?.text?.body || '';
        if (messageType === 'button') messageText = msg?.button?.text || '';
        if (messageType === 'interactive') messageText = msg?.interactive?.button_reply?.title || msg?.interactive?.list_reply?.title || '';
        if (!messageText) messageText = JSON.stringify(msg).slice(0, 2000);

        await query(
          `INSERT INTO whatsapp_inbox (
            wa_message_id, from_phone, profile_name, message_type, message_text, raw_payload, status, received_at
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'new', CURRENT_TIMESTAMP)
          ON CONFLICT (wa_message_id) DO UPDATE
          SET raw_payload = EXCLUDED.raw_payload,
              message_text = EXCLUDED.message_text,
              updated_at = CURRENT_TIMESTAMP`,
          [waMessageId, fromPhone, profileName, messageType, messageText, JSON.stringify(msg)]
        );
      }
      console.log('📩 WhatsApp webhook: mensagens recebidas', {
        count: messages.length,
        from: messages[0]?.from,
        type: messages[0]?.type,
      });
    } else {
      console.log('ℹ️ WhatsApp webhook: evento recebido sem mensagens');
    }
  } catch (error) {
    // Mesmo com erro interno, já respondemos 200 para Meta (acima)
    console.error('❌ Erro ao processar webhook do WhatsApp:', error);
  }
});

router.get('/status', authenticateToken, requireRole('admin'), async (_req, res) => {
  try {
    const result = await query(
      `SELECT id, from_phone, message_type, message_text, status, received_at
       FROM whatsapp_inbox
       ORDER BY received_at DESC
       LIMIT 1`
    );
    const lastEvent = result.rows[0] || null;
    res.json({
      ok: true,
      webhook_configured: Boolean(process.env.WHATSAPP_VERIFY_TOKEN),
      last_event: lastEvent,
    });
  } catch (error) {
    console.error('❌ Erro ao consultar status do WhatsApp:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/inbox', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const status = (req.query.status || '').toString().trim();
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;
    const values = [limit];
    let where = '';

    if (status) {
      where = 'WHERE status = $2';
      values.push(status);
    }

    const result = await query(
      `SELECT id, wa_message_id, from_phone, profile_name, message_type, message_text, status, received_at, created_at, raw_payload
       FROM whatsapp_inbox
       ${where}
       ORDER BY received_at DESC
       LIMIT $1`,
      values
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('❌ Erro ao listar inbox do WhatsApp:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.patch('/inbox/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const allowedStatus = new Set(['new', 'processed', 'error', 'pending_supplier', 'ignored']);
    const nextStatus = (req.body?.status || '').toString().trim();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    if (!allowedStatus.has(nextStatus)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const result = await query(
      `UPDATE whatsapp_inbox
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status, updated_at`,
      [nextStatus, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    return res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('❌ Erro ao atualizar status do inbox WhatsApp:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/inbox/:id/process', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    // MVP: marca como processado.
    // Próximo passo: plugar chamada real do pipeline de processamento de lista.
    const result = await query(
      `UPDATE whatsapp_inbox
       SET status = 'processed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, status, updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    return res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('❌ Erro ao processar item do inbox WhatsApp:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

