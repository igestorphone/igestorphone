import express from 'express';
import { query } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Listar eventos do próprio usuário: por mês (year, month) ou por data (date)
// Cada usuário vê apenas seus próprios eventos.
// GET /api/calendar/events?year=2025&month=2  ou  ?date=2025-02-05
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month, date } = req.query;
    if (date) {
      const result = await query(
        `SELECT id, user_id, date, time, client_name, iphone_model, storage, imei_end,
                valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at
         FROM calendar_events
         WHERE user_id = $1 AND date = $2
         ORDER BY time NULLS LAST, id`,
        [userId, date]
      );
      return res.json({ events: result.rows });
    }
    if (year && month) {
      const prefix = `${year}-${String(month).padStart(2, '0')}`;
      const result = await query(
        `SELECT id, user_id, date, time, client_name, iphone_model, storage, imei_end,
                valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at
         FROM calendar_events
         WHERE user_id = $1 AND date::text LIKE $2
         ORDER BY date, time NULLS LAST, id`,
        [userId, `${prefix}%`]
      );
      return res.json({ events: result.rows });
    }
    return res.status(400).json({ message: 'Informe year e month ou date' });
  } catch (error) {
    console.error('Erro ao listar eventos do calendário:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar evento
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      time,
      clientName,
      iphoneModel,
      storage,
      imeiEnd,
      valorAVista,
      valorComJuros,
      formaPagamento,
      notes,
    } = req.body;

    if (!date || !iphoneModel?.trim() || !storage?.trim() || !imeiEnd?.trim()) {
      return res.status(400).json({ message: 'Data, modelo, armazenamento e final do IMEI são obrigatórios' });
    }

    const result = await query(
      `INSERT INTO calendar_events
       (user_id, date, time, client_name, iphone_model, storage, imei_end, valor_a_vista, valor_com_juros, forma_pagamento, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, user_id, date, time, client_name, iphone_model, storage, imei_end,
                 valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at`,
      [
        req.user.id,
        date,
        time || null,
        clientName || null,
        iphoneModel.trim(),
        storage.trim(),
        imeiEnd.trim(),
        Number(valorAVista) || 0,
        Number(valorComJuros) || 0,
        formaPagamento || 'PIX',
        notes || null,
      ]
    );

    res.status(201).json({ event: result.rows[0] });
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar evento (apenas o dono do evento)
router.patch('/events/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const existing = await query('SELECT id, user_id FROM calendar_events WHERE id = $1', [id]);
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
      iphoneModel,
      storage,
      imeiEnd,
      valorAVista,
      valorComJuros,
      formaPagamento,
      notes,
    } = req.body;

    const result = await query(
      `UPDATE calendar_events SET
        date = COALESCE($2, date),
        time = $3,
        client_name = $4,
        iphone_model = COALESCE($5, iphone_model),
        storage = COALESCE($6, storage),
        imei_end = COALESCE($7, imei_end),
        valor_a_vista = COALESCE($8, valor_a_vista),
        valor_com_juros = COALESCE($9, valor_com_juros),
        forma_pagamento = COALESCE($10, forma_pagamento),
        notes = $11,
        updated_at = NOW()
       WHERE id = $1
       RETURNING id, user_id, date, time, client_name, iphone_model, storage, imei_end,
                 valor_a_vista, valor_com_juros, forma_pagamento, notes, created_at, updated_at`,
      [
        id,
        date,
        time ?? null,
        clientName ?? null,
        iphoneModel?.trim(),
        storage?.trim(),
        imeiEnd?.trim(),
        valorAVista != null ? Number(valorAVista) : null,
        valorComJuros != null ? Number(valorComJuros) : null,
        formaPagamento,
        notes ?? null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Evento não encontrado' });
    }
    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
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
