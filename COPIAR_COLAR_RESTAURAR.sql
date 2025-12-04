-- ============================================
-- RESTAURAR TODOS OS PRODUTOS DESATIVADOS
-- ============================================
-- Copie e cole este comando no Render Shell

UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false;

