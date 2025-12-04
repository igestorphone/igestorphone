-- ============================================
-- RESTAURAR PRODUTOS DE HOJE (03/12)
-- ============================================

-- 1. Ver quantos produtos de HOJE foram desativados
SELECT 
  COUNT(*) as produtos_desativados_hoje,
  MIN(updated_at) as mais_antigo,
  MAX(updated_at) as mais_recente
FROM products
WHERE is_active = false
  AND DATE(updated_at) = CURRENT_DATE;

-- 2. RESTAURAR PRODUTOS DE HOJE
UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND DATE(updated_at) = CURRENT_DATE;

-- 3. Verificar resultado
SELECT 
  COUNT(*) FILTER (WHERE is_active = true AND DATE(updated_at) = CURRENT_DATE) as produtos_ativos_hoje,
  COUNT(*) FILTER (WHERE is_active = false AND DATE(updated_at) = CURRENT_DATE) as produtos_inativos_hoje
FROM products;

-- 4. Ver total de produtos ativos de hoje
SELECT COUNT(*) as total_produtos_ativos_hoje
FROM products
WHERE is_active = true
  AND DATE(updated_at) = CURRENT_DATE;

