-- ============================================
-- RESTAURAR TODOS OS PRODUTOS DE HOJE (03/12/2025)
-- ============================================

-- PRIMEIRO: Verificar quantos produtos de hoje foram desativados
SELECT 
  COUNT(*) as total_desativados_hoje
FROM products
WHERE is_active = false
  AND DATE(updated_at) = '2025-12-03';

-- SEGUNDO: Restaurar TODOS os produtos de hoje (mesmo se foram criados hoje mas desativados)
UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE DATE(updated_at) = '2025-12-03'
  AND is_active = false;

-- TERCEIRO: Verificar resultado
SELECT 
  COUNT(*) as produtos_ativos_hoje
FROM products
WHERE is_active = true
  AND DATE(updated_at) = '2025-12-03';

-- QUARTO: Também restaurar produtos que foram CRIADOS hoje (caso tenham sido desativados)
UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE DATE(created_at) = '2025-12-03'
  AND is_active = false;

-- QUINTO: Ver total final de produtos ativos de hoje
SELECT 
  COUNT(*) as total_produtos_ativos_hoje
FROM products
WHERE is_active = true
  AND (DATE(updated_at) = '2025-12-03' OR DATE(created_at) = '2025-12-03');

