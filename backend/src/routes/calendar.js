import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/** Enriquece eventos com itens (da tabela items ou sintetizado a partir das colunas legadas do evento). */
async function enrichEventsWithItems(rows) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const itemsResult = await query(
    `SELECT id, event_id, iphone_model, storage, color, imei_end, valor_a_vista, valor_com_juros,
            forma_pagamento, valor_troca, manutencao_descontada, modelo_troca, armazenamento_troca,
            troca_aparelhos, parcelas, valor_sinal, condicao, origem_produto, notes
     FROM calendar_event_items WHERE event_id = ANY($1) ORDER BY event_id, id`,
    [ids]
  );
  const itemsByEvent = {};
  for (const i of itemsResult.rows) {
    if (!itemsByEvent[i.event_id]) itemsByEvent[i.event_id] = [];
    let trocaAparelhos = Array.isArray(i.troca_aparelhos) ? i.troca_aparelhos : (i.troca_aparelhos ? JSON.parse(JSON.stringify(i.troca_aparelhos)) : []);
    if (trocaAparelhos.length === 0 && (i.modelo_troca || i.armazenamento_troca)) {
      trocaAparelhos = [{ modelo: i.modelo_troca || '', armazenamento: i.armazenamento_troca || '' }];
    }
    itemsByEvent[i.event_id].push({
      id: i.id,
      event_id: i.event_id,
      iphone_model: i.iphone_model,
      storage: i.storage,
      color: i.color,
      imei_end: i.imei_end,
      valor_a_vista: parseFloat(i.valor_a_vista) || 0,
      valor_com_juros: parseFloat(i.valor_com_juros) || 0,
      forma_pagamento: i.forma_pagamento || 'PIX',
      valor_troca: i.valor_troca != null ? parseFloat(i.valor_troca) : null,
      manutencao_descontada: i.manutencao_descontada != null ? parseFloat(i.manutencao_descontada) : null,
      modelo_troca: i.modelo_troca ?? undefined,
      armazenamento_troca: i.armazenamento_troca ?? undefined,
      troca_aparelhos: trocaAparelhos,
      parcelas: i.parcelas != null ? parseInt(i.parcelas, 10) : null,
      valor_sinal: i.valor_sinal != null ? parseFloat(i.valor_sinal) : null,
      condicao: i.condicao ?? undefined,
      origem_produto: i.origem_produto ?? undefined,
      notes: i.notes ?? undefined,
    });
  }
  return rows.map((e) => {
    const items = itemsByEvent[e.id];
    const hasItems = items && items.length > 0;
    return {
      id: e.id,
      user_id: e.user_id,
      date: e.date,
      time: e.time,
      client_name: e.client_name,
      status: e.status || 'agendado',
      notes: e.notes,
      created_at: e.created_at,
      updated_at: e.updated_at,
      iphone_model: e.iphone_model,
      storage: e.storage,
      imei_end: e.imei_end,
      valor_a_vista: e.valor_a_vista,
      valor_com_juros: e.valor_com_juros,
      forma_pagamento: e.forma_pagamento,
      items: hasItems
        ? items
        : [
            {
              id: null,
              event_id: e.id,
              iphone_model: e.iphone_model,
              storage: e.storage,
              color: null,
              imei_end: e.imei_end,
              valor_a_vista: parseFloat(e.valor_a_vista) || 0,
              valor_com_juros: parseFloat(e.valor_com_juros) || 0,
              forma_pagamento: e.forma_pagamento || 'PIX',
              valor_troca: null,
              manutencao_descontada: null,
              modelo_troca: undefined,
              armazenamento_troca: undefined,
              troca_aparelhos: [],
              parcelas: null,
              valor_sinal: null,
              condicao: undefined,
              origem_produto: undefined,
              notes: e.notes ?? undefined,
            },
          ],
    };
  });
}

