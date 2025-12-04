-- ============================================
-- VERIFICAR DATAS DOS PRODUTOS
-- ============================================

-- 1. Ver alguns produtos com suas datas em UTC e Brasil
SELECT 
  id,
  name,
  model,
  updated_at as updated_at_utc,
  updated_at AT TIME ZONE 'America/Sao_Paulo' as updated_at_brasil,
  DATE(updated_at) as data_utc,
  DATE(updated_at AT TIME ZONE 'America/Sao_Paulo') as data_brasil
FROM products
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 30;

-- 2. Contar produtos por data (UTC vs Brasil)
SELECT 
  DATE(updated_at) as data_utc,
  DATE(updated_at AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total
FROM products
WHERE is_active = true
GROUP BY DATE(updated_at), DATE(updated_at AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 10;

-- 3. Ver data atual em UTC e Brasil
SELECT 
  NOW() as agora_utc,
  NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
  CURRENT_DATE as data_atual_utc,
  DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') as data_atual_brasil;

