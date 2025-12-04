-- ============================================
-- DIAGNÓSTICO COMPLETO: SITUAÇÃO DOS PRODUTOS
-- ============================================

-- 1. Ver distribuição de produtos por data (timezone Brasil)
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE is_active = false) as inativos
FROM products
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 10;

-- 2. Ver produtos atualizados nas últimas 30 horas
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total,
  MIN(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as mais_antigo,
  MAX(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as mais_recente
FROM products
WHERE updated_at >= NOW() - INTERVAL '30 hours'
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC;

-- 3. Ver alguns produtos específicos das últimas 24 horas
SELECT 
  id,
  name,
  is_active,
  updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as updated_brasil,
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as created_brasil
FROM products
WHERE updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 20;