// Listar eventos do próprio usuário: por mês (year, month) ou por data (date)
// GET /api/calendar/events?year=2025&month=2  ou  ?date=2025-02-05
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month, date } = req.query;
    let result;
    if (date) {
      result = await query(
        `SELECT id, user_id, date, time, client_name, status, iphone_model, storage, imei_end,
                valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at
         FROM calendar_events
         WHERE user_id = $1 AND date = $2
         ORDER BY time NULLS LAST, id`,
        [userId, date]
      );
    } else if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      result = await query(
        `SELECT id, user_id, date, time, client_name, status, iphone_model, storage, imei_end,
                valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at
         FROM calendar_events
         WHERE user_id = $1 AND date::text LIKE $2
         ORDER BY date, time NULLS LAST, id`,
        [userId, `${prefix}%`]
      );
    } else {
      return res.status(400).json({ message: 'Informe year e month ou date' });
    }
    const events = await enrichEventsWithItems(result.rows);
    return res.json({ events });
  } catch (error) {
    console.error('Erro ao listar eventos do calendário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar evento (aceita 1 produto no body ou array items[])
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      time,
      clientName,
      status,
      notes,
      iphoneModel,
      storage,
      color,
      imeiEnd,
      valorAVista,
      valorComJuros,
      formaPagamento,
      valorTroca,
      manutencaoDescontada,
      items: bodyItems,
    } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Data é obrigatória' });
    }

    const itemsToCreate = Array.isArray(bodyItems) && bodyItems.length > 0
      ? bodyItems
      : [{
          iphoneModel: iphoneModel?.trim(),
          storage: storage?.trim(),
          color: color?.trim() || null,
          imeiEnd: imeiEnd?.trim(),
          valorAVista: Number(valorAVista) || 0,
          valorComJuros: Number(valorComJuros) || 0,
          formaPagamento: formaPagamento || 'PIX',
          valorTroca: valorTroca != null ? Number(valorTroca) : null,
          manutencaoDescontada: manutencaoDescontada != null ? Number(manutencaoDescontada) : null,
          notes: notes ?? null,
        }];

    const first = itemsToCreate[0];
    if (!first?.iphoneModel || !first?.storage || !first?.imeiEnd) {
      return res.status(400).json({ message: 'Cada item precisa de modelo, armazenamento e final do IMEI' });
    }

    const eventStatus = status && ['agendado', 'comprou', 'nao_comprou', 'reagendado'].includes(status)
      ? status
      : 'agendado';
    const firstLegacy = itemsToCreate[0];
    const result = await query(
      `INSERT INTO calendar_events
       (user_id, date, time, client_name, status, iphone_model, storage, imei_end, valor_a_vista, valor_com_juros, forma_pagamento, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, user_id, date, time, client_name, status, iphone_model, storage, imei_end,
                 valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at`,
      [
        req.user.id,
        date,
        time || null,
        clientName || null,
        eventStatus,
        firstLegacy.iphoneModel,
        firstLegacy.storage,
        firstLegacy.imeiEnd,
        Number(firstLegacy.valorAVista) || 0,
        Number(firstLegacy.valorComJuros) || 0,
        firstLegacy.formaPagamento || 'PIX',
        firstLegacy.notes ?? null,
      ]
    );
    const event = result.rows[0];

    for (const it of itemsToCreate) {
      const trocaArr = Array.isArray(it.trocaAparelhos) ? it.trocaAparelhos : [];
      const firstTroca = trocaArr[0];
      const modeloTr = (firstTroca?.model ?? it.tradeInModel ?? '').trim() || null;
      const armTr = (firstTroca?.storage ?? it.tradeInStorage ?? '').trim() || null;
      await query(
        `INSERT INTO calendar_event_items (event_id, iphone_model, storage, color, imei_end, valor_a_vista, valor_com_juros, forma_pagamento, valor_troca, manutencao_descontada, modelo_troca, armazenamento_troca, troca_aparelhos, parcelas, valor_sinal, condicao, origem_produto, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18)`,
        [
          event.id,
          it.iphoneModel?.trim() || first.iphoneModel,
          it.storage?.trim() || first.storage,
          it.color?.trim() || null,
          it.imeiEnd?.trim() || first.imeiEnd,
          Number(it.valorAVista) ?? 0,
          Number(it.valorComJuros) ?? 0,
          it.formaPagamento || 'PIX',
          it.valorTroca != null ? Number(it.valorTroca) : null,
          it.manutencaoDescontada != null ? Number(it.manutencaoDescontada) : null,
          modeloTr,
          armTr,
          JSON.stringify(trocaArr.map((t) => ({ modelo: t.model ?? t.modelo ?? '', armazenamento: t.storage ?? t.armazenamento ?? '', condicao: t.condicao ?? null, obs: t.obs ?? null }))),
          it.parcelas != null ? parseInt(it.parcelas, 10) : null,
          it.valorSinal != null ? Number(it.valorSinal) : null,
          (it.condicao === 'novo' || it.condicao === 'seminovo') ? it.condicao : null,
          (it.origemProduto === 'estoque' || it.origemProduto === 'fornecedor') ? it.origemProduto : null,
          it.notes ?? null,
        ]
      );
    }

    const enriched = await enrichEventsWithItems([event]);
    res.status(201).json({ event: enriched[0] });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar evento (data, hora, cliente, status, notas; opcionalmente substitui itens)
