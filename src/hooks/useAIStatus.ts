import { useState, useEffect, useCallback } from 'react';
import { aiApi } from '@/lib/api';

export interface AIStatus {
  isConnected: boolean;
  lastCheck: Date | null;
  responseTime: number | null;
  error: string | null;
  isChecking: boolean;
}

export const useAIStatus = (checkInterval: number = 30000) => {
  const [status, setStatus] = useState<AIStatus>({
    isConnected: false,
    lastCheck: null,
    responseTime: null,
    error: null,
    isChecking: false
  });

  const checkAIStatus = useCallback(async () => {
    const startTime = Date.now();
    
    setStatus(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      // Testar conexão com a IA fazendo uma requisição simples
      const response = await aiApi.getStatus();
      console.log('🔍 useAIStatus - Resposta da API:', response);
      
      const responseTime = Date.now() - startTime;
      
      setStatus({
        isConnected: response.data?.status?.ai_enabled || false,
        lastCheck: new Date(),
        responseTime,
        error: null,
        isChecking: false
      });
    } catch (error: any) {
      console.error('❌ useAIStatus - Erro:', error);
      setStatus({
        isConnected: false,
        lastCheck: new Date(),
        responseTime: null,
        error: error.response?.data?.message || error.message || 'Erro de conexão',
        isChecking: false
      });
    }
  }, []);

  useEffect(() => {
    // Verificação inicial
    checkAIStatus();

    // Configurar verificação periódica
    const interval = setInterval(checkAIStatus, checkInterval);

    return () => clearInterval(interval);
  }, [checkAIStatus, checkInterval]);

  return {
    ...status,
    checkStatus: checkAIStatus
  };
};
