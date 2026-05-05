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

function splitMessageByType(text) {
  const raw = (text || '').toString();
  const lines = raw.split(/\r?\n/);
  const buckets = {
    lacrada: [],
    seminovo: [],
    android: [],
    geral: [],
  };

  let current = 'geral';
  for (const line of lines) {
    const l = line.toLowerCase();
    if (/android|samsung|galaxy|xiaomi|redmi|poco|motorola|realme/.test(l)) current = 'android';
    else if (/seminovo|semi-novo|usado|swap|vitrine/.test(l)) current = 'seminovo';
    else if (/lacrado|novo|selado|seal|cpo/.test(l)) current = 'lacrada';
    buckets[current].push(line);
  }

  const toText = (arr) => arr.join('\n').trim();
  return {
    lacrada: toText(buckets.lacrada),
    seminovo: toText(buckets.seminovo),
    android: toText(buckets.android),
    geral: toText(buckets.geral),
  };
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
      `WITH base AS (
         SELECT
           w.*,
           CASE
             WHEN w.direction = 'inbound' AND LOWER(COALESCE(w.message_text, '')) ~ '(android|samsung|galaxy|xiaomi|redmi|poco|motorola|realme)' THEN 'android'
             WHEN w.direction = 'inbound' AND LOWER(COALESCE(w.message_text, '')) ~ '(seminovo|semi-novo|usado|swap|vitrine)' THEN 'seminovo'
             WHEN w.direction = 'inbound' AND LOWER(COALESCE(w.message_text, '')) ~ '(lacrado|novo|selado|seal|cpo)' THEN 'lacrada'
             ELSE 'geral'
           END AS thread_type
         FROM whatsapp_inbox w
         WHERE w.from_phone IS NOT NULL AND w.from_phone <> ''
       )
       SELECT
         b.from_phone,
         b.thread_type,
         CONCAT(b.from_phone, ':', b.thread_type) AS thread_key,
         COALESCE(MAX(NULLIF(b.profile_name, '')), '') AS profile_name,
         MAX(b.received_at) AS last_received_at,
         COUNT(*)::int AS total_messages,
         COALESCE(SUM(CASE WHEN b.status = 'new' AND b.direction = 'inbound' THEN 1 ELSE 0 END), 0)::int AS unread_count,
         (
           SELECT b2.message_text
           FROM base b2
           WHERE b2.from_phone = b.from_phone
             AND b2.thread_type = b.thread_type
           ORDER BY b2.received_at DESC, b2.id DESC
           LIMIT 1
         ) AS last_message_text,
         (
           SELECT b2.direction
           FROM base b2
           WHERE b2.from_phone = b.from_phone
             AND b2.thread_type = b.thread_type
           ORDER BY b2.received_at DESC, b2.id DESC
           LIMIT 1
         ) AS last_direction
       FROM base b
       GROUP BY b.from_phone, b.thread_type
       ORDER BY MAX(b.received_at) DESC
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
    const listType = (req.query.list_type || '').toString().trim();
    const limitRaw = Number(req.query.limit || 200);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 200;

    if (!phone) return res.status(400).json({ message: 'Telefone inválido' });

    let result;
    if (listType && ['lacrada', 'seminovo', 'android', 'geral'].includes(listType)) {
      result = await query(
        `SELECT id, wa_message_id, from_phone, profile_name, message_type, message_text, status, direction, received_at, created_at
         FROM whatsapp_inbox
         WHERE from_phone = $1
           AND (
             direction = 'outbound'
             OR (
               direction = 'inbound'
               AND (
                 ($3 = 'android' AND LOWER(COALESCE(message_text, '')) ~ '(android|samsung|galaxy|xiaomi|redmi|poco|motorola|realme)')
                 OR ($3 = 'seminovo' AND LOWER(COALESCE(message_text, '')) ~ '(seminovo|semi-novo|usado|swap|vitrine)')
                 OR ($3 = 'lacrada' AND LOWER(COALESCE(message_text, '')) ~ '(lacrado|novo|selado|seal|cpo)')
                 OR ($3 = 'geral' AND LOWER(COALESCE(message_text, '')) !~ '(android|samsung|galaxy|xiaomi|redmi|poco|motorola|realme|seminovo|semi-novo|usado|swap|vitrine|lacrado|novo|selado|seal|cpo)')
               )
             )
           )
         ORDER BY received_at ASC, id ASC
         LIMIT $2`,
        [phone, limit, listType]
      );
    } else {
      result = await query(
        `SELECT id, wa_message_id, from_phone, profile_name, message_type, message_text, status, direction, received_at, created_at
         FROM whatsapp_inbox
         WHERE from_phone = $1
         ORDER BY received_at ASC, id ASC
         LIMIT $2`,
        [phone, limit]
      );
    }

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

router.patch('/inbox/:id/message-text', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const messageText = (req.body?.message_text || '').toString().trim();

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    if (!messageText) {
      return res.status(400).json({ message: 'Texto da mensagem é obrigatório' });
    }

    const result = await query(
      `UPDATE whatsapp_inbox
       SET message_text = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, message_text, status, updated_at`,
      [messageText, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    return res.json({ item: result.rows[0] });
  } catch (error) {
    console.error('❌ Erro ao atualizar texto do inbox WhatsApp:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.post('/inbox/:id/link-supplier', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    const supplierId = Number(req.body?.supplier_id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    if (!Number.isInteger(supplierId) || supplierId <= 0) {
      return res.status(400).json({ message: 'Fornecedor inválido' });
    }

    const inboxResult = await query(
      `SELECT id, from_phone
       FROM whatsapp_inbox
       WHERE id = $1
       LIMIT 1`,
      [id]
    );
    if (inboxResult.rows.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    const fromPhone = normalizePhone(inboxResult.rows[0].from_phone);
    if (!fromPhone) {
      return res.status(400).json({ message: 'Telefone da mensagem inválido' });
    }

    const supplierResult = await query(
      `SELECT id, name, whatsapp, contact_phone
       FROM suppliers
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [supplierId]
    );
    if (supplierResult.rows.length === 0) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }
    const supplier = supplierResult.rows[0];

    await query(
      `INSERT INTO supplier_whatsapp_numbers (supplier_id, phone_number, is_primary, description)
       VALUES ($1, $2, false, 'Vinculado via WhatsApp Inbox')
       ON CONFLICT (supplier_id, phone_number) DO NOTHING`,
      [supplierId, fromPhone]
    );

    // Garantir fallback de compatibilidade no supplier principal
    if (!supplier.whatsapp) {
      await query(`UPDATE suppliers SET whatsapp = $1 WHERE id = $2`, [fromPhone, supplierId]);
    } else if (!supplier.contact_phone) {
      await query(`UPDATE suppliers SET contact_phone = $1 WHERE id = $2`, [fromPhone, supplierId]);
    }

    await query(
      `UPDATE whatsapp_inbox
       SET status = 'new', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    return res.json({
      message: 'Fornecedor vinculado ao número com sucesso',
      supplier: { id: supplier.id, name: supplier.name },
      phone: fromPhone,
    });
  } catch (error) {
    console.error('❌ Erro ao vincular fornecedor no inbox WhatsApp:', error);
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
    const splitParts = splitMessageByType(rawText);

    // match fornecedor por whatsapp/contact_phone
    const normalizedPhone = normalizePhone(inboxItem.from_phone);
    const supplierResult = await query(
      `SELECT s.id, s.name, s.whatsapp, s.contact_phone
       FROM suppliers s
       WHERE s.is_active = true
         AND (
           regexp_replace(COALESCE(s.whatsapp, ''), '\D', '', 'g') = $1
           OR regexp_replace(COALESCE(s.contact_phone, ''), '\D', '', 'g') = $1
           OR EXISTS (
             SELECT 1
             FROM supplier_whatsapp_numbers swn
             WHERE swn.supplier_id = s.id
               AND regexp_replace(COALESCE(swn.phone_number, ''), '\D', '', 'g') = $1
           )
         )
       ORDER BY s.id ASC
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
      const textForType =
        listType === 'android'
          ? (splitParts.android || splitParts.geral || rawText)
          : (splitParts[listType] || splitParts.geral || rawText);
      const validation = await aiService.validateProductListFromText(textForType, { listType });
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
    return res.status(500).json({ message: error?.message || 'Erro interno do servidor' });
  }
});

