import React, { useState } from 'react';
import { Search, Brain, TrendingUp, AlertCircle, CheckCircle, DollarSign, Star } from 'lucide-react';

interface SearchCriteria {
  model: string;
  storage?: string;
  condition?: string;
  maxPrice?: number;
}

interface Recommendation {
  product_id: number;
  reason: string;
  score: number;
}

interface SearchResult {
  best_value: Recommendation;
  best_price: Recommendation;
  best_quality: Recommendation;
  recommendations: Array<{
    product_id: number;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    action: string;
  }>;
  market_insights: string[];
  alerts: string[];
}

const PriceSearch: React.FC = () => {
  const [criteria, setCriteria] = useState<SearchCriteria>({
    model: '',
    storage: '',
    condition: 'Novo',
    maxPrice: undefined
  });
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!criteria.model.trim()) {
      setError('Modelo é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/search-optimal-prices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ criteria })
      });

      if (!response.ok) {
        throw new Error('Erro na busca');
      }

      const data = await response.json();
      setSearchResult(data.recommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na busca');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-4 h-4" />;
      case 'medium':
        return <TrendingUp className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Brain className="w-8 h-8 text-purple-600 mr-3" />
          Busca Inteligente de Preços
        </h1>
        <p className="text-gray-600 mt-2">
          Use IA para encontrar os melhores preços e oportunidades de negócio
        </p>
      </div>

      {/* Formulário de Busca */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Critérios de Busca</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo *
            </label>
            <input
              type="text"
              value={criteria.model}
              onChange={(e) => setCriteria({ ...criteria, model: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="iPhone 15 Pro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Armazenamento
            </label>
            <select
              value={criteria.storage || ''}
              onChange={(e) => setCriteria({ ...criteria, storage: e.target.value || undefined })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Qualquer</option>
              <option value="128GB">128GB</option>
              <option value="256GB">256GB</option>
              <option value="512GB">512GB</option>
              <option value="1TB">1TB</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condição
            </label>
            <select
              value={criteria.condition || 'Novo'}
              onChange={(e) => setCriteria({ ...criteria, condition: e.target.value as any })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="Novo">Novo</option>
              <option value="Seminovo">Seminovo</option>
              <option value="Usado">Usado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preço Máximo
            </label>
            <input
              type="number"
              value={criteria.maxPrice || ''}
              onChange={(e) => setCriteria({ 
                ...criteria, 
                maxPrice: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="10000.00"
              step="0.01"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !criteria.model.trim()}
          className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Buscando com IA...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              Buscar Preços Inteligentes
            </>
          )}
        </button>
      </div>

      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Resultados */}
      {searchResult && (
        <div className="space-y-6">
          {/* Melhores Opções */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Melhor Custo-Benefício */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Star className="w-6 h-6 text-yellow-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Melhor Custo-Benefício</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Produto ID:</strong> {searchResult.best_value.product_id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Score:</strong> {searchResult.best_value.score}/100
                </p>
                <p className="text-sm text-gray-700">
                  {searchResult.best_value.reason}
                </p>
              </div>
            </div>

            {/* Melhor Preço */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="w-6 h-6 text-green-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Melhor Preço</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Produto ID:</strong> {searchResult.best_price.product_id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Score:</strong> {searchResult.best_price.score}/100
                </p>
                <p className="text-sm text-gray-700">
                  {searchResult.best_price.reason}
                </p>
              </div>
            </div>

            {/* Melhor Qualidade */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <CheckCircle className="w-6 h-6 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Melhor Qualidade</h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Produto ID:</strong> {searchResult.best_quality.product_id}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Score:</strong> {searchResult.best_quality.score}/100
                </p>
                <p className="text-sm text-gray-700">
                  {searchResult.best_quality.reason}
                </p>
              </div>
            </div>
          </div>

          {/* Recomendações */}
          {searchResult.recommendations && searchResult.recommendations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Brain className="w-5 h-5 text-purple-600 mr-2" />
                Recomendações da IA
              </h3>
              <div className="space-y-4">
                {searchResult.recommendations.map((rec, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                            {getPriorityIcon(rec.priority)}
                            <span className="ml-1 capitalize">{rec.priority}</span>
                          </span>
                          <span className="ml-3 text-sm text-gray-600">
                            Produto ID: {rec.product_id}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{rec.reason}</p>
                        <p className="text-sm font-medium text-blue-600">{rec.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights de Mercado */}
          {searchResult.market_insights && searchResult.market_insights.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 text-blue-600 mr-2" />
                Insights de Mercado
              </h3>
              <ul className="space-y-2">
                {searchResult.market_insights.map((insight, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Alertas */}
          {searchResult.alerts && searchResult.alerts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                Alertas Importantes
              </h3>
              <ul className="space-y-2">
                {searchResult.alerts.map((alert, index) => (
                  <li key={index} className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                    <span className="text-sm text-yellow-700">{alert}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceSearch;











