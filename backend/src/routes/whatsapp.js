import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import aiService from '../services/aiService.js';

const router = express.Router();

function normalizePhone(phone) {
  return (phone || '').toString().replace(/\D/g, '');
}

function detectListKinds(text) {
  const t = (text || '').toLowerCase();
  const seminovoHints = ['seminovo', 'semi-novo', 'vitrine', 'usado', 'swap'];
  const lacradoHints = ['lacrado', 'novo', 'cpo', 'seal', 'selado'];
  const hasSeminovo = seminovoHints.some((k) => t.includes(k));
  const hasLacrado = lacradoHints.some((k) => t.includes(k));
  if (hasSeminovo && hasLacrado) return ['lacrada', 'seminovo'];
  if (hasSeminovo) return ['seminovo'];
  return ['lacrada'];
}

function extractValidatedProducts(validationResult) {
  return (
    validationResult?.validatedProducts ||
    validationResult?.validated_products ||
    validationResult?.products ||
    validationResult?.parsedProducts ||
    []
  );
}

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
        if (!messageText) {
          messageText = `[MÍDIA:${messageType}]`;
        }
        const status = messageType === 'text' ? 'new' : 'ignored';

        await query(
          `INSERT INTO whatsapp_inbox (
            wa_message_id, from_phone, profile_name, message_type, message_text, raw_payload, status, direction, received_at
          ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, 'inbound', CURRENT_TIMESTAMP)
          ON CONFLICT (wa_message_id) DO UPDATE
          SET raw_payload = EXCLUDED.raw_payload,
              message_text = EXCLUDED.message_text,
              updated_at = CURRENT_TIMESTAMP`,
          [waMessageId, normalizePhone(fromPhone), profileName, messageType, messageText, JSON.stringify(msg), status]
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

router.get('/conversations', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 100;

    const result = await query(
      `SELECT
         w.from_phone,
         COALESCE(MAX(NULLIF(w.profile_name, '')), '') AS profile_name,
         MAX(w.received_at) AS last_received_at,
         COUNT(*)::int AS total_messages,
         COALESCE(SUM(CASE WHEN w.status = 'new' AND w.direction = 'inbound' THEN 1 ELSE 0 END), 0)::int AS unread_count,
         (
           SELECT w2.message_text
           FROM whatsapp_inbox w2
           WHERE w2.from_phone = w.from_phone
           ORDER BY w2.received_at DESC, w2.id DESC
           LIMIT 1
         ) AS last_message_text,
         (
           SELECT w2.direction
           FROM whatsapp_inbox w2
           WHERE w2.from_phone = w.from_phone
           ORDER BY w2.received_at DESC, w2.id DESC
           LIMIT 1
         ) AS last_direction
       FROM whatsapp_inbox w
       WHERE w.from_phone IS NOT NULL AND w.from_phone <> ''
       GROUP BY w.from_phone
       ORDER BY MAX(w.received_at) DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('❌ Erro ao listar conversas WhatsApp:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/conversations/:phone/messages', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const phone = normalizePhone(req.params.phone);
    const limitRaw = Number(req.query.limit || 200);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

    if (!phone) return res.status(400).json({ message: 'Telefone inválido' });

    const result = await query(
      `SELECT id, wa_message_id, from_phone, profile_name, message_type, message_text, status, direction, received_at, created_at
       FROM whatsapp_inbox
       WHERE from_phone = $1
       ORDER BY received_at ASC, id ASC
       LIMIT $2`,
      [phone, limit]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('❌ Erro ao listar mensagens da conversa:', error);
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

    const inboxResult = await query(
      `SELECT id, from_phone, message_type, message_text, status
       FROM whatsapp_inbox
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (inboxResult.rows.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    const inboxItem = inboxResult.rows[0];
    if (inboxItem.message_type !== 'text') {
      await query(
        `UPDATE whatsapp_inbox SET status = 'ignored', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
      return res.status(400).json({ message: 'Mensagens de mídia são ignoradas no processamento automático.' });
    }

    const rawText = (inboxItem.message_text || '').toString().trim();
    if (rawText.length < 10) {
      await query(
        `UPDATE whatsapp_inbox SET status = 'ignored', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );
      return res.status(400).json({ message: 'Mensagem curta/sem lista suficiente para processar.' });
    }

    const forcedType = (req.body?.list_type || '').toString().trim();
    const listKinds =
      forcedType === 'lacrada' || forcedType === 'seminovo' || forcedType === 'android'
        ? [forcedType]
        : detectListKinds(rawText);

    // match fornecedor por whatsapp/contact_phone
    const normalizedPhone = normalizePhone(inboxItem.from_phone);
    const supplierResult = await query(
      `SELECT id, name, whatsapp, contact_phone
       FROM suppliers
       WHERE is_active = true
         AND (
           regexp_replace(COALESCE(whatsapp, ''), '\D', '', 'g') = $1
           OR regexp_replace(COALESCE(contact_phone, ''), '\D', '', 'g') = $1
         )
       ORDER BY id ASC
       LIMIT 1`,
      [normalizedPhone]
    );

    if (supplierResult.rows.length === 0) {
      await query(
        `UPDATE whatsapp_inbox
         SET status = 'pending_supplier', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
      return res.status(400).json({ message: 'Fornecedor não identificado pelo número. Item marcado como pendente fornecedor.' });
    }

    const supplier = supplierResult.rows[0];
    const processingSummary = [];
    let totalSaved = 0;

    for (const listType of listKinds) {
      const validation = await aiService.validateProductListFromText(rawText, { listType });
      const validatedProducts = extractValidatedProducts(validation);

      if (!Array.isArray(validatedProducts) || validatedProducts.length === 0) {
        processingSummary.push({ list_type: listType, saved_products: 0, skipped: true });
        continue;
      }

      const processResp = await fetch(`http://127.0.0.1:${process.env.PORT || 3001}/api/ai/process-list`, {
        method: 'POST',
        headers: {
          Authorization: req.headers.authorization || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplier_id: supplier.id,
          supplier_name: supplier.name,
          supplier_whatsapp: supplier.whatsapp || supplier.contact_phone || null,
          validated_products: validatedProducts,
          raw_list_text: rawText,
          list_type: listType,
        }),
      });

      const processData = await processResp.json();
      if (!processResp.ok) {
        throw new Error(processData?.message || `Falha ao processar lista ${listType}`);
      }
      const saved = Number(processData?.summary?.saved_products || 0);
      totalSaved += saved;
      processingSummary.push({
        list_type: listType,
        saved_products: saved,
        total_products: Number(processData?.summary?.total_products || validatedProducts.length),
      });
    }

    const updated = await query(
      `UPDATE whatsapp_inbox
       SET status = 'processed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, status, updated_at`,
      [id]
    );

    return res.json({
      item: updated.rows[0],
      supplier: { id: supplier.id, name: supplier.name },
      summary: { total_saved: totalSaved, by_type: processingSummary },
    });
  } catch (error) {
    console.error('❌ Erro ao processar item do inbox WhatsApp:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/conversations/:phone/send', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const toPhone = normalizePhone(req.params.phone);
    const message = (req.body?.message || '').toString().trim();
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!toPhone) return res.status(400).json({ message: 'Telefone inválido' });
    if (!message) return res.status(400).json({ message: 'Mensagem é obrigatória' });
    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({
        message: 'Faltam variáveis WHATSAPP_ACCESS_TOKEN e/ou WHATSAPP_PHONE_NUMBER_ID no backend',
      });
    }

    const response = await fetch(`https://graph.facebook.com/v22.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: toPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('❌ Erro ao enviar mensagem via Meta:', data);
      return res.status(response.status).json({
        message: data?.error?.message || 'Falha ao enviar mensagem',
      });
    }

    const waMessageId = data?.messages?.[0]?.id || null;
    const insert = await query(
      `INSERT INTO whatsapp_inbox (
         wa_message_id, from_phone, profile_name, message_type, message_text, raw_payload, status, direction, received_at
       ) VALUES ($1, $2, NULL, 'text', $3, $4::jsonb, 'processed', 'outbound', CURRENT_TIMESTAMP)
       RETURNING id, wa_message_id, from_phone, message_text, status, direction, received_at`,
      [waMessageId, toPhone, message, JSON.stringify(data)]
    );

    res.status(201).json({ item: insert.rows[0] });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem na conversa WhatsApp:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;

