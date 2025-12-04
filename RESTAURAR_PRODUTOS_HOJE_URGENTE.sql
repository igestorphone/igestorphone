-- COMANDO SQL URGENTE PARA RESTAURAR TODOS OS PRODUTOS DE HOJE
-- Execute este comando no Render Shell ou diretamente no banco de dados

-- 1. Ver quantos produtos foram desativados hoje
SELECT COUNT(*) as desativados_hoje
FROM products
WHERE is_active = false
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- 2. RESTAURAR TODOS OS PRODUTOS DE HOJE (ATUALIZADOS OU CRIADOS HOJE)
UPDATE products 
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- 3. Verificar resultado
SELECT COUNT(*) as produtos_ativos_hoje
FROM products
WHERE is_active = true
  AND (
    DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

