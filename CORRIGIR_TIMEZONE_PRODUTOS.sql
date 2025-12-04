-- ============================================
-- CORRIGIR TIMEZONE DOS PRODUTOS
-- ============================================

-- 1. Verificar timezone do banco
SHOW timezone;

-- 2. Ver produtos de HOJE (03/12) no timezone do Brasil
SELECT 
  id,
  name,
  model,
  updated_at,
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  DATE(updated_at) as data_utc
FROM products
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 20;

-- 3. Ver quantos produtos de cada data
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total
FROM products
WHERE is_active = true
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 5;

-- ============================================
-- IMPORTANTE: O banco está em UTC
-- Precisamos converter para horário do Brasil ao filtrar
-- ============================================

