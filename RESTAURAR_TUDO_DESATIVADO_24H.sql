-- RESTAURAR TODOS os produtos desativados nas últimas 24 horas
-- ATENÇÃO: Isso vai restaurar TUDO que foi desativado nas últimas 24h

-- 1. Ver quantos serão restaurados (PRIMEIRO EXECUTE ESTE)
SELECT COUNT(*) as total_a_restaurar
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours';

-- 2. Ver alguns exemplos do que será restaurado
SELECT id, name, model, price, updated_at,
       DATE(updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo') as data_br
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC
LIMIT 20;

-- 3. RESTAURAR TUDO (execute depois de verificar acima)
UPDATE products 
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours';

-- 4. Verificar quantos foram restaurados
SELECT COUNT(*) as produtos_ativos_agora
FROM products
WHERE is_active = true;

