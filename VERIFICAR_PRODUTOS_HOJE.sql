-- VERIFICAR PRODUTOS DE HOJE NO BANCO DE DADOS

-- 1. Ver data/hora atual no timezone do Brasil
SELECT 
  NOW() as agora_utc,
  NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
  CURRENT_DATE as data_atual_banco,
  DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) as data_hoje_brasil;

-- 2. Contar produtos ATIVOS criados HOJE
SELECT 
  COUNT(*) as produtos_criados_hoje,
  'Criados hoje' as tipo
FROM products
WHERE is_active = true
  AND DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
      DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'));

-- 3. Contar produtos ATIVOS atualizados HOJE
SELECT 
  COUNT(*) as produtos_atualizados_hoje,
  'Atualizados hoje' as tipo
FROM products
WHERE is_active = true
  AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
      DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'));

-- 4. Contar produtos ATIVOS criados OU atualizados HOJE (filtro usado pelo backend)
SELECT 
  COUNT(*) as produtos_hoje_total,
  'Total (criados OU atualizados hoje)' as tipo
FROM products
WHERE is_active = true
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
      DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
      DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
  );

-- 5. Ver últimos 20 produtos criados/atualizados (para debug)
SELECT 
  id,
  name,
  model,
  price,
  is_active,
  created_at,
  updated_at,
  DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_criacao_br,
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_atualizacao_br,
  CASE 
    WHEN DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
         DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
      THEN 'ATUALIZADO HOJE'
    WHEN DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = 
         DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
      THEN 'CRIADO HOJE'
    ELSE 'OUTRO DIA'
  END as status_hoje
FROM products
ORDER BY updated_at DESC, created_at DESC
LIMIT 20;
