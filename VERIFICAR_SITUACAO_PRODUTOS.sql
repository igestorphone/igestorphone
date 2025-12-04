-- VERIFICAR SITUAÇÃO REAL DOS PRODUTOS

-- 1. Total de produtos ativos
SELECT COUNT(*) as total_ativos
FROM products
WHERE is_active = true;

-- 2. Total de produtos inativos
SELECT COUNT(*) as total_inativos
FROM products
WHERE is_active = false;

-- 3. Produtos atualizados HOJE (no timezone do Brasil)
SELECT COUNT(*) as produtos_atualizados_hoje
FROM products
WHERE DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE;

-- 4. Produtos criados HOJE (no timezone do Brasil)
SELECT COUNT(*) as produtos_criados_hoje
FROM products
WHERE DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE;

-- 5. Produtos ativos que foram atualizados hoje
SELECT COUNT(*) as produtos_ativos_hoje
FROM products
WHERE is_active = true
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- 6. Ver últimos 10 produtos atualizados (seja ativo ou inativo)
SELECT id, name, model, is_active, price,
       updated_at,
       DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as updated_date_br
FROM products
ORDER BY updated_at DESC
LIMIT 10;

-- 7. Ver data/hora atual no timezone do Brasil
SELECT NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
       CURRENT_DATE as data_atual_brasil;

