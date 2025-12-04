-- VERIFICAR RESULTADO FINAL APÓS ATIVAR FORNECEDORES

-- 1. Quantos produtos aparecem agora (com fornecedores ativos):
SELECT COUNT(*) as produtos_visiveis_agora
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND s.is_active = true
  AND (
    DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  );

-- 2. Ver alguns exemplos de produtos que aparecem:
SELECT p.id, p.name, p.model, p.price, s.name as supplier_name
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND s.is_active = true
  AND (
    DATE(p.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
    OR DATE(p.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') = CURRENT_DATE
  )
ORDER BY p.price ASC
LIMIT 10;

-- 3. Total de fornecedores ativos agora:
SELECT COUNT(*) as fornecedores_ativos
FROM suppliers
WHERE is_active = true;

