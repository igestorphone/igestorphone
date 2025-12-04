-- ============================================
-- CORRIGIR PRODUTOS DE HOJE (03/12) E GARANTIR RESET À MEIA-NOITE
-- ============================================

-- 1. Primeiro, ver quantos produtos precisam ser corrigidos
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total
FROM products
WHERE is_active = true
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC;

-- 2. Ver produtos que foram processados hoje mas estão com data de 02/12
SELECT COUNT(*) as produtos_02_12
FROM products
WHERE is_active = true
  AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = '2025-12-02'
  AND updated_at >= NOW() - INTERVAL '30 hours';

-- 3. ATUALIZAR produtos processados hoje para ter data de HOJE (03/12)
-- Produtos que foram atualizados nas últimas 30 horas mas estão com data 02/12
UPDATE products
SET updated_at = (
  -- Definir como início de hoje (03/12) às 12:00 no timezone do Brasil
  ('2025-12-03 12:00:00'::timestamp AT TIME ZONE 'America/Sao_Paulo')
  AT TIME ZONE 'UTC'
)
WHERE is_active = true
  AND DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = '2025-12-02'
  AND updated_at >= NOW() - INTERVAL '30 hours';

-- 4. Verificar resultado após correção
SELECT 
  DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as total
FROM products
WHERE is_active = true
GROUP BY DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 5;

