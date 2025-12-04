-- VERIFICAR PRODUTOS DE HOJE ESPECIFICAMENTE

-- 1. Produtos ATIVOS que foram atualizados/criados HOJE
SELECT COUNT(*) as produtos_ativos_hoje
FROM products
WHERE is_active = true
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- 2. Ver alguns exemplos de produtos de hoje
SELECT id, name, model, price, 
       updated_at,
       DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as updated_date_br,
       created_at,
       DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as created_date_br
FROM products
WHERE is_active = true
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  )
ORDER BY updated_at DESC
LIMIT 10;

-- 3. Ver data/hora atual no timezone do Brasil
SELECT NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
       CURRENT_DATE as data_atual,
       DATE(NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_hoje_brasil;

-- 4. Ver produtos atualizados nas últimas 24 horas (independente da data)
SELECT COUNT(*) as produtos_ultimas_24h
FROM products
WHERE is_active = true
  AND updated_at >= NOW() - INTERVAL '24 hours';

