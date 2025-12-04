-- ============================================
-- RESTAURAR PRODUTOS ZERADOS POR ENGANO
-- ============================================
-- Execute este SQL no Render Shell para restaurar produtos

-- 1. Ver quantos produtos foram desativados recentemente
SELECT 
  COUNT(*) as desativados,
  MIN(updated_at) as mais_antigo,
  MAX(updated_at) as mais_recente
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '6 hours';

-- 2. Restaurar produtos desativados nas últimas 6 horas
UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '6 hours';

-- 3. Verificar resultado
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as produtos_ativos,
  COUNT(*) FILTER (WHERE is_active = false) as produtos_inativos
FROM products;

-- ============================================
-- IMPORTANTE: Configurar RESET_HOUR para 00h
-- ============================================
-- No Render Dashboard → Environment Variables:
-- Se RESET_HOUR estiver definido como 21, mude para:
-- RESET_HOUR=0
-- Ou remova a variável (0 é o padrão)

