-- DIAGNOSTICAR POR QUE OS PRODUTOS NÃO APARECEM

-- 1. Ver se há produtos sem fornecedor ou com fornecedor inativo
SELECT COUNT(*) as produtos_sem_fornecedor_ativo
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND (
    DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
    OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
  )
  AND (s.id IS NULL OR s.is_active = false);

-- 2. Ver produtos COM fornecedor ativo (que deveriam aparecer)
SELECT COUNT(*) as produtos_com_fornecedor_ativo
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND s.is_active = true
  AND (
    DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
    OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
  );

-- 3. Ver produtos sem filtro de data (todos ativos)
SELECT COUNT(*) as todos_produtos_ativos
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND s.is_active = true;

-- 4. Ver distribuição de datas dos produtos
SELECT 
  DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_brasil,
  COUNT(*) as quantidade
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND s.is_active = true
GROUP BY DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')
ORDER BY data_brasil DESC
LIMIT 7;

