-- EXCLUIR PRODUTOS DO REI DO IPHONE COM PREÇO R$ 0

-- 1. PRIMEIRO: Ver quais produtos serão desativados (EXECUTE ESTE PRIMEIRO PARA VERIFICAR)
SELECT 
  p.id,
  p.name,
  p.model,
  p.price,
  p.color,
  p.storage,
  s.name as supplier_name,
  p.created_at,
  p.updated_at
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND s.name ILIKE '%Rei do iPhone%'
  AND (p.price = 0 OR p.price IS NULL OR p.price < 0.01)
ORDER BY p.created_at DESC;

-- 2. DEPOIS: Desativar os produtos (EXECUTE APENAS DEPOIS DE VERIFICAR ACIMA)
UPDATE products 
SET is_active = false,
    updated_at = NOW()
WHERE id IN (
  SELECT p.id
  FROM products p
  JOIN suppliers s ON p.supplier_id = s.id
  WHERE p.is_active = true
    AND s.name ILIKE '%Rei do iPhone%'
    AND (p.price = 0 OR p.price IS NULL OR p.price < 0.01)
);

-- 3. VERIFICAR quantos foram desativados
SELECT COUNT(*) as produtos_desativados
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = false
  AND s.name ILIKE '%Rei do iPhone%'
  AND (p.price = 0 OR p.price IS NULL OR p.price < 0.01);

-- 4. Ver todos os produtos ativos do Rei do iPhone (para confirmar que restaram apenas os com preço)
SELECT 
  p.id,
  p.name,
  p.model,
  p.price,
  p.color,
  p.storage
FROM products p
JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true
  AND s.name ILIKE '%Rei do iPhone%'
ORDER BY p.price ASC, p.created_at DESC;

