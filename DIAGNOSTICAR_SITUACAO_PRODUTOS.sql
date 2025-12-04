-- ============================================
-- DIAGNOSTICAR SITUAÇÃO REAL DOS PRODUTOS
-- ============================================

-- 1. Ver distribuição de produtos por data (no timezone do Brasil)
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE is_active = false) as inativos
FROM products
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 10;

-- 2. Ver produtos ativos de hoje (03/12) no timezone do Brasil
SELECT COUNT(*) as produtos_hoje_03_12
FROM products
WHERE is_active = true
  AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = '2025-12-03';

-- 3. Ver produtos ativos de ontem (02/12) no timezone do Brasil
SELECT COUNT(*) as produtos_ontem_02_12
FROM products
WHERE is_active = true
  AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = '2025-12-02';

-- 4. Ver produtos ativos atualizados nas últimas 30 horas (independente da data)
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total
FROM products
WHERE is_active = true
  AND updated_at >= NOW() - INTERVAL '30 hours'
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC;

-- 5. Ver alguns produtos específicos das últimas 30 horas
SELECT 
  id,
  name,
  model,
  is_active,
  updated_at,
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  DATE(updated_at) as data_utc,
  NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil
FROM products
WHERE is_active = true
  AND updated_at >= NOW() - INTERVAL '30 hours'
ORDER BY updated_at DESC
LIMIT 10;

