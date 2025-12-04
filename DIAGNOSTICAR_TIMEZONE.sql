-- ============================================
-- DIAGNOSTICAR PROBLEMA DE TIMEZONE
-- ============================================

-- 1. Verificar timezone do banco
SHOW timezone;

-- 2. Ver data atual em diferentes timezones
SELECT 
  NOW() as agora_utc,
  NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
  CURRENT_DATE as data_utc,
  DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') as data_brasil;

-- 3. Ver produtos e suas datas em diferentes timezones
SELECT 
  id,
  name,
  model,
  updated_at as updated_at_utc,
  updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as updated_at_brasil,
  DATE(updated_at) as data_utc,
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil
FROM products
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 20;

-- 4. Contar produtos por data (UTC vs Brasil)
SELECT 
  DATE(updated_at) as data_utc,
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total
FROM products
WHERE is_active = true
GROUP BY DATE(updated_at), DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 10;