router.post('/inbox/:id/split', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const inboxResult = await query(
      `SELECT id, from_phone, profile_name, message_type, message_text, status, direction, raw_payload
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
      return res.status(400).json({ message: 'Só é possível separar mensagens de texto.' });
    }

    const rawText = (inboxItem.message_text || '').toString().trim();
    if (rawText.length < 10) {
      return res.status(400).json({ message: 'Mensagem muito curta para separação.' });
    }

    const parts = splitMessageByType(rawText);
    const separableParts = [
      { type: 'lacrada', text: (parts.lacrada || '').trim() },
      { type: 'seminovo', text: (parts.seminovo || '').trim() },
      { type: 'android', text: (parts.android || '').trim() },
    ].filter((p) => p.text.length >= 20);

    if (separableParts.length === 0) {
      return res.status(400).json({ message: 'Não foi possível identificar blocos para separar.' });
    }

    const createdItems = [];
    for (const part of separableParts) {
      const insert = await query(
        `INSERT INTO whatsapp_inbox (
          wa_message_id, from_phone, profile_name, message_type, message_text, raw_payload, status, direction, received_at
        ) VALUES ($1, $2, $3, 'text', $4, $5::jsonb, 'new', 'inbound', CURRENT_TIMESTAMP)
        RETURNING id, from_phone, profile_name, message_type, message_text, status, direction, received_at`,
        [
          null,
          inboxItem.from_phone,
          inboxItem.profile_name,
          `[SEPARADO:${part.type.toUpperCase()}]\n${part.text}`,
          JSON.stringify({
            source_inbox_id: id,
            split_type: part.type,
            original_status: inboxItem.status,
            original_direction: inboxItem.direction,
          }),
        ]
      );
      createdItems.push({ ...insert.rows[0], split_type: part.type });
    }

    await query(
      `UPDATE whatsapp_inbox
       SET status = 'ignored',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );

    return res.json({
      message: 'Mensagem separada com sucesso',
      original_id: id,
      created_count: createdItems.length,
      items: createdItems,
    });
  } catch (error) {
    console.error('❌ Erro ao separar item do inbox WhatsApp:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.delete('/inbox/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID inválido' });
    }

    const result = await query(
      `DELETE FROM whatsapp_inbox
       WHERE id = $1
       RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Item não encontrado' });
    }

    return res.json({ ok: true, id: result.rows[0].id });
  } catch (error) {
    console.error('❌ Erro ao excluir item do inbox WhatsApp:', error);
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

