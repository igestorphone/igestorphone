-- ============================================
-- DIAGNOSTICAR E CORRIGIR DATAS DOS PRODUTOS
-- ============================================

-- 1. Ver produtos processados HOJE (03/12) - comparando UTC vs Brasil
SELECT 
  id,
  name,
  model,
  updated_at as updated_at_utc,
  DATE(updated_at) as data_utc,
  DATE(updated_at AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  CASE 
    WHEN DATE(updated_at) = CURRENT_DATE THEN 'UTC: HOJE'
    WHEN DATE(updated_at AT TIME ZONE 'America/Sao_Paulo') = DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') THEN 'BRASIL: HOJE'
    ELSE 'OUTRO DIA'
  END as status
FROM products
WHERE is_active = true
ORDER BY updated_at DESC
LIMIT 30;

-- 2. Ver quantos produtos em cada data (UTC vs Brasil)
SELECT 
  'UTC' as tipo,
  DATE(updated_at) as data,
  COUNT(*) as total
FROM products
WHERE is_active = true
  AND DATE(updated_at) IN ('2025-12-02', '2025-12-03')
GROUP BY DATE(updated_at)
UNION ALL
SELECT 
  'BRASIL' as tipo,
  DATE(updated_at AT TIME ZONE 'America/Sao_Paulo') as data,
  COUNT(*) as total
FROM products
WHERE is_active = true
  AND DATE(updated_at AT TIME ZONE 'America/Sao_Paulo') IN ('2025-12-02', '2025-12-03')
GROUP BY DATE(updated_at AT TIME ZONE 'America/Sao_Paulo')
ORDER BY tipo, data DESC;

-- 3. Ver data atual no servidor vs Brasil
SELECT 
  NOW() as agora_servidor,
  CURRENT_DATE as data_servidor,
  NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
  DATE(NOW() AT TIME ZONE 'America/Sao_Paulo') as data_brasil;

-- ============================================
-- IMPORTANTE: Os produtos estão sendo salvos em UTC
-- Quando filtramos, precisamos converter para horário do Brasil
-- ============================================

