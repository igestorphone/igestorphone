-- ============================================
-- CORREÇÃO DEFINITIVA: TIMEZONE E DATAS
-- ============================================

-- 1. Ver situação atual
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM products
WHERE is_active = true
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 5;

-- 2. CORRIGIR: Produtos processados hoje (03/12) que estão com data de 02/12
-- Atualizar produtos que foram atualizados nas últimas 30 horas mas têm data de 02/12
UPDATE products
SET updated_at = NOW()
WHERE is_active = true
  AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = '2025-12-02'
  AND updated_at >= NOW() - INTERVAL '30 hours';

-- 3. CORRIGIR: Produtos que foram desativados às 21h (erro de timezone)
-- Reativar produtos que foram desativados nas últimas 6 horas
UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '6 hours';

-- 4. Verificar resultado
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as ativos
FROM products
WHERE is_active = true
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 5;