router.patch('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await query(
      'SELECT id, user_id, date, time, client_name, status, iphone_model, storage, imei_end, valor_a_vista, valor_com_juros, forma_pagamento, notes FROM calendar_events WHERE id = $1',
      [id]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    if (existing.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Você só pode editar seus próprios eventos' });
    }

    const {
      date,
      time,
      clientName,
      status,
      notes,
      items: bodyItems,
    } = req.body;

    await query(
      `UPDATE calendar_events SET
        date = COALESCE($2, date),
        time = $3,
        client_name = COALESCE($4, client_name),
        status = COALESCE($5, status),
        notes = $6,
        updated_at = NOW()
       WHERE id = $1`,
      [
        id,
        date ?? existing.rows[0].date,
        time !== undefined ? time : existing.rows[0].time,
        clientName !== undefined ? clientName : existing.rows[0].client_name,
        status && ['agendado', 'comprou', 'nao_comprou', 'reagendado'].includes(status) ? status : existing.rows[0].status,
        notes !== undefined ? notes : existing.rows[0].notes,
      ]
    );

    if (Array.isArray(bodyItems) && bodyItems.length > 0) {
      await query('DELETE FROM calendar_event_items WHERE event_id = $1', [id]);
      for (const it of bodyItems) {
        const im = it.iphoneModel?.trim() || existing.rows[0].iphone_model;
        const st = it.storage?.trim() || existing.rows[0].storage;
        const ie = it.imeiEnd?.trim() || existing.rows[0].imei_end;
        if (!im || !st || !ie) continue;
        const trocaArr = Array.isArray(it.trocaAparelhos) ? it.trocaAparelhos : [];
        const firstTroca = trocaArr[0];
        const modeloTr = (firstTroca?.model ?? it.tradeInModel ?? '').trim() || null;
        const armTr = (firstTroca?.storage ?? it.tradeInStorage ?? '').trim() || null;
        await query(
          `INSERT INTO calendar_event_items (event_id, iphone_model, storage, color, imei_end, valor_a_vista, valor_com_juros, forma_pagamento, valor_troca, manutencao_descontada, modelo_troca, armazenamento_troca, troca_aparelhos, parcelas, valor_sinal, condicao, origem_produto, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16, $17, $18)`,
          [
            id,
            im,
            st,
            it.color?.trim() || null,
            ie,
            Number(it.valorAVista) ?? 0,
            Number(it.valorComJuros) ?? 0,
            it.formaPagamento || 'PIX',
            it.valorTroca != null ? Number(it.valorTroca) : null,
            it.manutencaoDescontada != null ? Number(it.manutencaoDescontada) : null,
            modeloTr,
            armTr,
            JSON.stringify(trocaArr.map((t) => ({ modelo: t.model ?? t.modelo ?? '', armazenamento: t.storage ?? t.armazenamento ?? '', condicao: t.condicao ?? null, obs: t.obs ?? null }))),
            it.parcelas != null ? parseInt(it.parcelas, 10) : null,
            it.valorSinal != null ? Number(it.valorSinal) : null,
            (it.condicao === 'novo' || it.condicao === 'seminovo') ? it.condicao : null,
            (it.origemProduto === 'estoque' || it.origemProduto === 'fornecedor') ? it.origemProduto : null,
            it.notes ?? null,
          ]
        );
      }
    }

    const updated = await query(
      `SELECT id, user_id, date, time, client_name, status, iphone_model, storage, imei_end,
              valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at
       FROM calendar_events WHERE id = $1`,
      [id]
    );
    const enriched = await enrichEventsWithItems(updated.rows);
    res.json({ event: enriched[0] });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Reagendar: apenas altera data e hora (e opcionalmente status para 'reagendado')
router.patch('/events/:id/reschedule', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { date, time, setStatusReagendado } = req.body;
    const existing = await query('SELECT id, user_id FROM calendar_events WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    if (existing.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Você só pode editar seus próprios eventos' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Nova data é obrigatória' });
    }
    const setClauses = ['date = $2', 'updated_at = NOW()'];
    const values = [id, date];
    let pos = 3;
    if (time !== undefined) {
      setClauses.push(`time = $${pos}`);
      values.push(time);
      pos++;
    }
    if (setStatusReagendado === true) {
      setClauses.push(`status = 'reagendado'`);
    }
    await query(
      `UPDATE calendar_events SET ${setClauses.join(', ')} WHERE id = $1`,
      values
    );
    const updated = await query(
      `SELECT id, user_id, date, time, client_name, status, iphone_model, storage, imei_end,
              valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at
       FROM calendar_events WHERE id = $1`,
      [id]
    );
    const enriched = await enrichEventsWithItems(updated.rows);
    res.json({ event: enriched[0] });
  } catch (error) {
    console.error('Erro ao reagendar:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Excluir evento (apenas o dono do evento)
router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await query('SELECT id, user_id FROM calendar_events WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    if (existing.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Você só pode excluir seus próprios eventos' });
    }
    await query('DELETE FROM calendar_events WHERE id = $1', [id]);
    res.json({ message: 'Evento excluído' });
  } catch (error) {
    console.error('Erro ao excluir evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;
