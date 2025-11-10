import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, Search, BarChart3, AlertCircle, CheckCircle } from 'lucide-react';

interface AIDashboardProps {
  className?: string;
}

interface AIStats {
  total_ai_requests: number;
  most_used_feature: string;
  success_rate: number;
}

interface MarketTrends {
  overall_trend: 'up' | 'down' | 'stable';
  trend_strength: number;
  opportunities: Array<{
    product: string;
    opportunity_type: string;
    confidence: number;
    reason: string;
  }>;
}

const AIDashboard: React.FC<AIDashboardProps> = ({ className = '' }) => {
  const [aiStats, setAiStats] = useState<AIStats | null>(null);
  const [marketTrends, setMarketTrends] = useState<MarketTrends | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIData();
  }, []);

  const fetchAIData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [dashboardResponse, trendsResponse] = await Promise.all([
        fetch('/api/ai/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch('/api/ai/market-trends?timeframe=7 days', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (!dashboardResponse.ok || !trendsResponse.ok) {
        throw new Error('Erro ao carregar dados de IA');
      }

      const dashboardData = await dashboardResponse.json();
      const trendsData = await trendsResponse.json();

      setAiStats(dashboardData.dashboard.usage_stats);
      setMarketTrends(trendsData.trends);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />;
      case 'down':
        return <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">Erro ao carregar dados de IA: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Brain className="w-8 h-8 text-purple-600 mr-3" />
          Dashboard de IA
        </h2>
        <p className="text-gray-600 mt-2">
          Inteligência artificial para automação completa do seu negócio
        </p>
      </div>

      {/* Estatísticas de IA */}
      {aiStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Requisições IA</p>
                <p className="text-2xl font-bold text-gray-900">{aiStats.total_ai_requests}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-green-600">{aiStats.success_rate}%</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funcionalidade Mais Usada</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">
                  {aiStats.most_used_feature.replace('_', ' ')}
                </p>
              </div>
              <Search className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Tendências de Mercado */}
      {marketTrends && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
            Tendências de Mercado (7 dias)
          </h3>
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              {getTrendIcon(marketTrends.overall_trend)}
              <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(marketTrends.overall_trend)}`}>
                {marketTrends.overall_trend === 'up' ? 'Alta' : 
                 marketTrends.overall_trend === 'down' ? 'Baixa' : 'Estável'}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Força: {marketTrends.trend_strength}%
            </div>
          </div>

          {marketTrends.opportunities && marketTrends.opportunities.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Oportunidades Identificadas</h4>
              <div className="space-y-2">
                {marketTrends.opportunities.slice(0, 3).map((opportunity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{opportunity.product}</p>
                      <p className="text-sm text-gray-600">{opportunity.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {opportunity.opportunity_type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-600">
                        Confiança: {opportunity.confidence}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Funcionalidades de IA */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Funcionalidades de IA Disponíveis
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Validação de Listas', icon: CheckCircle, color: 'green' },
            { name: 'Cálculo de Médias', icon: BarChart3, color: 'blue' },
            { name: 'Busca de Preços', icon: Search, color: 'purple' },
            { name: 'Análise de Tendências', icon: TrendingUp, color: 'orange' },
            { name: 'Relatórios Inteligentes', icon: BarChart3, color: 'indigo' },
            { name: 'Oportunidades de Negócio', icon: AlertCircle, color: 'red' }
          ].map((feature, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <feature.icon className={`w-5 h-5 text-${feature.color}-600 mr-3`} />
              <span className="text-sm font-medium text-gray-900">{feature.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIDashboard;











