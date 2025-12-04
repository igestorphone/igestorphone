-- DIAGNÓSTICO: Verificar situação dos produtos de hoje

-- 1. Ver produtos ATIVOS de hoje
SELECT COUNT(*) as produtos_ativos_hoje
FROM products
WHERE is_active = true
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- 2. Ver produtos DESATIVADOS de hoje
SELECT COUNT(*) as produtos_desativados_hoje
FROM products
WHERE is_active = false
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- 3. Ver TODOS os produtos desativados (últimas 24 horas)
SELECT COUNT(*) as produtos_desativados_24h
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours';

-- 4. Ver produtos desativados nas últimas 6 horas
SELECT COUNT(*) as produtos_desativados_6h
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '6 hours';

-- 5. Ver alguns exemplos de produtos desativados recentemente
SELECT id, name, model, is_active, updated_at, created_at,
       DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as updated_date_br,
       DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as created_date_br
FROM products
WHERE is_active = false
ORDER BY updated_at DESC
LIMIT 10;

-- 6. Ver data atual no timezone do Brasil
SELECT NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
       CURRENT_DATE as data_atual;

