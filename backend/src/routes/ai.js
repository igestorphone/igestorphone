import express from 'express';
import { body, validationResult, query as queryValidator } from 'express-validator';
import aiService from '../services/aiService.js';
import aiDashboardService from '../services/aiDashboardService.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { normalizeColor } from '../utils/colorNormalizer.js';

const router = express.Router();

const detectVariant = (product) => {
  const combined = [
    product?.variant,
    product?.network,
    product?.notes,
    product?.model,
    product?.name,
    product?.additional_info,
    product?.description
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (!combined) return null;

  if (combined.includes('anatel')) return 'ANATEL';
  if (combined.includes('e-sim') || combined.includes('esim') || combined.includes('e sim')) return 'E-SIM';
  if (
    combined.includes('chip físico') ||
    combined.includes('chip fisico') ||
    combined.includes('chip fisco') ||
    combined.includes('1 chip') ||
    combined.includes('01 chip') ||
    combined.includes('2 chip') ||
    combined.includes('02 chip')
  )
    return 'CHIP FÍSICO';
  if (combined.includes('chip virtual')) return 'CHIP VIRTUAL';
  if (combined.includes('chin')) return 'CHINÊS';
  if (combined.includes('jap')) return 'JAPONÊS';
  if (combined.includes('indi')) return 'INDIANO';
  if (combined.includes('usa') || combined.includes('americano')) return 'AMERICANO';
  if (combined.includes('dubai')) return 'DUBAI';
  if (combined.includes('cpo')) return 'CPO';

  return product?.variant ? product.variant.toString().toUpperCase() : null;
};

// Validação de lista de produtos com IA
router.post('/validate-list', authenticateToken, requireSubscription('active'), async (req, res) => {
  try {
    const { rawListText, products, list_type: listType } = req.body;

    // Validar que pelo menos um dos dois foi enviado
    if (!rawListText && (!products || !Array.isArray(products) || products.length === 0)) {
      return res.status(400).json({ 
        message: 'Lista de produtos é obrigatória',
        errors: [{ 
          type: 'field', 
          msg: 'É necessário fornecer rawListText (string) ou products (array)', 
          path: 'rawListText', 
          location: 'body' 
        }]
      });
    }

    // Validar formato se fornecido
    if (rawListText && typeof rawListText !== 'string') {
      return res.status(400).json({ 
        message: 'rawListText deve ser uma string',
        errors: [{ 
          type: 'field', 
          msg: 'rawListText deve ser uma string', 
          path: 'rawListText', 
          location: 'body' 
        }]
      });
    }

    if (products && !Array.isArray(products)) {
      return res.status(400).json({ 
        message: 'products deve ser um array',
        errors: [{ 
          type: 'field', 
          msg: 'products deve ser um array', 
          path: 'products', 
          location: 'body' 
        }]
      });
    }

    // Se recebeu texto bruto, enviar para IA processar tudo (listType: lacrada | seminovo | android)
    // Se recebeu produtos já parseados, usar o método antigo (compatibilidade)
    const aiValidationResult = rawListText 
      ? await aiService.validateProductListFromText(rawListText, { listType: listType || 'lacrada' })
      : await aiService.validateProductList(products || []);

    res.json({
      message: 'Lista validada com IA',
      validation: aiValidationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na validação de lista:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Cálculo inteligente de médias de preços
router.post('/calculate-price-average', requireSubscription('active'), [
  body('productData').isArray().withMessage('Dados de produtos são obrigatórios'),
  body('productData.*.price').isFloat({ min: 0 }).withMessage('Preços devem ser números positivos'),
  body('productData.*.date').optional().isISO8601().withMessage('Data deve estar no formato ISO')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { productData } = req.body;

    const analysis = await aiService.calculateSmartPriceAverage(productData);

    res.json({
      message: 'Análise de preços gerada com IA',
      analysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no cálculo de média:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Busca inteligente de preços
router.post('/search-optimal-prices', requireSubscription('active'), [
  body('criteria').isObject().withMessage('Critérios de busca são obrigatórios'),
  body('criteria.model').optional().isString(),
  body('criteria.color').optional().isString(),
  body('criteria.storage').optional().isString(),
  body('criteria.condition').optional().isIn(['Novo', 'Seminovo', 'Usado']),
  body('criteria.minPrice').optional().isFloat({ min: 0 }),
  body('criteria.maxPrice').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { criteria } = req.body;

    const recommendations = await aiService.searchOptimalPrices(criteria);

    res.json({
      message: 'Busca de preços otimizada com IA',
      recommendations,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na busca de preços:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Análise de tendências de mercado
router.get('/market-trends', authenticateToken, requireSubscription('active'), [
  queryValidator('timeframe').optional().isIn(['7 days', '30 days', '90 days', '1 year'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { timeframe = '30 days' } = req.query;

    const trends = await aiService.analyzeMarketTrends(timeframe);

    res.json({
      message: 'Análise de tendências gerada com IA',
      trends,
      timeframe,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na análise de tendências:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Geração de relatórios inteligentes
router.post('/generate-report', requireSubscription('active'), [
  body('reportType').isIn(['sales_performance', 'price_analysis', 'supplier_performance', 'general']).withMessage('Tipo de relatório inválido'),
  body('filters').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reportType, filters = {} } = req.body;

    const report = await aiService.generateIntelligentReport(reportType, filters);

    res.json({
      message: 'Relatório inteligente gerado com IA',
      report,
      reportType,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na geração de relatório:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Busca inteligente de produtos mais baratos
router.get('/find-cheapest', authenticateToken, requireSubscription('active'), [
  queryValidator('model').notEmpty().withMessage('Modelo é obrigatório'),
  queryValidator('storage').optional().isString(),
  queryValidator('condition').optional().isIn(['Novo', 'Seminovo', 'Usado']),
  queryValidator('maxPrice').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { model, storage, condition, maxPrice } = req.query;

    const criteria = {
      model,
      storage,
      condition,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined
    };

    const recommendations = await aiService.searchOptimalPrices(criteria);

    res.json({
      message: 'Busca inteligente de produtos mais baratos',
      recommendations,
      criteria,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na busca de produtos mais baratos:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Análise de oportunidade de negócio
router.post('/analyze-opportunity', requireSubscription('active'), [
  body('products').isArray().withMessage('Lista de produtos é obrigatória'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Orçamento deve ser um número positivo'),
  body('goals').optional().isArray().withMessage('Objetivos devem ser uma lista')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { products, budget, goals = [] } = req.body;

    // Usar IA para analisar oportunidades
    const opportunityAnalysis = await aiService.searchOptimalPrices({
      products,
      budget,
      goals
    });

    res.json({
      message: 'Análise de oportunidade gerada com IA',
      analysis: opportunityAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na análise de oportunidade:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Dashboard de IA - resumo de todas as funcionalidades
router.get('/dashboard', async (req, res) => {
  try {
    // Obter dados reais do dashboard
    const aiDashboard = await aiDashboardService.getRealDashboardData();

    res.json({
      message: 'Dashboard de IA carregado',
      dashboard: aiDashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro no dashboard de IA:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Teste de validação sem autenticação (para demonstração)
router.post('/test-validate', async (req, res) => {
  try {
    const { products } = req.body;
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ 
        message: 'Lista de produtos é obrigatória' 
      });
    }

    const validationResult = await aiService.validateProductList(products);

    res.json({
      message: 'Lista validada com IA (teste)',
      validation: validationResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro na validação de teste:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Status da IA
router.get('/status', async (req, res) => {
  try {
    const status = {
      ai_enabled: !!process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      max_tokens: process.env.OPENAI_MAX_TOKENS || 4000,
      features_available: [
        'validate_list',
        'calculate_price_average',
        'search_optimal_prices',
        'analyze_market_trends',
        'generate_report',
        'find_cheapest',
        'analyze_opportunity'
      ],
      timestamp: new Date().toISOString()
    };

    res.json({
      message: 'Status da IA',
      status
    });

  } catch (error) {
    console.error('Erro no status da IA:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

// Processar e salvar lista de produtos validados pela IA
router.post('/process-list', authenticateToken, requireSubscription('active'), [
  body('supplier_id').optional().isInt(),
  body('supplier_name').optional().trim().isLength({ min: 1 }),
  body('supplier_whatsapp').optional().trim(),
  body('validated_products').isArray().withMessage('Lista de produtos validados é obrigatória'),
  body('validated_products.*.name').notEmpty().withMessage('Nome do produto é obrigatório'),
  body('validated_products.*.price').isFloat({ min: 0 }).withMessage('Preço deve ser um número positivo'),
  body('raw_list_text').optional().isString(),
  body('list_type').optional().isIn(['lacrada', 'seminovo', 'android']).withMessage('list_type deve ser lacrada, seminovo ou android')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supplier_id, supplier_name, supplier_whatsapp, validated_products, raw_list_text, list_type: listType } = req.body;
    const listKind = listType === 'seminovo' ? 'seminovo' : listType === 'android' ? 'android' : 'lacrada';

    if (!validated_products || validated_products.length === 0) {
      return res.status(400).json({ message: 'Nenhum produto válido para salvar' });
    }

    // Filtrar conforme o tipo de lista (lacrada = só Novo; seminovo = só Seminovo; android = todos)
    const condicoesInvalidas = ['SWAP', 'VITRINE', 'USADO', 'RECONDICIONADO'];
    const produtosValidos = validated_products.filter(product => {
      const cond = (product.condition || '').toLowerCase();
      if (listKind === 'lacrada') {
        if (cond !== 'novo') {
          console.log(`🚫 [Lacrada] Rejeitado (não é Novo): ${product.name} - condition: ${product.condition}`);
          return false;
        }
        const detail = (product.condition_detail || '').toUpperCase();
        if (condicoesInvalidas.some(inv => detail.includes(inv))) return false;
        const variant = (product.variant || '').toUpperCase();
        if (condicoesInvalidas.some(inv => variant.includes(inv))) return false;
        const name = (product.name || '').toUpperCase();
        const model = (product.model || '').toUpperCase();
        if (condicoesInvalidas.some(inv => name.includes(inv) || model.includes(inv))) return false;
        return true;
      }
      if (listKind === 'seminovo') {
        if (cond !== 'seminovo') {
          console.log(`🚫 [Seminovo] Rejeitado (não é Seminovo): ${product.name} - condition: ${product.condition}`);
          return false;
        }
        return true;
      }
      // android: aceitar qualquer condition (Novo/Seminovo)
      return true;
    });

    if (produtosValidos.length === 0) {
      const msg = listKind === 'lacrada'
        ? 'Nenhum produto válido para salvar. Apenas produtos NOVOS/LACRADOS/CPO são aceitos.'
        : listKind === 'seminovo'
          ? 'Nenhum produto válido. Apenas produtos com condition Seminovo são aceitos.'
          : 'Nenhum produto válido para salvar.';
      return res.status(400).json({ message: msg, filtered_count: validated_products.length });
    }

    if (produtosValidos.length < validated_products.length) {
      console.log(`⚠️ ${validated_products.length - produtosValidos.length} produtos filtrados antes de salvar (list_type=${listKind})`);
    }

    // Usar apenas produtos válidos
    const validated_products_filtered = produtosValidos;

    let finalSupplierId = supplier_id;

    // Se não tem supplier_id, criar ou buscar fornecedor pelo nome
    if (!finalSupplierId && supplier_name) {
      // Verificar se fornecedor já existe pelo nome (busca case-insensitive e ignora espaços extras)
      const existingSupplier = await query(
        'SELECT id FROM suppliers WHERE TRIM(LOWER(name)) = TRIM(LOWER($1)) AND is_active = true',
        [supplier_name.trim()]
      );

      if (existingSupplier.rows.length > 0) {
        finalSupplierId = existingSupplier.rows[0].id;
        
        // Atualizar WhatsApp se fornecido
        if (supplier_whatsapp) {
          await query(
            'UPDATE suppliers SET whatsapp = $1 WHERE id = $2',
            [supplier_whatsapp, finalSupplierId]
          );
        }
      } else {
        // Criar novo fornecedor
        const newSupplierResult = await query(`
          INSERT INTO suppliers (name, whatsapp, is_active)
          VALUES ($1, $2, true)
          RETURNING id
        `, [supplier_name.trim(), supplier_whatsapp || null]);

        finalSupplierId = newSupplierResult.rows[0].id;

        // Log da criação do fornecedor
        await query(`
          INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          req.user.id,
          'supplier_created',
          JSON.stringify({ supplier_id: finalSupplierId, name: supplier_name }),
          req.ip,
          req.get('User-Agent')
        ]);
      }
    }

    if (!finalSupplierId) {
      console.error('❌ Fornecedor não encontrado ou não fornecido');
      console.error('  supplier_id recebido:', supplier_id);
      console.error('  supplier_name recebido:', supplier_name);
      return res.status(400).json({ message: 'Fornecedor não encontrado ou não fornecido' });
    }

    console.log(`✅ Fornecedor identificado: ID=${finalSupplierId}, Nome=${supplier_name || 'N/A'}`);

    // Verificar se fornecedor existe e está ativo
    const supplierCheck = await query(
      'SELECT id FROM suppliers WHERE id = $1 AND is_active = true',
      [finalSupplierId]
    );
    if (supplierCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Fornecedor não encontrado ou inativo' });
    }

    // Ao reprocessar: produtos do fornecedor que NÃO estão na lista são desativados
    // Assim evita aparecer produto antigo/errado (ex: 17 Pro Max preto que não existe mais na lista)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`🔄 Preparando para processar lista do fornecedor ${finalSupplierId} (${today})...`);

    const keysInList = new Set(); // chaves (model|color|storage|condition) dos produtos desta lista
    const productType = listKind === 'android' ? 'android' : 'apple';

    // Salvar produtos validados
    const savedProducts = [];
    const saveErrors = [];

    console.log(`📦 Processando ${validated_products_filtered.length} produtos válidos para o fornecedor ${finalSupplierId}...`);
    console.log(`🚫 ${validated_products.length - validated_products_filtered.length} produtos de vitrine foram filtrados antes de salvar`);

    for (const product of validated_products_filtered) {
      try {
        console.log(`  🔍 Processando produto: ${product.name} (${product.model || 'sem modelo'}) - R$ ${product.price}`);
        // Padronizar condição
        let condition = product.condition || 'Novo';
        if (typeof condition === 'string') {
          condition = condition.charAt(0).toUpperCase() + condition.slice(1).toLowerCase();
          if (!['Novo', 'Seminovo', 'Usado', 'Recondicionado'].includes(condition)) {
            condition = 'Novo';
          }
        }

        // Extrair condition_detail (condição original)
        let conditionDetail = product.condition_detail || '';
        if (typeof conditionDetail === 'string') {
          conditionDetail = conditionDetail.trim().toUpperCase();
          // Se não foi fornecido, tentar inferir da condição padronizada
          if (!conditionDetail && condition === 'Seminovo') {
            conditionDetail = 'SEMINOVO'; // Padrão para seminovos sem detalhe
          } else if (!conditionDetail && condition === 'Novo') {
            conditionDetail = 'NOVO'; // Padrão para novos sem detalhe
          }
        }

        // Verificar se produto já existe (mesmo fornecedor, modelo, cor, armazenamento, condição)
        // Busca mais precisa para evitar duplicados: compara exatamente os campos principais
        let existingProduct;
        
        // Normalizar valores para comparação
        const normalizedModel = product.model ? product.model.trim() : null;
        // Normalizar cor usando a função de normalização
        const normalizedColorRaw = product.color ? product.color.trim() : null;
        const normalizedColor = normalizedColorRaw ? normalizeColor(normalizedColorRaw, normalizedModel) : null;
        const normalizedStorage = product.storage ? product.storage.trim().toLowerCase() : null;
        const normalizedName = product.name ? product.name.trim().toLowerCase() : null;
        const normalizedVariant = detectVariant(product);

        const listKey = `${(normalizedModel || '').toLowerCase().trim()}|${(normalizedColor || '').toLowerCase().trim()}|${(normalizedStorage || '').trim()}|${condition}`;
        keysInList.add(listKey);

        const productTypeFilter = productType === 'android' ? "AND COALESCE(product_type, 'apple') = 'android'" : "AND COALESCE(product_type, 'apple') = 'apple'";
        if (normalizedModel) {
          // Busca por modelo: compara modelo, cor, armazenamento, condição e product_type
          existingProduct = await query(`
            SELECT id FROM products 
            WHERE supplier_id = $1 
              AND TRIM(LOWER(COALESCE(model, ''))) = TRIM(LOWER($2))
              AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
              AND COALESCE(TRIM(LOWER(COALESCE(storage, ''))), '') = COALESCE(TRIM(LOWER($4)), '')
              AND condition = $5
              ${productTypeFilter}
            ORDER BY updated_at DESC
            LIMIT 1
          `, [
            finalSupplierId,
            normalizedModel,
            normalizedColor || '',
            normalizedStorage || '',
            condition
          ]);
          
          if (existingProduct.rows.length === 0) {
            const modelPattern = normalizedModel.replace(/\s+/g, '\\s*');
            existingProduct = await query(`
              SELECT id FROM products 
              WHERE supplier_id = $1 
                AND TRIM(LOWER(COALESCE(model, ''))) ~* $2
                AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
                AND COALESCE(TRIM(LOWER(COALESCE(storage, ''))), '') = COALESCE(TRIM(LOWER($4)), '')
                AND condition = $5
                ${productTypeFilter}
              ORDER BY updated_at DESC
              LIMIT 1
            `, [
              finalSupplierId,
              `^${modelPattern}$`,
              normalizedColor || '',
              normalizedStorage || '',
              condition
            ]);
          }
        } else {
          existingProduct = await query(`
            SELECT id FROM products 
            WHERE supplier_id = $1 
              AND TRIM(LOWER(name)) = $2
              AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
              AND COALESCE(TRIM(LOWER(COALESCE(storage, ''))), '') = COALESCE(TRIM(LOWER($4)), '')
              AND condition = $5
              ${productTypeFilter}
            ORDER BY updated_at DESC
            LIMIT 1
          `, [
            finalSupplierId,
            normalizedName,
            normalizedColor || '',
            normalizedStorage || '',
            condition
          ]);
        }

        if (existingProduct.rows.length > 0) {
          // Atualizar produto existente (preço, nome, modelo, etc)
          const productId = existingProduct.rows[0].id;
          console.log(`    ✅ Produto existente encontrado (ID: ${productId}), atualizando...`);
          await query(`
            UPDATE products 
            SET price = $1, 
                name = $2,
                model = $3,
                color = $4,
                storage = $5,
                variant = $6,
                condition_detail = $7,
                is_active = $8,
                product_type = $9,
                updated_at = NOW()
            WHERE id = $10
          `, [
            product.price,
            product.name,
            product.model || null,
            normalizedColor || product.color || null,
            product.storage || null,
            normalizedVariant,
            conditionDetail || null,
            true,
            productType,
            productId
          ]);

          // Adicionar ao histórico de preços apenas se o preço mudou
          const priceHistoryCheck = await query(`
            SELECT price FROM price_history 
            WHERE product_id = $1 
            ORDER BY created_at DESC 
            LIMIT 1
          `, [productId]);
          
          const lastPrice = priceHistoryCheck.rows.length > 0 ? parseFloat(priceHistoryCheck.rows[0].price) : null;
          const currentPrice = parseFloat(product.price);
          
          // Só adiciona ao histórico se o preço mudou
          if (lastPrice === null || lastPrice !== currentPrice) {
            await query(`
              INSERT INTO price_history (product_id, supplier_id, price)
              VALUES ($1, $2, $3)
            `, [productId, finalSupplierId, product.price]);
          }

          savedProducts.push({ ...product, id: productId, updated: true, variant: normalizedVariant, condition_detail: conditionDetail });
          console.log(`    ✅ Produto atualizado com sucesso (ID: ${productId})`);
        } else {
          // Criar novo produto
          console.log(`    ➕ Criando novo produto...`);
          const productResult = await query(`
            INSERT INTO products (
              supplier_id, name, model, color, storage, condition, condition_detail, variant,
              price, stock_quantity, is_active, product_type
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING id
          `, [
            finalSupplierId,
            product.name,
            product.model || null,
            normalizedColor || product.color || null,
            product.storage || null,
            condition,
            conditionDetail || null,
            normalizedVariant,
            product.price,
            1,
            true,
            productType
          ]);

          const productId = productResult.rows[0].id;

          // Criar entrada no histórico de preços
          await query(`
            INSERT INTO price_history (product_id, supplier_id, price)
            VALUES ($1, $2, $3)
          `, [productId, finalSupplierId, product.price]);

          savedProducts.push({ ...product, id: productId, created: true, variant: normalizedVariant });
          console.log(`    ✅ Produto criado com sucesso (ID: ${productId})`);
        }
      } catch (error) {
        console.error(`    ❌ Erro ao salvar produto ${product.name}:`, error);
        console.error(`    ❌ Stack trace:`, error.stack);
        saveErrors.push({
          product: product.name,
          error: error.message
        });
      }
    }

    console.log(`📊 Resumo do salvamento:`);
    console.log(`  ✅ Produtos salvos: ${savedProducts.length}`);
    console.log(`  ❌ Erros: ${saveErrors.length}`);
    if (saveErrors.length > 0) {
      console.error(`  📋 Erros detalhados:`, saveErrors);
    }

    // Desativar produtos deste fornecedor + mesmo tipo que NÃO estão na lista processada
    const deactivateFilter = listKind === 'android'
      ? "AND COALESCE(product_type, 'apple') = 'android'"
      : listKind === 'seminovo'
        ? "AND condition = 'Seminovo' AND COALESCE(product_type, 'apple') = 'apple'"
        : "AND condition = 'Novo' AND COALESCE(product_type, 'apple') = 'apple'";
    const allActive = await query(`
      SELECT id, model, color, storage, condition
      FROM products
      WHERE supplier_id = $1 AND is_active = true ${deactivateFilter}
    `, [finalSupplierId]);
    const idsToDeactivate = [];
    for (const row of allActive.rows) {
      const dbColorNorm = row.color ? normalizeColor(row.color, row.model) : null;
      const dbKey = `${(row.model || '').toString().trim().toLowerCase()}|${(dbColorNorm || '').toString().toLowerCase().trim()}|${(row.storage || '').toString().trim().toLowerCase()}|${row.condition || 'Novo'}`;
      if (!keysInList.has(dbKey)) {
        idsToDeactivate.push(row.id);
      }
    }
    if (idsToDeactivate.length > 0) {
      await query(`
        UPDATE products SET is_active = false, updated_at = NOW()
        WHERE id = ANY($1::int[])
      `, [idsToDeactivate]);
      console.log(`  🧹 ${idsToDeactivate.length} produto(s) desativado(s) (não estão na lista atual)`);
    }

    // Log da ação
    await query(`
      INSERT INTO system_logs (user_id, action, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `, [
      req.user.id,
      'products_bulk_created',
      JSON.stringify({
        supplier_id: finalSupplierId,
        total_products: validated_products_filtered.length,
        filtered_vitrine_count: validated_products.length - validated_products_filtered.length,
        saved_products: savedProducts.length,
        errors: saveErrors.length
      }),
      req.ip,
      req.get('User-Agent')
    ]);

    // Calcular preço médio
    const avgPrice = savedProducts.length > 0
      ? savedProducts.reduce((sum, p) => sum + parseFloat(p.price), 0) / savedProducts.length
      : 0;

    // Salvar lista bruta se fornecida
    if (raw_list_text && raw_list_text.trim()) {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Deletar lista bruta do mesmo fornecedor processada hoje (substituir)
      await query(`
        DELETE FROM supplier_raw_lists 
        WHERE supplier_id = $1 
          AND DATE(processed_at) = $2
      `, [finalSupplierId, today]);

      // Inserir nova lista bruta
      await query(`
        INSERT INTO supplier_raw_lists (supplier_id, raw_list_text, processed_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
      `, [finalSupplierId, raw_list_text.trim()]);
      
      console.log(`✅ Lista bruta salva para fornecedor ${finalSupplierId}`);
    }

    res.json({
      message: 'Lista processada e salva com sucesso',
      summary: {
        total_products: validated_products_filtered.length,
        filtered_vitrine_count: validated_products.length - validated_products_filtered.length,
        saved_products: savedProducts.length,
        errors: saveErrors.length,
        average_price: Math.round(avgPrice)
      },
      supplier_id: finalSupplierId,
      saved_products: savedProducts,
      errors: saveErrors.length > 0 ? saveErrors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao processar lista:', error);
    res.status(500).json({ 
      message: 'Erro interno do servidor',
      error: error.message 
    });
  }
});

export default router;
