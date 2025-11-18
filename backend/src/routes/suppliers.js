import express from 'express';
import { body, validationResult, query as queryValidator } from 'express-validator';
import { query } from '../config/database.js';
import { authenticateToken, requireRole, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Listar fornecedores
router.get('/', [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 1000 }),
  queryValidator('search').optional().trim(),
  queryValidator('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 1000, search = '', is_active } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values = [];
    let paramCount = 1;

    // Por padrão, mostrar apenas fornecedores ativos
    // Se is_active for especificado explicitamente, usar o filtro dinâmico
    if (is_active !== undefined) {
      whereClause = 'WHERE s.is_active = $1';
      values.push(is_active === 'true');
      paramCount = 2;
    } else {
      // Por padrão, filtrar apenas ativos
      whereClause = 'WHERE s.is_active = true';
    }

    if (search) {
      whereClause += ` AND (s.name ILIKE $${paramCount} OR s.contact_email ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Buscar fornecedores com informações de processamento do dia
    // Por padrão, reset às 00h (meia-noite)
    // Configurar no .env: RESET_HOUR=0 (ou omitir para 00h)
    // Para outros horários: RESET_HOUR=19 (19h) ou RESET_HOUR=20 (20h)
    const resetHour = parseInt(process.env.RESET_HOUR || '0') || 0; // 0 = 00h (padrão), 19 = 19h, 20 = 20h
    const now = new Date();
    const currentHour = now.getHours();
    
    // Calcular o início do "dia" baseado no horário de reset
    let dayStartTimestamp;
    if (resetHour === 0) {
      // Reset à meia-noite (comportamento padrão)
      dayStartTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else {
      // Reset às 19h ou 20h
      if (currentHour >= resetHour) {
        // Hoje já passou do horário de reset, então "hoje" começou no horário de reset de hoje
        dayStartTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate(), resetHour, 0, 0, 0);
      } else {
        // Hoje ainda não passou do horário de reset, então "hoje" começou no horário de reset de ontem
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        dayStartTimestamp = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), resetHour, 0, 0, 0);
      }
    }
    
    // Adicionar dayStartTimestamp aos valores
    const queryValues = [...values, dayStartTimestamp.toISOString()];
    // O timestamp será sempre o último parâmetro antes de limit/offset
    const timestampParamIndex = queryValues.length; // Índice baseado em 1 (para SQL)
    const limitParamIndex = timestampParamIndex + 1;
    const offsetParamIndex = timestampParamIndex + 2;
    
    const suppliersResult = await query(`
      SELECT s.*, 
             COUNT(p.id) as product_count,
             AVG(p.price) as avg_price,
             MAX(p.updated_at) as last_processed_at,
             CASE 
               WHEN MAX(p.updated_at) >= $${timestampParamIndex}::timestamp THEN true
               ELSE false
             END as processed_today,
             COUNT(DISTINCT CASE 
               WHEN p.updated_at >= $${timestampParamIndex}::timestamp THEN p.id
               ELSE NULL
             END) as products_processed_today
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = true
      ${whereClause}
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `, [...queryValues, limit, offset]);

    // Contar total (usar apenas os parâmetros do whereClause, SEM o timestamp)
    // A query de contagem não precisa do timestamp porque só está contando fornecedores
    const countResult = await query(`
      SELECT COUNT(DISTINCT s.id) as total
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = true
      ${whereClause}
    `, values); // Usar apenas 'values', não 'queryValues' (que contém o timestamp)

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      suppliers: suppliersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao listar fornecedores:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar fornecedor por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT s.*, 
             COUNT(p.id) as product_count,
             AVG(p.price) as avg_price,
             MIN(p.price) as min_price,
             MAX(p.price) as max_price
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = true
      WHERE s.id = $1
      GROUP BY s.id
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    const supplier = result.rows[0];

    // Buscar produtos do fornecedor
    const productsResult = await query(`
      SELECT id, name, model, price, stock_quantity, condition, created_at
      FROM products
      WHERE supplier_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      supplier,
      recent_products: productsResult.rows
    });

  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar fornecedor (apenas usuários com assinatura ativa)
router.post('/', requireSubscription('active'), [
  body('name').trim().isLength({ min: 1 }),
  body('contact_email').optional().isEmail().normalizeEmail(),
  body('contact_phone').optional().trim(),
  body('whatsapp').optional().trim(),
  body('city').optional().trim(),
  body('website').optional().isURL(),
  body('api_endpoint').optional().isURL(),
  body('api_key').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      contact_email,
      contact_phone,
      whatsapp,
      city,
      website,
      api_endpoint,
      api_key
    } = req.body;

    // Verificar se fornecedor já existe
    if (contact_email) {
      const existingSupplier = await query('SELECT id FROM suppliers WHERE contact_email = $1', [contact_email]);
      if (existingSupplier.rows.length > 0) {
        return res.status(400).json({ message: 'Fornecedor com este email já existe' });
      }
    }

    // Criar fornecedor
    const result = await query(`
      INSERT INTO suppliers (name, contact_email, contact_phone, whatsapp, city, website, api_endpoint, api_key)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      name,
      contact_email || null,
      contact_phone || null,
      whatsapp || contact_phone || null,
      city || null,
      website || null,
      api_endpoint || null,
      api_key || null
    ]);

    const supplier = result.rows[0];

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'supplier_created',
      JSON.stringify({ supplier_id: supplier.id, name: supplier.name }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      message: 'Fornecedor criado com sucesso',
      supplier
    });

  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar fornecedor
router.put('/:id', requireSubscription('active'), [
  body('name').optional().trim().isLength({ min: 1 }),
  body('contact_email').optional().isEmail().normalizeEmail(),
  body('contact_phone').optional().trim(),
  body('whatsapp').optional().trim(),
  body('city').optional().trim(),
  body('website').optional().isURL(),
  body('api_endpoint').optional().isURL(),
  body('api_key').optional().trim(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Verificar se fornecedor existe
    const existingSupplier = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (existingSupplier.rows.length === 0) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    // Verificar se email já existe (se estiver sendo atualizado)
    if (updates.contact_email) {
      const emailCheck = await query('SELECT id FROM suppliers WHERE contact_email = $1 AND id != $2', [updates.contact_email, id]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Email já está em uso por outro fornecedor' });
      }
    }

    // Preparar campos para atualização
    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        fieldsToUpdate.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    const queryText = `UPDATE suppliers SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    const supplier = result.rows[0];

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'supplier_updated',
      JSON.stringify({ supplier_id: supplier.id, updated_fields: Object.keys(updates) }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Fornecedor atualizado com sucesso',
      supplier
    });

  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar fornecedor (soft delete)
router.delete('/:id', requireSubscription('active'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se fornecedor existe
    const existingSupplier = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    if (existingSupplier.rows.length === 0) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    // Verificar quantos produtos estão associados
    const productsCount = await query('SELECT COUNT(*) FROM products WHERE supplier_id = $1 AND is_active = true', [id]);
    const productCount = parseInt(productsCount.rows[0].count);

    // Soft delete do fornecedor e dos produtos associados
    // Desativar todos os produtos do fornecedor
    if (productCount > 0) {
      await query('UPDATE products SET is_active = false WHERE supplier_id = $1 AND is_active = true', [id]);
    }

    // Soft delete do fornecedor
    await query('UPDATE suppliers SET is_active = false WHERE id = $1', [id]);

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'supplier_deleted',
      JSON.stringify({ 
        supplier_id: id, 
        supplier_name: existingSupplier.rows[0].name,
        products_deactivated: productCount 
      }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ 
      message: 'Fornecedor deletado com sucesso',
      products_deactivated: productCount
    });

  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Ativar/desativar fornecedor
router.put('/:id/toggle-status', requireSubscription('active'), async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await query(`
      UPDATE suppliers 
      SET is_active = $1 
      WHERE id = $2 
      RETURNING id, name, is_active
    `, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    const supplier = result.rows[0];

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'supplier_status_changed',
      JSON.stringify({ supplier_id: id, new_status: is_active }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ 
      message: `Fornecedor ${is_active ? 'ativado' : 'desativado'} com sucesso`,
      supplier 
    });

  } catch (error) {
    console.error('Erro ao alterar status do fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Estatísticas do fornecedor
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    // Verificar se fornecedor existe
    const supplierCheck = await query('SELECT id FROM suppliers WHERE id = $1', [id]);
    if (supplierCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Fornecedor não encontrado' });
    }

    // Estatísticas gerais
    const statsResult = await query(`
      SELECT 
        COUNT(p.id) as total_products,
        AVG(p.price) as avg_price,
        MIN(p.price) as min_price,
        MAX(p.price) as max_price,
        SUM(p.stock_quantity) as total_stock
      FROM products p
      WHERE p.supplier_id = $1 AND p.is_active = true
    `, [id]);

    // Produtos mais caros
    const expensiveProducts = await query(`
      SELECT name, model, price, condition
      FROM products
      WHERE supplier_id = $1 AND is_active = true
      ORDER BY price DESC
      LIMIT 5
    `, [id]);

    // Produtos mais baratos
    const cheapProducts = await query(`
      SELECT name, model, price, condition
      FROM products
      WHERE supplier_id = $1 AND is_active = true
      ORDER BY price ASC
      LIMIT 5
    `, [id]);

    // Variação de preços nos últimos dias
    const priceVariation = await query(`
      SELECT 
        DATE(recorded_at) as date,
        AVG(price) as avg_price,
        COUNT(*) as price_updates
      FROM price_history
      WHERE supplier_id = $1 
      AND recorded_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(recorded_at)
      ORDER BY date DESC
    `, [id]);

    res.json({
      general_stats: statsResult.rows[0],
      expensive_products: expensiveProducts.rows,
      cheap_products: cheapProducts.rows,
      price_variation: priceVariation.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do fornecedor:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar lista bruta do fornecedor do dia atual
router.get('/:id/raw-list', authenticateToken, requireSubscription('active'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Calcular início do dia (00h)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayISO = today.toISOString();

    // Buscar lista bruta do fornecedor processada hoje
    const rawListResult = await query(`
      SELECT raw_list_text, processed_at
      FROM supplier_raw_lists
      WHERE supplier_id = $1
        AND processed_at >= $2
      ORDER BY processed_at DESC
      LIMIT 1
    `, [id, todayISO]);

    // Se houver lista bruta, retornar
    if (rawListResult.rows.length > 0) {
      return res.json({
        raw_list_text: rawListResult.rows[0].raw_list_text,
        processed_at: rawListResult.rows[0].processed_at,
        has_list: true
      });
    }

    // Se não houver lista bruta, verificar se há produtos processados hoje
    // Se houver, gerar uma lista reconstruída baseada nos produtos
    const productsResult = await query(`
      SELECT p.name, p.model, p.color, p.storage, p.condition, p.price, p.updated_at
      FROM products p
      WHERE p.supplier_id = $1
        AND DATE(p.updated_at) = CURRENT_DATE
        AND p.is_active = true
      ORDER BY p.updated_at DESC
    `, [id]);

    if (productsResult.rows.length === 0) {
      return res.status(404).json({ 
        message: 'Fornecedor ainda não mandou a lista do dia',
        has_list: false
      });
    }

    // Gerar lista reconstruída baseada nos produtos
    const reconstructedList = productsResult.rows.map((product, index) => {
      const parts = [];
      parts.push(`📱 ${product.name || 'iPhone'}`);
      if (product.model) parts.push(product.model);
      if (product.storage) parts.push(product.storage);
      if (product.color) parts.push(`🎨 ${product.color}`);
      if (product.condition) parts.push(`(${product.condition})`);
      if (product.price) parts.push(`💰 R$ ${parseFloat(product.price).toFixed(2)}`);
      return parts.join(' ');
    }).join('\n');

    // Adicionar cabeçalho
    const supplierInfo = await query('SELECT name FROM suppliers WHERE id = $1', [id]);
    const supplierName = supplierInfo.rows[0]?.name || 'Fornecedor';
    
    const fullReconstructedList = `📋 LISTA RECONSTRUÍDA - ${supplierName.toUpperCase()}\n` +
      `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n` +
      `📊 Total de produtos: ${productsResult.rows.length}\n\n` +
      `═══════════════════════════════════════\n\n` +
      reconstructedList;

    res.json({
      raw_list_text: fullReconstructedList,
      processed_at: productsResult.rows[0]?.updated_at || new Date().toISOString(),
      has_list: true,
      is_reconstructed: true
    });

  } catch (error) {
    console.error('Erro ao buscar lista bruta:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;




