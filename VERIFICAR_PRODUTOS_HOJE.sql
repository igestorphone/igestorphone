-- ============================================
-- VERIFICAR PRODUTOS DE HOJE - DIAGNÓSTICO
-- ============================================

-- 1. Ver produtos com updated_at de hoje (timezone do servidor)
SELECT 
  COUNT(*) as total,
  MIN(updated_at) as mais_antigo,
  MAX(updated_at) as mais_recente,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE is_active = false) as inativos
FROM products
WHERE DATE(updated_at) = CURRENT_DATE;

-- 2. Ver produtos com data específica (03/12/2025)
SELECT 
  COUNT(*) as total,
  MIN(updated_at) as mais_antigo,
  MAX(updated_at) as mais_recente,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE is_active = false) as inativos
FROM products
WHERE DATE(updated_at) = '2025-12-03';

-- 3. Ver alguns exemplos de produtos de hoje
SELECT 
  id,
  name,
  model,
  is_active,
  updated_at,
  created_at,
  DATE(updated_at) as data_atualizacao,
  DATE(created_at) as data_criacao
FROM products
WHERE is_active = true
  AND (DATE(updated_at) = '2025-12-03' OR DATE(created_at) = '2025-12-03')
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Verificar timezone do banco
SHOW timezone;

-- 5. Ver data atual do banco
SELECT 
  NOW() as agora,
  CURRENT_DATE as data_atual,
  CURRENT_TIMESTAMP as timestamp_atual;

