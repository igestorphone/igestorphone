-- TESTAR A QUERY EXATA QUE O BACKEND USA PARA BUSCAR PRODUTOS

-- 1. Query que o backend usa (sem JOIN com suppliers primeiro, só produtos)
SELECT COUNT(*) as total_produtos_hoje
FROM products p
WHERE p.is_active = true
  AND (
    DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
    OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
  );

-- 2. Query COM JOIN (como o backend faz)
SELECT COUNT(*) as total_com_suppliers
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND (
    DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
    OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
  );

-- 3. Ver alguns produtos que deveriam aparecer
SELECT p.id, p.name, p.model, p.is_active,
       DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as updated_date_br,
       DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as created_date_br,
       s.name as supplier_name
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND (
    DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
    OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'))
  )
LIMIT 10;

-- 4. Ver data atual no Brasil
SELECT NOW() AT TIME ZONE 'America/Sao_Paulo' as agora_brasil,
       DATE((NOW() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')) as data_hoje_brasil,
       CURRENT_DATE as data_atual;

