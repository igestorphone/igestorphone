-- ============================================
-- RESTAURAR PRODUTOS - EXECUTE ESTE SQL
-- ============================================

-- PASSO 1: Ver quantos produtos foram desativados
SELECT 
  COUNT(*) as total_desativados,
  MIN(updated_at) as desativado_mais_antigo,
  MAX(updated_at) as desativado_mais_recente
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours';

-- PASSO 2: RESTAURAR PRODUTOS (Execute depois de ver o resultado acima)
UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours';

-- PASSO 3: Verificar resultado
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
  COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos
FROM products;

