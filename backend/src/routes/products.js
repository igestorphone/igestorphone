import express from 'express';
import { body, validationResult, query as queryValidator } from 'express-validator';
import { query } from '../config/database.js';
import { requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// Buscar produtos com filtros
router.get('/', [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 1000 }), // Aumentar limite para 1000
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
  queryValidator('color').optional().trim(), // Adicionar validação para color
  queryValidator('storage').optional().trim(), // Adicionar validação para storage
  queryValidator('date').optional().trim(), // Adicionar validação para date (YYYY-MM-DD)
  queryValidator('sort_by').optional().isIn(['name', 'price', 'created_at']),
  queryValidator('sort_order').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    console.log('📥 GET /api/produtos - Query params:', req.query);
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
      date,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = req.query;

    // Limpar valores vazios
    const cleanSupplierId = supplier_id === '' || supplier_id === undefined || supplier_id === null ? null : supplier_id;
    const cleanCondition = condition === '' || condition === undefined || condition === null ? null : condition;
    const cleanDate = date === '' || date === undefined || date === null ? null : date;

    const offset = (page - 1) * limit;

    // Construir query dinamicamente
    let whereClause = 'WHERE p.is_active = true AND s.is_active = true';
    const values = [];
    let paramCount = 1;

    if (search) {
      const trimmedSearch = search.trim();
      const endsWithSpace = search.endsWith(' ');
      const searchLower = trimmedSearch.toLowerCase();
      
      if (endsWithSpace) {
        // Se termina com espaço, fazer busca mais ampla (incluir Pro, Max, etc)
        whereClause += ` AND (LOWER(p.name) LIKE $${paramCount} OR LOWER(p.model) LIKE $${paramCount})`;
        values.push(`${searchLower}%`);
        paramCount++;
      } else {
        // Busca precisa: quando busca "iPhone 17", deve encontrar APENAS "iPhone 17"
        // Não deve encontrar "iPhone 17 Pro", "iPhone 17 Pro Max", etc.
        const searchParts = searchLower.split(/\s+/);
        
        // Se a busca contém "iphone", OBRIGATORIAMENTE o produto deve ter "iphone" no nome
        if (searchParts.includes('iphone')) {
          const otherParts = searchParts.filter(p => p !== 'iphone');
          
          if (otherParts.length > 0) {
            // OBRIGATÓRIO: name deve conter "iphone"
            whereClause += ` AND LOWER(p.name) LIKE $${paramCount}`;
            values.push(`%iphone%`);
            paramCount++;
            
            // Lista de variantes que podem aparecer após o modelo
            // Ordem importa: variantes que vêm depois de outras (ex: "Max" depois de "Pro")
            const variants = ['plus', 'mini', 'air', 'se', 'xs', 'xr', 'e', 'pro', 'max', 'promax', '3g', '3gs', '4s', '5c', '5s', '6s', '8', 'x'];
            
            // Construir padrão de busca exata baseado no que foi digitado
            const searchModel = otherParts.join(' '); // Ex: "17", "17 pro", "se", "x", etc
            const escapedModel = searchModel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // Verificar se a última parte é uma variante conhecida
            const lastPart = otherParts[otherParts.length - 1].toLowerCase();
            const isLastPartVariant = variants.includes(lastPart);
            
            // Se a última parte NÃO é uma variante, então estamos buscando um modelo base
            // e não devemos retornar variantes desse modelo
            if (!isLastPartVariant) {
              // Busca exata: o nome OU modelo deve conter o modelo buscado (sem variantes após)
              // Buscar tanto no campo name quanto no model, pois alguns produtos têm name="iPhone" e model="iPhone 17 Pro Max 512 GB"
              // Para produtos com model completo (ex: "iPhone 17 Pro Max 512 GB"), o modelo deve conter "iphone 17" mas não "iphone 17 pro"
              const exactPattern = `^iphone ${escapedModel}$`;
              const exactPatternWithSpace = `^iphone ${escapedModel}\\s`; // Para modelos completos como "iPhone 17 256GB"
              // Excluir variantes conhecidas (Pro, Max, Plus, Mini, Air, SE, E, etc) após o modelo
              // Exemplo: "iPhone 16" não deve retornar "iPhone 16e", "iPhone 16 Pro", etc
              const excludeVariants = ['pro', 'max', 'promax', 'plus', 'mini', 'air', 'se', 'xs', 'xr', 'e', '\\be\\b', '\\bE\\b'];
              const excludePattern = `iphone ${escapedModel}\\s+(${excludeVariants.join('|')})`;
              
              // Para o campo name (normalmente só "iPhone"), buscar exato
              // Para o campo model (pode ter "iPhone 17 256GB" ou "iPhone 17 Pro Max 512 GB"), buscar se começa com o padrão
              // IMPORTANTE: Excluir variantes como "e", "E", "Pro", "Max", etc após o número
              whereClause += ` AND (
                (LOWER(p.name) ~* $${paramCount} AND NOT (LOWER(p.name) ~* $${paramCount + 1}))
                OR (LOWER(p.model) ~* $${paramCount} AND NOT (LOWER(p.model) ~* $${paramCount + 1}))
                OR (LOWER(p.model) ~* $${paramCount + 2} AND NOT (LOWER(p.model) ~* $${paramCount + 1}))
                OR (LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount} AND NOT (LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount + 1}))
              )`;
              values.push(exactPattern);
              values.push(excludePattern);
              values.push(exactPatternWithSpace);
              paramCount += 3;
            } else {
              // Se a última parte É uma variante, buscar por todas as partes exatamente
              // Ex: "iPhone 17 Pro" deve encontrar "iPhone 17 Pro" mas não "iPhone 17 Pro Max"
              // Ex: "iPhone 17 Pro Max" deve encontrar "iPhone 17 Pro Max 512 GB", "iPhone 17 Pro Max 2TB", etc
              const exactPattern = `^iphone ${escapedModel}$`;
              // Padrão que permite informações adicionais após (como "512 GB", "2TB", etc)
              const patternWithExtras = `^iphone ${escapedModel}(\\s|$|\\s+[0-9]|\\s+[a-z])`;
              
              // Variantes que podem vir depois da última parte
              // Ex: se busca "Pro", não deve retornar "Pro Max"
              const variantsAfterPro = ['max', 'promax'];
              const variantsAfterPlus = [];
              const variantsAfterMini = [];
              const variantsAfterSE = [];
              const variantsAfterXS = ['max'];
              
              let variantsAfter = [];
              if (lastPart === 'pro') {
                variantsAfter = variantsAfterPro;
              } else if (lastPart === 'plus') {
                variantsAfter = variantsAfterPlus;
              } else if (lastPart === 'mini') {
                variantsAfter = variantsAfterMini;
              } else if (lastPart === 'se') {
                variantsAfter = variantsAfterSE;
              } else if (lastPart === 'xs') {
                variantsAfter = variantsAfterXS;
              }
              
              if (variantsAfter.length > 0) {
                // Excluir variantes que vêm depois (ex: "Pro Max" após "Pro")
                const excludeVariants = variantsAfter.join('|');
                const excludePattern = `iphone ${escapedModel}\\s+(${excludeVariants})`;
                
                // Buscar produtos que começam com o padrão (permite "iPhone 17 Pro Max 512 GB", "iPhone 17 Pro Max 2TB", etc)
                whereClause += ` AND (
                  (LOWER(p.name) ~* $${paramCount} AND NOT (LOWER(p.name) ~* $${paramCount + 1}))
                  OR (LOWER(p.model) ~* $${paramCount} AND NOT (LOWER(p.model) ~* $${paramCount + 1}))
                  OR (LOWER(p.model) ~* $${paramCount + 2} AND NOT (LOWER(p.model) ~* $${paramCount + 1}))
                  OR (LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount} AND NOT (LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount + 1}))
                  OR (LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount + 2} AND NOT (LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount + 1}))
                )`;
                values.push(exactPattern);
                values.push(excludePattern);
                values.push(patternWithExtras);
                paramCount += 3;
              } else {
                // Não há variantes depois, buscar exato ou com informações adicionais
                whereClause += ` AND (
                  LOWER(p.name) ~* $${paramCount}
                  OR LOWER(p.model) ~* $${paramCount}
                  OR LOWER(p.model) ~* $${paramCount + 1}
                  OR LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount}
                  OR LOWER(CONCAT(p.name, ' ', p.model)) ~* $${paramCount + 1}
                )`;
                values.push(exactPattern);
                values.push(patternWithExtras);
                paramCount += 2;
              }
            }
          } else {
            // Se só tem "iphone", buscar apenas "iPhone" (sem números ou letras após)
            // Excluir todos os modelos numerados ou com letras
            // O nome deve ser exatamente "iPhone" (sem espaço após)
            whereClause += ` AND LOWER(p.name) = $${paramCount}`;
            values.push('iphone');
            paramCount++;
          }
        } else {
          // Se não tem "iphone", buscar no nome ou modelo
          whereClause += ` AND (
            LOWER(p.name) LIKE $${paramCount} 
            OR LOWER(p.model) LIKE $${paramCount}
            OR LOWER(CONCAT(p.name, ' ', p.model)) LIKE $${paramCount}
          )`;
          values.push(`%${searchLower}%`);
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

    // Filtro de data: se não especificado, mostrar apenas produtos do dia atual
    // Se especificado, mostrar produtos daquela data específica
    if (cleanDate) {
      // Filtrar por data específica (formato YYYY-MM-DD)
      whereClause += ` AND DATE(p.updated_at) = $${paramCount}`;
      values.push(cleanDate);
      paramCount++;
    } else {
      // Por padrão, mostrar apenas produtos atualizados hoje
      whereClause += ` AND DATE(p.updated_at) = CURRENT_DATE`;
    }

    // Buscar produtos
    const productsResult = await query(`
      SELECT p.*, s.name as supplier_name, s.contact_email as supplier_email, s.whatsapp as whatsapp
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
      SELECT p.*, s.name as supplier_name, s.contact_email, s.contact_phone, s.website, s.whatsapp as whatsapp
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







