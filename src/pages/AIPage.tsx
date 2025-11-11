import React, { useState, useEffect } from 'react';
import { Brain, DollarSign, Activity, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const RAW_API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const API_BASE_URL = RAW_API_BASE.includes('/api') ? RAW_API_BASE : `${RAW_API_BASE}/api`;

const buildApiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const AIPage: React.FC = () => {
  const { user } = useAuthStore();
  const [aiStats, setAiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Status da IA
  const [isConnected, setIsConnected] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  console.log('🔍 AIPage - user:', user);
  console.log('🔍 AIPage - loading:', loading);
  console.log('🔍 AIPage - error:', error);

  // Verificar se é admin
  if (user?.tipo !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Negado</h2>
          <p className="text-white/70">Apenas administradores podem acessar o painel de IA.</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    console.log('🔍 AIPage - useEffect executado');
    fetchAIStats();
    checkAIStatus();
  }, []);

  const fetchAIStats = async () => {
    try {
      console.log('🔍 AIPage - fetchAIStats iniciado');
      setLoading(true);
      setError(null);
      
      // Fazer requisição direta sem usar a API wrapper
      const token = localStorage.getItem('auth-storage');
      console.log('🔍 AIPage - Token do localStorage:', token);
      
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const authData = JSON.parse(token);
      const authToken = authData.state?.token;
      console.log('🔍 AIPage - Token extraído:', authToken);

      const response = await fetch(buildApiUrl('/ai/dashboard'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('🔍 AIPage - Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AIPage - Dashboard data:', data);
      setAiStats(data.dashboard || data);
    } catch (err: any) {
      console.error('❌ AIPage - Erro ao buscar estatísticas:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const checkAIStatus = async () => {
    try {
      console.log('🔍 AIPage - checkAIStatus iniciado');
      setIsChecking(true);
      const startTime = Date.now();
      
      const response = await fetch(buildApiUrl('/ai/status'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const endTime = Date.now();
      
      console.log('🔍 AIPage - Status response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('🔍 AIPage - Status data:', data);
      
      setIsConnected(data.status?.ai_enabled || false);
      setLastCheck(new Date());
      setResponseTime(endTime - startTime);
      setStatusError(null);
    } catch (err: any) {
      console.error('❌ AIPage - Erro ao verificar status:', err);
      setIsConnected(false);
      setStatusError(err.message || 'Erro de conexão');
    } finally {
      setIsChecking(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-white/70 text-lg">Carregando dados da IA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Erro ao Carregar</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <button 
            onClick={fetchAIStats}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Dados padrão para fallback
  const stats = aiStats || {
    total_requests: 0,
    total_cost: 0,
    lists_processed: 0,
    products_validated: 0,
    average_response_time: 0,
    success_rate: 0
  };

  console.log('🔍 AIPage - stats:', stats);
  console.log('🔍 AIPage - isConnected:', isConnected);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Brain className="w-16 h-16 text-purple-400 mr-4" />
          <div>
            <h1 className="text-4xl font-bold text-white">Painel de IA - Admin</h1>
            <p className="text-white/70 text-lg">Dashboard de gastos e status da Inteligência Artificial</p>
          </div>
        </div>
      </div>

      {/* Status da IA */}
      <div className={`rounded-xl p-6 border-2 ${
        isConnected 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-red-500/10 border-red-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isChecking ? (
              <RefreshCw className={`w-6 h-6 animate-spin ${isConnected ? 'text-green-400' : 'text-red-400'}`} />
            ) : isConnected ? (
              <Wifi className="w-6 h-6 text-green-400" />
            ) : (
              <WifiOff className="w-6 h-6 text-red-400" />
            )}
            
            <div>
              <h3 className={`text-lg font-semibold ${
                isConnected ? 'text-green-400' : 'text-red-400'
              }`}>
                {isConnected ? 'IA Conectada' : 'IA Desconectada'}
              </h3>
              <p className="text-white/70 text-sm">
                {isConnected 
                  ? `Última verificação: ${lastCheck ? lastCheck.toLocaleTimeString() : 'N/A'}${responseTime ? ` (${responseTime}ms)` : ''}`
                  : statusError || 'Erro de conexão com a IA'
                }
              </p>
            </div>
          </div>
          
          <button
            onClick={checkAIStatus}
            disabled={isChecking}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              isConnected
                ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isChecking ? 'Verificando...' : 'Verificar Agora'}
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-purple-400" />
            <div className="text-right">
              <div className="text-3xl font-bold text-purple-400">
                {stats.total_requests.toLocaleString()}
              </div>
              <div className="text-white/70 text-sm">Total de Requisições</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-green-400" />
            <div className="text-right">
              <div className="text-3xl font-bold text-green-400">
                R$ {stats.total_cost.toFixed(2)}
              </div>
              <div className="text-white/70 text-sm">Custo Total IA</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <CheckCircle className="w-8 h-8 text-blue-400" />
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-400">
                {stats.lists_processed}
              </div>
              <div className="text-white/70 text-sm">Listas Processadas</div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <Activity className="w-8 h-8 text-yellow-400" />
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-400">
                {stats.success_rate}%
              </div>
              <div className="text-white/70 text-sm">Taxa de Sucesso</div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumo de Economia */}
      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-6 border border-green-500/20">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-green-400" />
          Resumo de Economia com IA
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {stats.products_validated.toLocaleString()}
            </div>
            <div className="text-white/70">Produtos Validados</div>
            <div className="text-white/50 text-sm mt-1">Economia: ~40h de trabalho manual</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              R$ {(stats.total_cost * 0.3).toFixed(2)}
            </div>
            <div className="text-white/70">Economia Estimada</div>
            <div className="text-white/50 text-sm mt-1">Comparado a validação manual</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {stats.average_response_time}s
            </div>
            <div className="text-white/70">Tempo Médio de Resposta</div>
            <div className="text-white/50 text-sm mt-1">Processamento instantâneo</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPage;