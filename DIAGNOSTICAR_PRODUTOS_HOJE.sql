-- ============================================
-- DIAGNOSTICAR PRODUTOS DE HOJE (03/12)
-- ============================================

-- 1. Ver produtos DESATIVADOS de hoje
SELECT 
  COUNT(*) as desativados_hoje,
  MIN(updated_at) as primeiro_desativado,
  MAX(updated_at) as ultimo_desativado
FROM products
WHERE is_active = false
  AND DATE(updated_at) = '2025-12-03';

-- 2. Ver produtos ATIVOS de hoje
SELECT 
  COUNT(*) as ativos_hoje,
  MIN(updated_at) as primeiro_atualizado,
  MAX(updated_at) as ultimo_atualizado
FROM products
WHERE is_active = true
  AND DATE(updated_at) = '2025-12-03';

-- 3. Ver TODOS os produtos de hoje (ativos e inativos)
SELECT 
  is_active,
  COUNT(*) as quantidade
FROM products
WHERE DATE(updated_at) = '2025-12-03'
GROUP BY is_active;

-- 4. Ver alguns exemplos de produtos de hoje
SELECT 
  id,
  name,
  model,
  is_active,
  updated_at,
  created_at
FROM products
WHERE DATE(updated_at) = '2025-12-03'
ORDER BY updated_at DESC
LIMIT 10;

-- 5. Ver produtos desativados de hoje (detalhes)
SELECT 
  id,
  name,
  model,
  supplier_id,
  is_active,
  updated_at
FROM products
WHERE is_active = false
  AND DATE(updated_at) = '2025-12-03'
LIMIT 20;

