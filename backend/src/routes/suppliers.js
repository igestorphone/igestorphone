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
    // SEMPRE reset à meia-noite (00h) horário de São Paulo, Brasil
    // Usar timezone do Brasil para calcular o início do dia
    const dayStartResult = await query(`
      SELECT DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))::timestamp as day_start_brasil
    `);
    const dayStartTimestamp = new Date(dayStartResult.rows[0].day_start_brasil);
    
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

    // Buscar números de WhatsApp do fornecedor
    const whatsappNumbersResult = await query(`
      SELECT id, phone_number, is_primary, description, created_at
      FROM supplier_whatsapp_numbers
      WHERE supplier_id = $1
      ORDER BY is_primary DESC, created_at ASC
    `, [id]);

    // Buscar número principal (ou primeiro número, ou número antigo do campo whatsapp)
    const primaryWhatsappResult = await query(`
      SELECT phone_number
      FROM supplier_whatsapp_numbers
      WHERE supplier_id = $1 AND is_primary = true
      LIMIT 1
    `, [id]);

    const primaryWhatsapp = primaryWhatsappResult.rows[0]?.phone_number || supplier.whatsapp || null;

    // Buscar produtos do fornecedor
    const productsResult = await query(`
      SELECT id, name, model, price, stock_quantity, condition, created_at
      FROM products
      WHERE supplier_id = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT 10
    `, [id]);

    res.json({
      supplier: {
        ...supplier,
        whatsapp: primaryWhatsapp, // Número principal para compatibilidade
        whatsapp_numbers: whatsappNumbersResult.rows,
        primary_whatsapp: primaryWhatsapp
      },
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
  body('whatsapp_numbers').optional().isArray(),
  body('whatsapp_numbers.*.phone_number').optional().trim(),
  body('whatsapp_numbers.*.is_primary').optional().isBoolean(),
  body('whatsapp_numbers.*.description').optional().trim(),
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
      whatsapp_numbers,
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

    // Inserir números de WhatsApp se fornecidos
    if (whatsapp_numbers && Array.isArray(whatsapp_numbers) && whatsapp_numbers.length > 0) {
      // Primeiro, desmarcar todos como não primários se houver algum marcado como primário
      let hasPrimary = whatsapp_numbers.some(n => n.is_primary === true);
      
      for (const whatsappNumber of whatsapp_numbers) {
        if (whatsappNumber.phone_number) {
          try {
            await query(`
              INSERT INTO supplier_whatsapp_numbers (supplier_id, phone_number, is_primary, description)
              VALUES ($1, $2, $3, $4)
            `, [
              supplier.id,
              whatsappNumber.phone_number.trim(),
              whatsappNumber.is_primary === true,
              whatsappNumber.description || null
            ]);
          } catch (error) {
            console.error(`Erro ao inserir número ${whatsappNumber.phone_number}:`, error.message);
          }
        }
      }
      
      // Se nenhum foi marcado como primário, marcar o primeiro como primário
      if (!hasPrimary && whatsapp_numbers[0]?.phone_number) {
        await query(`
          UPDATE supplier_whatsapp_numbers 
          SET is_primary = true 
          WHERE supplier_id = $1 AND phone_number = $2
        `, [supplier.id, whatsapp_numbers[0].phone_number.trim()]);
      }
    } else if (whatsapp) {
      // Se não foram fornecidos números, mas há whatsapp no campo antigo, criar registro
      await query(`
        INSERT INTO supplier_whatsapp_numbers (supplier_id, phone_number, is_primary)
        VALUES ($1, $2, true)
        ON CONFLICT (supplier_id, phone_number) DO NOTHING
      `, [supplier.id, whatsapp]);
    }

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

    // Buscar números cadastrados para retornar
    const whatsappNumbersResult = await query(`
      SELECT id, phone_number, is_primary, description, created_at
      FROM supplier_whatsapp_numbers
      WHERE supplier_id = $1
      ORDER BY is_primary DESC, created_at ASC
    `, [supplier.id]);

    const primaryWhatsappResult = await query(`
      SELECT phone_number
      FROM supplier_whatsapp_numbers
      WHERE supplier_id = $1 AND is_primary = true
      LIMIT 1
    `, [supplier.id]);

    const primaryWhatsapp = primaryWhatsappResult.rows[0]?.phone_number || supplier.whatsapp || null;

    res.status(201).json({
      message: 'Fornecedor criado com sucesso',
      supplier: {
        ...supplier,
        whatsapp: primaryWhatsapp,
        whatsapp_numbers: whatsappNumbersResult.rows,
        primary_whatsapp: primaryWhatsapp
      }
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
  body('whatsapp_numbers').optional().isArray(),
  body('whatsapp_numbers.*.phone_number').optional().trim(),
  body('whatsapp_numbers.*.is_primary').optional().isBoolean(),
  body('whatsapp_numbers.*.description').optional().trim(),
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
    const updates = { ...req.body };
    const whatsappNumbers = updates.whatsapp_numbers;
    delete updates.whatsapp_numbers; // Remover do updates para não tentar atualizar campo inexistente

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

    if (fieldsToUpdate.length > 0) {
      values.push(id);
      const queryText = `UPDATE suppliers SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      await query(queryText, values);
    }

    // Atualizar números de WhatsApp se fornecidos
    if (whatsappNumbers !== undefined) {
      if (Array.isArray(whatsappNumbers)) {
        // Remover todos os números existentes
        await query('DELETE FROM supplier_whatsapp_numbers WHERE supplier_id = $1', [id]);
        
        // Inserir novos números
        if (whatsappNumbers.length > 0) {
          let hasPrimary = whatsappNumbers.some(n => n.is_primary === true);
          
          for (const whatsappNumber of whatsappNumbers) {
            if (whatsappNumber.phone_number) {
              try {
                await query(`
                  INSERT INTO supplier_whatsapp_numbers (supplier_id, phone_number, is_primary, description)
                  VALUES ($1, $2, $3, $4)
                `, [
                  id,
                  whatsappNumber.phone_number.trim(),
                  whatsappNumber.is_primary === true,
                  whatsappNumber.description || null
                ]);
              } catch (error) {
                console.error(`Erro ao inserir número ${whatsappNumber.phone_number}:`, error.message);
              }
            }
          }
          
          // Se nenhum foi marcado como primário, marcar o primeiro como primário
          if (!hasPrimary && whatsappNumbers[0]?.phone_number) {
            await query(`
              UPDATE supplier_whatsapp_numbers 
              SET is_primary = true 
              WHERE supplier_id = $1 AND phone_number = $2
            `, [id, whatsappNumbers[0].phone_number.trim()]);
          }
        }
      }
    }

    // Buscar fornecedor atualizado
    const result = await query('SELECT * FROM suppliers WHERE id = $1', [id]);
    const supplier = result.rows[0];

    // Buscar números cadastrados
    const whatsappNumbersResult = await query(`
      SELECT id, phone_number, is_primary, description, created_at
      FROM supplier_whatsapp_numbers
      WHERE supplier_id = $1
      ORDER BY is_primary DESC, created_at ASC
    `, [id]);

    const primaryWhatsappResult = await query(`
      SELECT phone_number
      FROM supplier_whatsapp_numbers
      WHERE supplier_id = $1 AND is_primary = true
      LIMIT 1
    `, [id]);

    const primaryWhatsapp = primaryWhatsappResult.rows[0]?.phone_number || supplier.whatsapp || null;

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
      supplier: {
        ...supplier,
        whatsapp: primaryWhatsapp,
        whatsapp_numbers: whatsappNumbersResult.rows,
        primary_whatsapp: primaryWhatsapp
      }
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
    
    // Calcular início do dia (00h) horário de São Paulo, Brasil
    const todayResult = await query(`
      SELECT DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))::timestamp as today_brasil
    `);
    const todayISO = new Date(todayResult.rows[0].today_brasil).toISOString();

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
        AND DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
            DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
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




