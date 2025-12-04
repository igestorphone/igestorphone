-- RESTAURAR TODOS os produtos desativados nas últimas 6 horas
-- (caso os produtos tenham sido resetados recentemente)

-- 1. Ver quantos serão restaurados
SELECT COUNT(*) as total_a_restaurar
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '6 hours';

-- 2. RESTAURAR (execute depois de verificar)
UPDATE products 
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '6 hours';

-- 3. Verificar resultado
SELECT COUNT(*) as produtos_restaurados
FROM products
WHERE is_active = true
  AND updated_at >= NOW() - INTERVAL '1 hour';

