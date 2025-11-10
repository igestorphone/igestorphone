import express from 'express';
import { query as queryValidator } from 'express-validator';
import { query } from '../config/database.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

// Dashboard principal - estatísticas gerais
router.get('/dashboard', async (req, res) => {
  try {
    // Estatísticas gerais
    const generalStats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE is_active = true) as total_users,
        (SELECT COUNT(*) FROM suppliers WHERE is_active = true) as total_suppliers,
        (SELECT COUNT(*) FROM products WHERE is_active = true) as total_products,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions
    `);

    // Usuários por status de assinatura
    const subscriptionStats = await query(`
      SELECT 
        subscription_status,
        COUNT(*) as count
      FROM users 
      WHERE is_active = true
      GROUP BY subscription_status
    `);

    // Produtos por fornecedor
    const productsBySupplier = await query(`
      SELECT 
        s.name as supplier_name,
        COUNT(p.id) as product_count,
        AVG(p.price) as avg_price
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = true
      WHERE s.is_active = true
      GROUP BY s.id, s.name
      ORDER BY product_count DESC
      LIMIT 10
    `);

    // Produtos mais caros
    const expensiveProducts = await query(`
      SELECT 
        p.name,
        p.model,
        p.price,
        p.condition,
        s.name as supplier_name
      FROM products p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = true
      ORDER BY p.price DESC
      LIMIT 10
    `);

    // Atividade recente (últimos 7 dias)
    const recentActivity = await query(`
      SELECT 
        action,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM system_logs
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY action, DATE(created_at)
      ORDER BY date DESC, count DESC
    `);

    res.json({
      general_stats: generalStats.rows[0],
      subscription_stats: subscriptionStats.rows,
      products_by_supplier: productsBySupplier.rows,
      expensive_products: expensiveProducts.rows,
      recent_activity: recentActivity.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas do dashboard:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Estatísticas de preços
router.get('/prices', [
  queryValidator('days').optional().isInt({ min: 1, max: 365 }),
  queryValidator('supplier_id').optional().isInt(),
  queryValidator('product_id').optional().isInt()
], async (req, res) => {
  try {
    const { days = 30, supplier_id, product_id } = req.query;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (supplier_id) {
      whereClause += ` AND ph.supplier_id = $${paramCount}`;
      values.push(supplier_id);
      paramCount++;
    }

    if (product_id) {
      whereClause += ` AND ph.product_id = $${paramCount}`;
      values.push(product_id);
      paramCount++;
    }

    whereClause += ` AND ph.recorded_at >= NOW() - INTERVAL '${parseInt(days)} days'`;

    // Variação de preços por dia
    const priceVariation = await query(`
      SELECT 
        DATE(ph.recorded_at) as date,
        AVG(ph.price) as avg_price,
        MIN(ph.price) as min_price,
        MAX(ph.price) as max_price,
        COUNT(*) as price_updates
      FROM price_history ph
      ${whereClause}
      GROUP BY DATE(ph.recorded_at)
      ORDER BY date DESC
    `, values);

    // Produtos com maior variação de preço
    const priceVolatility = await query(`
      SELECT 
        p.name,
        p.model,
        s.name as supplier_name,
        AVG(ph.price) as avg_price,
        STDDEV(ph.price) as price_stddev,
        (MAX(ph.price) - MIN(ph.price)) as price_range,
        COUNT(ph.id) as price_updates
      FROM price_history ph
      JOIN products p ON ph.product_id = p.id
      JOIN suppliers s ON ph.supplier_id = s.id
      ${whereClause}
      GROUP BY p.id, p.name, p.model, s.name
      HAVING COUNT(ph.id) > 1
      ORDER BY price_stddev DESC
      LIMIT 20
    `, values);

    // Preços por categoria (condição)
    const pricesByCondition = await query(`
      SELECT 
        p.condition,
        AVG(ph.price) as avg_price,
        MIN(ph.price) as min_price,
        MAX(ph.price) as max_price,
        COUNT(DISTINCT p.id) as product_count
      FROM price_history ph
      JOIN products p ON ph.product_id = p.id
      ${whereClause}
      GROUP BY p.condition
      ORDER BY avg_price DESC
    `, values);

    res.json({
      price_variation: priceVariation.rows,
      price_volatility: priceVolatility.rows,
      prices_by_condition: pricesByCondition.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de preços:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Estatísticas de usuários (apenas admin)
router.get('/users', requireRole('admin'), [
  queryValidator('days').optional().isInt({ min: 1, max: 365 })
], async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Usuários por período
    const usersByPeriod = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);

    // Usuários por assinatura
    const usersBySubscription = await query(`
      SELECT 
        subscription_status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/86400) as avg_days_since_registration
      FROM users
      WHERE is_active = true
      GROUP BY subscription_status
    `);

    // Atividade de login
    const loginActivity = await query(`
      SELECT 
        DATE(last_login) as date,
        COUNT(*) as active_users
      FROM users
      WHERE last_login >= NOW() - INTERVAL '${parseInt(days)} days'
      AND last_login IS NOT NULL
      GROUP BY DATE(last_login)
      ORDER BY date DESC
    `);

    // Usuários mais ativos
    const mostActiveUsers = await query(`
      SELECT 
        u.name,
        u.email,
        u.subscription_status,
        COUNT(sl.id) as action_count,
        MAX(sl.created_at) as last_activity
      FROM users u
      LEFT JOIN system_logs sl ON u.id = sl.user_id
      WHERE u.is_active = true
      AND sl.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY u.id, u.name, u.email, u.subscription_status
      ORDER BY action_count DESC
      LIMIT 10
    `);

    res.json({
      users_by_period: usersByPeriod.rows,
      users_by_subscription: usersBySubscription.rows,
      login_activity: loginActivity.rows,
      most_active_users: mostActiveUsers.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de usuários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Estatísticas de fornecedores
router.get('/suppliers', [
  queryValidator('days').optional().isInt({ min: 1, max: 365 })
], async (req, res) => {
  try {
    const { days = 30 } = req.query;

    // Fornecedores com mais produtos
    const suppliersByProducts = await query(`
      SELECT 
        s.name,
        s.contact_email,
        COUNT(p.id) as product_count,
        AVG(p.price) as avg_price,
        SUM(p.stock_quantity) as total_stock
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id AND p.is_active = true
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.contact_email
      ORDER BY product_count DESC
    `);

    // Fornecedores com maior variação de preços
    const suppliersByPriceVolatility = await query(`
      SELECT 
        s.name,
        s.contact_email,
        AVG(ph.price) as avg_price,
        STDDEV(ph.price) as price_stddev,
        COUNT(DISTINCT ph.product_id) as products_tracked,
        COUNT(ph.id) as price_updates
      FROM suppliers s
      JOIN price_history ph ON s.id = ph.supplier_id
      WHERE s.is_active = true
      AND ph.recorded_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY s.id, s.name, s.contact_email
      HAVING COUNT(ph.id) > 1
      ORDER BY price_stddev DESC
    `);

    // Produtos mais adicionados por fornecedor
    const productsAddedBySupplier = await query(`
      SELECT 
        s.name as supplier_name,
        COUNT(p.id) as products_added
      FROM suppliers s
      JOIN products p ON s.id = p.supplier_id
      WHERE s.is_active = true
      AND p.created_at >= NOW() - INTERVAL '${parseInt(days)} days'
      GROUP BY s.id, s.name
      ORDER BY products_added DESC
    `);

    res.json({
      suppliers_by_products: suppliersByProducts.rows,
      suppliers_by_price_volatility: suppliersByPriceVolatility.rows,
      products_added_by_supplier: productsAddedBySupplier.rows
    });

  } catch (error) {
    console.error('Erro ao buscar estatísticas de fornecedores:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Relatório de vendas/assinaturas (apenas admin)
router.get('/revenue', requireRole('admin'), [
  queryValidator('start_date').optional().isISO8601(),
  queryValidator('end_date').optional().isISO8601()
], async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const values = [];
    let paramCount = 1;

    if (start_date) {
      dateFilter += ` AND created_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      dateFilter += ` AND created_at <= $${paramCount}`;
      values.push(end_date);
      paramCount++;
    }

    // Assinaturas por período
    const subscriptionsByPeriod = await query(`
      SELECT 
        DATE(created_at) as date,
        plan_name,
        COUNT(*) as count
      FROM subscriptions
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(created_at), plan_name
      ORDER BY date DESC
    `, values);

    // Status das assinaturas
    const subscriptionStatus = await query(`
      SELECT 
        status,
        COUNT(*) as count,
        AVG(EXTRACT(EPOCH FROM (current_period_end - current_period_start))/86400) as avg_duration_days
      FROM subscriptions
      WHERE 1=1 ${dateFilter}
      GROUP BY status
    `, values);

    // Assinaturas canceladas vs ativas
    const cancellationRate = await query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_created,
        SUM(CASE WHEN cancel_at_period_end = true THEN 1 ELSE 0 END) as canceled
      FROM subscriptions
      WHERE 1=1 ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, values);

    res.json({
      subscriptions_by_period: subscriptionsByPeriod.rows,
      subscription_status: subscriptionStatus.rows,
      cancellation_rate: cancellationRate.rows
    });

  } catch (error) {
    console.error('Erro ao buscar relatório de receita:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Logs do sistema (apenas admin)
router.get('/logs', requireRole('admin'), [
  queryValidator('page').optional().isInt({ min: 1 }),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }),
  queryValidator('action').optional().trim(),
  queryValidator('user_id').optional().isInt(),
  queryValidator('start_date').optional().isISO8601(),
  queryValidator('end_date').optional().isISO8601()
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      user_id, 
      start_date, 
      end_date 
    } = req.query;

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (action) {
      whereClause += ` AND action ILIKE $${paramCount}`;
      values.push(`%${action}%`);
      paramCount++;
    }

    if (user_id) {
      whereClause += ` AND user_id = $${paramCount}`;
      values.push(user_id);
      paramCount++;
    }

    if (start_date) {
      whereClause += ` AND created_at >= $${paramCount}`;
      values.push(start_date);
      paramCount++;
    }

    if (end_date) {
      whereClause += ` AND created_at <= $${paramCount}`;
      values.push(end_date);
      paramCount++;
    }

    // Buscar logs
    const logsResult = await query(`
      SELECT 
        sl.*,
        u.name as user_name,
        u.email as user_email
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, [...values, limit, offset]);

    // Contar total
    const countResult = await query(`
      SELECT COUNT(*) as total
      FROM system_logs sl
      ${whereClause}
    `, values);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      logs: logsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Rota para processamentos de lista
router.get('/processamentos-lista', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        supplier_name,
        total_products,
        valid_products,
        invalid_products,
        processing_time,
        created_at,
        status
      FROM processamentos_lista
      ORDER BY created_at DESC
      LIMIT 50
    `);

    res.json({
      message: 'Processamentos de lista carregados',
      processamentos: result.rows
    });
  } catch (error) {
    console.error('Erro ao carregar processamentos:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

// Rota para histórico de preços
router.get('/price-history', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        id,
        product_name,
        price,
        supplier_name,
        created_at
      FROM price_history
      ORDER BY created_at DESC
      LIMIT 100
    `);

    res.json({
      message: 'Histórico de preços carregado',
      priceHistory: result.rows
    });
  } catch (error) {
    console.error('Erro ao carregar histórico de preços:', error);
    res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
});

export default router;






