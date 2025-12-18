import express from 'express';
import { body, validationResult, query as queryValidator } from 'express-validator';
import { query } from '../config/database.js';
import { requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Buscar produtos com filtros
router.get('/', [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 10000 }), // Limite aumentado para 10.000 produtos
  queryValidator('search').optional().trim(),
  queryValidator('supplier_id').optional().custom((value) => {
    // Aceitar string vazia ou número inteiro
    if (value === '' || value === undefined || value === null) return true;
    return !isNaN(parseInt(value));
  }),
  queryValidator('min_price').optional().isFloat({ min: 0 }),
  queryValidator('max_price').optional().isFloat({ min: 0 }),
  queryValidator('condition').optional().custom((value) => {
    // Aceitar string vazia ou valor válido
    if (value === '' || value === undefined || value === null) return true;
    return ['Novo', 'Seminovo', 'Usado', 'Recondicionado'].includes(value);
  }),
  queryValidator('condition_type').optional().custom((value) => {
    // Aceitar string vazia ou valor válido para filtrar por tipo de condição
    // "lacrados_novos" = LACRADO, NOVO, CPO
    // "seminovos" = SWAP, VITRINE, SEMINOVO
    if (value === '' || value === undefined || value === null) return true;
    return ['lacrados_novos', 'seminovos'].includes(value);
  }),
  queryValidator('color').optional().trim(), // Adicionar validação para color
  queryValidator('storage').optional().trim(), // Adicionar validação para storage
  queryValidator('date').optional().trim(), // Adicionar validação para date (YYYY-MM-DD)
  queryValidator('sort_by').optional().isIn(['name', 'price', 'created_at']),
  queryValidator('sort_order').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    console.log('📥 GET /api/produtos - Query params:', req.query);
    console.log('📅 Data de hoje no Brasil:', new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Erros de validação:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      search = '',
      supplier_id,
      min_price,
      max_price,
      condition,
      condition_type,
      date,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Limpar valores vazios
    const cleanSupplierId = supplier_id === '' || supplier_id === undefined || supplier_id === null ? null : supplier_id;
    const cleanCondition = condition === '' || condition === undefined || condition === null ? null : condition;
    const cleanConditionType = condition_type === '' || condition_type === undefined || condition_type === null ? null : condition_type;
    const cleanDate = date === '' || date === undefined || date === null ? null : date;

    const offset = (page - 1) * limit;

    // Construir query dinamicamente
    // Filtrar produtos com preço 0 ou NULL (produtos inválidos)
    let whereClause = 'WHERE p.is_active = true AND s.is_active = true AND (p.price > 0 AND p.price IS NOT NULL)';
    const values = [];
    let paramCount = 1;

    if (search) {
      const trimmedSearch = search.trim();
      const searchLower = trimmedSearch.toLowerCase();
      
      // Se busca tem mais de uma palavra, fazer busca específica (ex: "iphone 16", "iphone 15 pro")
      // Se busca é genérica (uma palavra só), fazer busca ampla
      const searchWords = searchLower.split(/\s+/).filter(w => w.length > 0);
      const hasMultipleWords = searchWords.length > 1;
      
      if (hasMultipleWords) {
        // Busca específica e precisa: detectar variantes para evitar resultados incorretos
        // Ex: "iphone 17 pro" não deve mostrar "iphone 17 pro max"
        
        // Detectar se busca contém "pro" mas não "max"
        const hasPro = searchWords.includes('pro');
        const hasMax = searchWords.includes('max');
        const hasPlus = searchWords.includes('plus');
        
        // Construir busca precisa
        // Buscar o termo completo no name ou model
        whereClause += ` AND (
          LOWER(p.name) LIKE $${paramCount} 
          OR LOWER(p.model) LIKE $${paramCount}
          OR LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) LIKE $${paramCount}
        )`;
        values.push(`%${searchLower}%`);
        paramCount++;
        
        // Se busca "pro" sem "max", excluir resultados com "max"
        if (hasPro && !hasMax) {
          whereClause += ` AND (
            LOWER(p.name) NOT LIKE '%max%'
            AND LOWER(p.model) NOT LIKE '%max%'
            AND LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) NOT LIKE '%max%'
          )`;
        }
        
        // Se busca "pro" e "max", garantir que ambos estejam presentes
        if (hasPro && hasMax) {
          whereClause += ` AND (
            LOWER(p.name) LIKE '%max%'
            OR LOWER(p.model) LIKE '%max%'
            OR LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) LIKE '%max%'
          )`;
        }
        
        // Se busca tem "plus" mas não "pro", excluir "pro" e "max"
        if (hasPlus && !hasPro) {
          whereClause += ` AND (
            LOWER(p.name) NOT LIKE '%pro%'
            AND LOWER(p.model) NOT LIKE '%pro%'
            AND LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) NOT LIKE '%pro%'
            AND LOWER(p.name) NOT LIKE '%max%'
            AND LOWER(p.model) NOT LIKE '%max%'
            AND LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) NOT LIKE '%max%'
          )`;
        }
        
        // Se busca tem número (ex: "17"), garantir que não mostre modelos diferentes
        // Ex: "iphone 17" não deve mostrar "iphone 16"
        const numberMatch = searchLower.match(/(\d+)/);
        if (numberMatch) {
          const number = numberMatch[1];
          // Garantir que o número esteja presente
          whereClause += ` AND (
            LOWER(p.name) LIKE $${paramCount}
            OR LOWER(p.model) LIKE $${paramCount}
            OR LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) LIKE $${paramCount}
          )`;
          values.push(`%${number}%`);
          paramCount++;
        }
      } else {
        // Busca genérica de uma palavra: identificar tipo de produto
        let searchPattern = '';
        
        // Mapear termos de busca parciais para produtos Apple
        if (searchLower === 'i' || searchLower === 'ip' || searchLower.startsWith('iphone') || searchLower.startsWith('ipho')) {
          // Buscar iPhone (aceita: i, ip, iph, ipho, iphon, iphone, iPhone, etc)
          searchPattern = '%iphone%';
        } else if (searchLower.startsWith('mac')) {
          // Buscar MacBook (aceita: mac, macb, macbo, macboo, macbook, MacBook, etc)
          searchPattern = '%macbook%';
        } else if (searchLower === 'ipad') {
          // Buscar iPad (aceita: ipad, iPad, etc)
          searchPattern = '%ipad%';
        } else if (searchLower.startsWith('airpod')) {
          // Buscar AirPods (aceita: airpod, airpods, AirPods, etc)
          searchPattern = '%airpod%';
        } else if (searchLower.includes('watch')) {
          // Buscar Apple Watch (aceita: watch, apple watch, etc)
          searchPattern = '%watch%';
        } else {
          // Busca genérica: usar o termo como está (case-insensitive, parcial)
          searchPattern = `%${searchLower}%`;
        }
        
        // Aplicar busca em name e model
        whereClause += ` AND (
          LOWER(p.name) LIKE $${paramCount} 
          OR LOWER(p.model) LIKE $${paramCount}
          OR LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) LIKE $${paramCount}
        )`;
        values.push(searchPattern);
        paramCount++;
        
        // Se busca é apenas "i" ou "ip", buscar também iPad
        if (searchLower === 'i' || searchLower === 'ip') {
          whereClause += ` OR (
            LOWER(p.name) LIKE $${paramCount} 
            OR LOWER(p.model) LIKE $${paramCount}
            OR LOWER(CONCAT(p.name, ' ', COALESCE(p.model, ''))) LIKE $${paramCount}
          )`;
          values.push('%ipad%');
          paramCount++;
        }
      }
    }

    if (cleanSupplierId) {
      whereClause += ` AND p.supplier_id = $${paramCount}`;
      values.push(cleanSupplierId);
      paramCount++;
    }

    if (min_price) {
      whereClause += ` AND p.price >= $${paramCount}`;
      values.push(min_price);
      paramCount++;
    }

    if (max_price) {
      whereClause += ` AND p.price <= $${paramCount}`;
      values.push(max_price);
      paramCount++;
    }

    if (cleanCondition) {
      whereClause += ` AND p.condition = $${paramCount}`;
      values.push(cleanCondition);
      paramCount++;
    }

    // Filtro por tipo de condição (lacrados_novos ou seminovos)
    if (cleanConditionType) {
      if (cleanConditionType === 'lacrados_novos') {
        // Filtrar produtos com condition_detail = LACRADO, NOVO, CPO ou condition = Novo sem condition_detail específico
        whereClause += ` AND (
          p.condition_detail IN ('LACRADO', 'NOVO', 'CPO')
          OR (p.condition = 'Novo' AND (p.condition_detail IS NULL OR p.condition_detail = ''))
        )`;
      } else if (cleanConditionType === 'seminovos') {
        // Filtrar produtos com condition_detail = SWAP, VITRINE, SEMINOVO ou condition = Seminovo sem condition_detail específico
        whereClause += ` AND (
          p.condition_detail IN ('SWAP', 'VITRINE', 'SEMINOVO', 'SEMINOVO PREMIUM', 'SEMINOVO AMERICANO', 'NON ACTIVE', 'ASIS', 'ASIS+', 'AS IS PLUS')
          OR (p.condition = 'Seminovo' AND (p.condition_detail IS NULL OR p.condition_detail = ''))
        )`;
      }
    }

    // Adicionar filtros adicionais se necessário
    if (req.query.color) {
      whereClause += ` AND p.color ILIKE $${paramCount}`;
      values.push(`%${req.query.color}%`);
      paramCount++;
    }

    if (req.query.storage) {
      whereClause += ` AND p.storage = $${paramCount}`;
      values.push(req.query.storage);
      paramCount++;
    }

    // Filtro de data: se especificado, mostrar produtos daquela data específica
    // Se não especificado, mostrar produtos de HOJE (corrigido para não zerar às 20h)
    if (cleanDate) {
      // Filtrar por data específica (formato YYYY-MM-DD)
      // Considerar tanto updated_at quanto created_at
      // Converter para timezone do Brasil ao comparar
      whereClause += ` AND (
        DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $${paramCount}::date
        OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = $${paramCount}::date
      )`;
      values.push(cleanDate);
      paramCount++;
    } else {
      // Por padrão, mostrar APENAS produtos de HOJE no timezone do Brasil
      // Sem fallback - após a meia-noite, produtos antigos não devem aparecer
      const todayBrasil = `DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))`;
      whereClause += ` AND (
        DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = ${todayBrasil}
        OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = ${todayBrasil}
      )`;
      console.log('📊 Filtro aplicado: produtos APENAS de HOJE no timezone do Brasil');
    }

    // Buscar produtos
    const productsResult = await query(`
      SELECT p.*, s.name as supplier_name, s.contact_email as supplier_email,
             COALESCE(
               (SELECT phone_number FROM supplier_whatsapp_numbers WHERE supplier_id = s.id AND is_primary = true LIMIT 1),
               s.whatsapp
             ) as whatsapp
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.${sort_by} ${sort_order.toUpperCase()}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...values, limit, offset]);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
    `, values);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    console.log(`📊 Total de produtos encontrados: ${total} (página ${page} de ${totalPages})`);

    res.json({
      products: productsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar produto por ID
// Buscar histórico de preços dos últimos 2 dias
router.get('/price-history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await query(`
      SELECT 
        ph.price,
        ph.recorded_at,
        DATE(ph.recorded_at) as date,
        TO_CHAR(ph.recorded_at, 'DD/MM') as date_formatted
      FROM price_history ph
      WHERE ph.product_id = $1
        AND ph.recorded_at >= NOW() - INTERVAL '2 days'
      ORDER BY ph.recorded_at DESC
    `, [productId]);

    // Agrupar por data (última entrada de cada dia)
    const pricesByDate = {};
    result.rows.forEach((row) => {
      const date = row.date_formatted;
      if (!pricesByDate[date] || new Date(row.recorded_at) > new Date(pricesByDate[date].recorded_at)) {
        pricesByDate[date] = {
          price: parseFloat(row.price),
          date: row.date_formatted,
          recorded_at: row.recorded_at
        };
      }
    });

    res.json({
      prices: Object.values(pricesByDate).sort((a, b) => 
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      )
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de preços:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar histórico de preços por modelo (últimos 2 dias)
router.get('/price-history-by-model', [
  queryValidator('model').notEmpty().trim(),
  queryValidator('storage').optional().trim(),
  queryValidator('color').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { model, storage, color } = req.query;

    let whereClause = 'WHERE p.model ILIKE $1 AND ph.recorded_at >= NOW() - INTERVAL \'2 days\'';
    const values = [`%${model}%`];
    let paramCount = 2;

    if (storage) {
      whereClause += ` AND p.storage = $${paramCount}`;
      values.push(storage);
      paramCount++;
    }

    if (color) {
      whereClause += ` AND p.color ILIKE $${paramCount}`;
      values.push(`%${color}%`);
      paramCount++;
    }

    const result = await query(`
      SELECT 
        p.id,
        p.model,
        p.storage,
        p.color,
        p.supplier_id,
        s.name as supplier_name,
        ph.price,
        ph.recorded_at,
        DATE(ph.recorded_at) as date,
        TO_CHAR(ph.recorded_at, 'DD/MM') as date_formatted
      FROM price_history ph
      JOIN products p ON ph.product_id = p.id
      JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY ph.recorded_at DESC
    `, values);

    // Agrupar por produto e data
    const pricesByProduct = {};
    result.rows.forEach((row) => {
      const key = `${row.id}_${row.date}`;
      if (!pricesByProduct[key] || new Date(row.recorded_at) > new Date(pricesByProduct[key].recorded_at)) {
        pricesByProduct[key] = {
          product_id: row.id,
          model: row.model,
          storage: row.storage,
          color: row.color,
          supplier_name: row.supplier_name,
          price: parseFloat(row.price),
          date: row.date_formatted,
          recorded_at: row.recorded_at
        };
      }
    });

    // Agrupar por data para mostrar evolução
    const pricesByDate = {};
    Object.values(pricesByProduct).forEach((item) => {
      if (!pricesByDate[item.date]) {
        pricesByDate[item.date] = [];
      }
      pricesByDate[item.date].push(item);
    });

    res.json({
      prices: Object.entries(pricesByDate).map(([date, items]) => ({
        date,
        items: items.sort((a, b) => a.price - b.price)
      })).sort((a, b) => {
        const dateA = new Date((a.items && a.items[0] && a.items[0].recorded_at) || 0);
        const dateB = new Date((b.items && b.items[0] && b.items[0].recorded_at) || 0);
        return dateB.getTime() - dateA.getTime();
      })
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de preços por modelo:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT p.*, s.name as supplier_name, s.contact_email, s.contact_phone, s.website,
             COALESCE(
               (SELECT phone_number FROM supplier_whatsapp_numbers WHERE supplier_id = s.id AND is_primary = true LIMIT 1),
               s.whatsapp
             ) as whatsapp
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1 AND p.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const product = result.rows[0];

    // Buscar histórico de preços dos últimos 30 dias
    const priceHistoryResult = await query(`
      SELECT price, recorded_at
      FROM price_history
      WHERE product_id = $1
      AND recorded_at >= NOW() - INTERVAL '30 days'
      ORDER BY recorded_at DESC
    `, [id]);

    res.json({
      product,
      price_history: priceHistoryResult.rows
    });

  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar produto (apenas usuários com assinatura ativa)
router.post('/', requireSubscription('active'), [
  body('supplier_id').isInt(),
  body('name').trim().isLength({ min: 1 }),
  body('model').optional().trim(),
  body('color').optional().trim(),
  body('storage').optional().trim(),
  body('condition').isIn(['Novo', 'Seminovo', 'Usado']),
  body('price').isFloat({ min: 0 }),
  body('stock_quantity').isInt({ min: 0 }),
  body('sku').optional().trim(),
  body('image_url').optional().isURL(),
  body('specifications').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      supplier_id,
      name,
      model,
      color,
      storage,
      condition,
      price,
      stock_quantity,
      sku,
      image_url,
      specifications
    } = req.body;

    // Verificar se fornecedor existe
    const supplierResult = await query('SELECT id FROM suppliers WHERE id = $1 AND is_active = true', [supplier_id]);
    if (supplierResult.rows.length === 0) {
      return res.status(400).json({ message: 'Fornecedor não encontrado' });
    }

    // Criar produto
    const result = await query(`
      INSERT INTO products (supplier_id, name, model, color, storage, condition, 
                           price, stock_quantity, sku, image_url, specifications)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      supplier_id,
      name,
      model,
      color,
      storage,
      condition,
      price,
      stock_quantity,
      sku,
      image_url,
      JSON.stringify(specifications || {})
    ]);

    const product = result.rows[0];

    // Criar entrada no histórico de preços
    await query(`
      INSERT INTO price_history (product_id, supplier_id, price)
      VALUES ($1, $2, $3)
    `, [product.id, supplier_id, price]);

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'product_created',
      JSON.stringify({ product_id: product.id, name: product.name }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.status(201).json({
      message: 'Produto criado com sucesso',
      product
    });

  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Atualizar produto
router.put('/:id', requireSubscription('active'), [
  body('name').optional().trim().isLength({ min: 1 }),
  body('model').optional().trim(),
  body('color').optional().trim(),
  body('storage').optional().trim(),
  body('condition').optional().isIn(['Novo', 'Seminovo', 'Usado']),
  body('price').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('sku').optional().trim(),
  body('image_url').optional().isURL(),
  body('specifications').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Verificar se produto existe
    const existingProduct = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    const currentProduct = existingProduct.rows[0];

    // Preparar campos para atualização
    const fieldsToUpdate = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'id') {
        if (key === 'specifications') {
          fieldsToUpdate.push(`${key} = $${paramCount}`);
          values.push(JSON.stringify(updates[key]));
        } else {
          fieldsToUpdate.push(`${key} = $${paramCount}`);
          values.push(updates[key]);
        }
        paramCount++;
      }
    });

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ message: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    const queryText = `UPDATE products SET ${fieldsToUpdate.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    
    const result = await query(queryText, values);
    const product = result.rows[0];

    // Se o preço mudou, adicionar ao histórico
    if (updates.price && updates.price !== currentProduct.price) {
      await query(`
        INSERT INTO price_history (product_id, supplier_id, price)
        VALUES ($1, $2, $3)
      `, [product.id, product.supplier_id, updates.price]);
    }

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'product_updated',
      JSON.stringify({ product_id: product.id, updated_fields: Object.keys(updates) }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({
      message: 'Produto atualizado com sucesso',
      product
    });

  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Deletar produto (soft delete)
router.delete('/:id', requireSubscription('active'), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se produto existe
    const existingProduct = await query('SELECT * FROM products WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Produto não encontrado' });
    }

    // Soft delete
    await query('UPDATE products SET is_active = false WHERE id = $1', [id]);

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'product_deleted',
      JSON.stringify({ product_id: id }),
      req.ip,
      req.get('User-Agent')
    ]);

    res.json({ message: 'Produto deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar produto:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Buscar produtos mais baratos
router.get('/search/cheapest', async (req, res) => {
  try {
    const { model, storage, condition } = req.query;

    if (!model) {
      return res.status(400).json({ message: 'Modelo é obrigatório' });
    }

    let whereClause = 'WHERE p.model ILIKE $1 AND p.is_active = true';
    const values = [`%${model}%`];
    let paramCount = 2;

    if (storage) {
      whereClause += ` AND p.storage = $${paramCount}`;
      values.push(storage);
      paramCount++;
    }

    if (condition) {
      whereClause += ` AND p.condition = $${paramCount}`;
      values.push(condition);
      paramCount++;
    }

    const result = await query(`
      SELECT p.*, s.name as supplier_name, s.contact_email, s.contact_phone
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      ${whereClause}
      ORDER BY p.price ASC
      LIMIT 10
    `, values);

    res.json({ products: result.rows });

  } catch (error) {
    console.error('Erro ao buscar produtos mais baratos:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

export default router;







