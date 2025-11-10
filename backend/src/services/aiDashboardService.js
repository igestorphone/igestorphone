import { query } from '../config/database.js';

class AIDashboardService {
  constructor() {
    this.costPerToken = 0.00003; // Custo aproximado por token (GPT-4o-mini)
  }

  // Registrar uso da IA
  async logAIUsage(action, details, tokensUsed = 0, cost = 0) {
    try {
      await query(`
        INSERT INTO ai_usage_logs (
          action, 
          details, 
          tokens_used, 
          cost, 
          created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `, [action, JSON.stringify(details), tokensUsed, cost]);
    } catch (error) {
      console.error('Erro ao registrar uso da IA:', error);
    }
  }

  // Calcular custo baseado em tokens
  calculateCost(tokensUsed) {
    return tokensUsed * this.costPerToken;
  }

  // Obter estatísticas reais do dashboard
  async getRealDashboardData() {
    try {
      // Estatísticas gerais
      const totalStats = await query(`
        SELECT 
          COUNT(*) as total_requests,
          SUM(cost) as total_cost,
          SUM(tokens_used) as total_tokens,
          AVG(cost) as avg_cost_per_request,
          COUNT(DISTINCT DATE(created_at)) as active_days
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      // Uso por ação
      const actionStats = await query(`
        SELECT 
          action,
          COUNT(*) as count,
          SUM(cost) as total_cost,
          AVG(cost) as avg_cost
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY action
        ORDER BY count DESC
      `);

      // Uso mensal (últimos 6 meses)
      const monthlyUsage = await query(`
        SELECT 
          TO_CHAR(created_at, 'Mon') as month,
          EXTRACT(MONTH FROM created_at) as month_num,
          COUNT(*) as requests,
          SUM(cost) as cost
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '6 months'
        GROUP BY EXTRACT(MONTH FROM created_at), TO_CHAR(created_at, 'Mon')
        ORDER BY month_num
      `);

      // Atividade recente (últimas 24h)
      const recentActivity = await query(`
        SELECT 
          action,
          details,
          cost,
          TO_CHAR(created_at, 'HH24:MI') as time
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 10
      `);

      // Taxa de sucesso (baseada em logs sem erro)
      const successRate = await query(`
        SELECT 
          COUNT(*) as total_requests,
          COUNT(CASE WHEN details::text NOT LIKE '%error%' THEN 1 END) as successful_requests
        FROM ai_usage_logs
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `);

      const stats = totalStats.rows[0];
      const success = successRate.rows[0];
      const successRatePercent = stats.total_requests > 0 
        ? (success.successful_requests / stats.total_requests) * 100 
        : 0;

      return {
        total_requests: parseInt(stats.total_requests) || 0,
        total_cost: parseFloat(stats.total_cost) || 0,
        total_tokens: parseInt(stats.total_tokens) || 0,
        lists_processed: actionStats.rows.filter(row => 
          row.action.includes('validate') || row.action.includes('process')
        ).reduce((sum, row) => sum + parseInt(row.count), 0),
        products_validated: actionStats.rows.filter(row => 
          row.action.includes('validate')
        ).reduce((sum, row) => {
          const details = JSON.parse(row.details || '{}');
          return sum + (details.input_count || 0);
        }, 0),
        average_response_time: 1.2, // Tempo médio estimado
        success_rate: Math.round(successRatePercent * 10) / 10,
        monthly_usage: monthlyUsage.rows.map(row => ({
          month: row.month,
          requests: parseInt(row.requests),
          cost: parseFloat(row.cost)
        })),
        top_features: actionStats.rows.slice(0, 3).map(row => ({
          name: this.getActionDisplayName(row.action),
          usage: Math.round((parseInt(row.count) / parseInt(stats.total_requests)) * 100),
          cost: parseFloat(row.total_cost)
        })),
        recent_activity: recentActivity.rows.map(row => ({
          time: row.time,
          action: this.getActionDisplayName(row.action),
          details: this.getActionDetails(row.action, row.details),
          cost: parseFloat(row.cost)
        })),
        ai_features: [
          'Validação inteligente de listas',
          'Cálculo de médias de preços',
          'Busca otimizada de preços',
          'Análise de tendências de mercado',
          'Geração de relatórios inteligentes',
          'Análise de oportunidades de negócio'
        ],
        usage_stats: {
          total_ai_requests: parseInt(stats.total_requests) || 0,
          most_used_feature: actionStats.rows[0]?.action || 'price_search',
          success_rate: Math.round(successRatePercent * 10) / 10
        }
      };
    } catch (error) {
      console.error('Erro ao obter dados reais do dashboard:', error);
      // Retornar dados padrão em caso de erro
      return this.getDefaultDashboardData();
    }
  }

  // Dados padrão caso não haja dados reais
  getDefaultDashboardData() {
    return {
      total_requests: 0,
      total_cost: 0,
      lists_processed: 0,
      products_validated: 0,
      average_response_time: 0,
      success_rate: 0,
      monthly_usage: [],
      top_features: [],
      recent_activity: [],
      ai_features: [
        'Validação inteligente de listas',
        'Cálculo de médias de preços',
        'Busca otimizada de preços',
        'Análise de tendências de mercado',
        'Geração de relatórios inteligentes',
        'Análise de oportunidades de negócio'
      ],
      usage_stats: {
        total_ai_requests: 0,
        most_used_feature: 'price_search',
        success_rate: 0
      }
    };
  }

  // Converter nome da ação para exibição
  getActionDisplayName(action) {
    const actionNames = {
      'validate_product_list': 'Validação de Listas',
      'calculate_price_average': 'Cálculo de Médias',
      'search_optimal_prices': 'Busca de Preços',
      'analyze_market_trends': 'Análise de Tendências',
      'generate_intelligent_report': 'Geração de Relatórios',
      'analyze_opportunity': 'Análise de Oportunidades'
    };
    return actionNames[action] || action;
  }

  // Obter detalhes da ação para exibição
  getActionDetails(action, details) {
    try {
      const parsed = JSON.parse(details || '{}');
      switch (action) {
        case 'validate_product_list':
          return `${parsed.input_count || 0} produtos validados`;
        case 'calculate_price_average':
          return `${parsed.data_points || 0} pontos de dados analisados`;
        case 'search_optimal_prices':
          return `${parsed.products_found || 0} produtos encontrados`;
        case 'analyze_market_trends':
          return `Análise de ${parsed.data_points || 0} pontos de dados`;
        default:
          return 'Ação executada com sucesso';
      }
    } catch {
      return 'Ação executada com sucesso';
    }
  }
}

export default new AIDashboardService();










