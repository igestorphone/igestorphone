import express from 'express';
import { body, validationResult, query as queryValidator } from 'express-validator';
import aiService from '../services/aiService.js';
import aiDashboardService from '../services/aiDashboardService.js';
import { authenticateToken, requireSubscription } from '../middleware/auth.js';
import { query } from '../config/database.js';

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
  if (combined.includes('cpo')) return 'CPO';

  return product?.variant ? product.variant.toString().toUpperCase() : null;
};

// Validação de lista de produtos com IA
router.post('/validate-list', authenticateToken, requireSubscription('active'), async (req, res) => {
  try {
    const { rawListText, products } = req.body;

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

    // Se recebeu texto bruto, enviar para IA processar tudo
    // Se recebeu produtos já parseados, usar o método antigo (compatibilidade)
    const aiValidationResult = rawListText 
      ? await aiService.validateProductListFromText(rawListText)
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
  body('raw_list_text').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supplier_id, supplier_name, supplier_whatsapp, validated_products, raw_list_text } = req.body;

    if (!validated_products || validated_products.length === 0) {
      return res.status(400).json({ message: 'Nenhum produto válido para salvar' });
    }

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
      return res.status(400).json({ message: 'Fornecedor não encontrado ou não fornecido' });
    }

    // Verificar se fornecedor existe e está ativo
    const supplierCheck = await query(
      'SELECT id FROM suppliers WHERE id = $1 AND is_active = true',
      [finalSupplierId]
    );
    if (supplierCheck.rows.length === 0) {
      return res.status(400).json({ message: 'Fornecedor não encontrado ou inativo' });
    }

    // IMPORTANTE: Antes de salvar novos produtos, desativar produtos do mesmo fornecedor processados HOJE
    // Isso garante que ao reprocessar a lista no mesmo dia, os produtos antigos sejam substituídos pelos novos
    // MAS: Buscar produtos existentes ANTES de desativar, para poder reativá-los depois
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`🔄 Preparando para processar lista do fornecedor ${finalSupplierId} (${today})...`);
    
    // Buscar IDs dos produtos que serão processados hoje (para reativá-los depois)
    const todayProductsResult = await query(`
      SELECT id FROM products 
      WHERE supplier_id = $1 
        AND DATE(updated_at) = $2
        AND is_active = true
    `, [finalSupplierId, today]);
    
    // Desativar produtos do mesmo fornecedor processados HOJE
    const deactivatedResult = await query(`
      UPDATE products 
      SET is_active = false 
      WHERE supplier_id = $1 
        AND DATE(updated_at) = $2
        AND is_active = true
      RETURNING id
    `, [finalSupplierId, today]);
    
    console.log(`✅ ${deactivatedResult.rows.length} produtos desativados (serão reativados/atualizados se estiverem na nova lista)`);

    // Salvar produtos validados
    const savedProducts = [];
    const saveErrors = [];

    for (const product of validated_products) {
      try {
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
        const normalizedColor = product.color ? product.color.trim().toLowerCase() : null;
        const normalizedStorage = product.storage ? product.storage.trim().toLowerCase() : null;
        const normalizedName = product.name ? product.name.trim().toLowerCase() : null;
        const normalizedVariant = detectVariant(product);
        
        if (normalizedModel) {
          // Busca por modelo: compara modelo, cor, armazenamento e condição
          // Buscar mesmo produtos inativos (que foram desativados hoje) para reativá-los
          // Usa comparação exata normalizada para evitar duplicados
          // Procura primeiro por match exato, depois por match parcial se necessário
          existingProduct = await query(`
            SELECT id FROM products 
            WHERE supplier_id = $1 
              AND TRIM(LOWER(COALESCE(model, ''))) = TRIM(LOWER($2))
              AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
              AND COALESCE(TRIM(LOWER(COALESCE(storage, ''))), '') = COALESCE(TRIM(LOWER($4)), '')
              AND condition = $5
            ORDER BY updated_at DESC
            LIMIT 1
          `, [
            finalSupplierId,
            normalizedModel,
            normalizedColor || '',
            normalizedStorage || '',
            condition
          ]);
          
          // Se não encontrou com match exato, tentar match parcial (para casos onde o modelo pode ter pequenas diferenças)
          if (existingProduct.rows.length === 0) {
            // Busca parcial: modelo similar (diferença apenas em espaços ou formatação)
            const modelPattern = normalizedModel.replace(/\s+/g, '\\s*'); // Permite espaços variáveis
            existingProduct = await query(`
              SELECT id FROM products 
              WHERE supplier_id = $1 
                AND TRIM(LOWER(COALESCE(model, ''))) ~* $2
                AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
                AND COALESCE(TRIM(LOWER(COALESCE(storage, ''))), '') = COALESCE(TRIM(LOWER($4)), '')
                AND condition = $5
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
          // Se não tem modelo, buscar por nome completo, cor, armazenamento e condição
          // Buscar mesmo produtos inativos (que foram desativados hoje) para reativá-los
          existingProduct = await query(`
            SELECT id FROM products 
            WHERE supplier_id = $1 
              AND TRIM(LOWER(name)) = $2
              AND COALESCE(TRIM(LOWER(COALESCE(color, ''))), '') = COALESCE(TRIM(LOWER($3)), '')
              AND COALESCE(TRIM(LOWER(COALESCE(storage, ''))), '') = COALESCE(TRIM(LOWER($4)), '')
              AND condition = $5
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
                updated_at = NOW()
            WHERE id = $9
          `, [
            product.price,
            product.name,
            product.model || null,
            product.color || null,
            product.storage || null,
            normalizedVariant,
            conditionDetail || null,
            true, // Garantir que está ativo
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
        } else {
          // Criar novo produto
          const productResult = await query(`
            INSERT INTO products (
              supplier_id, name, model, color, storage, condition, condition_detail, variant,
              price, stock_quantity, is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING id
          `, [
            finalSupplierId,
            product.name,
            product.model || null,
            product.color || null,
            product.storage || null,
            condition,
            conditionDetail || null,
            normalizedVariant,
            product.price,
            1, // stock_quantity padrão
            true // is_active
          ]);

          const productId = productResult.rows[0].id;

          // Criar entrada no histórico de preços
          await query(`
            INSERT INTO price_history (product_id, supplier_id, price)
            VALUES ($1, $2, $3)
          `, [productId, finalSupplierId, product.price]);

          savedProducts.push({ ...product, id: productId, created: true, variant: normalizedVariant });
        }
      } catch (error) {
        console.error(`Erro ao salvar produto ${product.name}:`, error);
        saveErrors.push({
          product: product.name,
          error: error.message
        });
      }
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
        total_products: validated_products.length,
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
        total_products: validated_products.length,
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
