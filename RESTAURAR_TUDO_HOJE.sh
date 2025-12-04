#!/bin/bash

# Script para restaurar TODOS os produtos de hoje (03/12/2025)

echo "=============================================="
echo "RESTAURAR PRODUTOS DE HOJE (03/12/2025)"
echo "=============================================="
echo ""

echo "1. Verificando produtos desativados de hoje..."
psql $DATABASE_URL -c "SELECT COUNT(*) as desativados FROM products WHERE is_active = false AND DATE(updated_at) = '2025-12-03';"

echo ""
echo "2. Verificando produtos ativos de hoje..."
psql $DATABASE_URL -c "SELECT COUNT(*) as ativos FROM products WHERE is_active = true AND DATE(updated_at) = '2025-12-03';"

echo ""
echo "3. Restaurando produtos DESATIVADOS de hoje..."
psql $DATABASE_URL -c "UPDATE products SET is_active = true, updated_at = NOW() WHERE DATE(updated_at) = '2025-12-03' AND is_active = false;"

echo ""
echo "4. Restaurando produtos CRIADOS hoje mas desativados..."
psql $DATABASE_URL -c "UPDATE products SET is_active = true, updated_at = NOW() WHERE DATE(created_at) = '2025-12-03' AND is_active = false;"

echo ""
echo "5. Verificando resultado final..."
psql $DATABASE_URL -c "SELECT COUNT(*) as total_ativos_hoje FROM products WHERE is_active = true AND (DATE(updated_at) = '2025-12-03' OR DATE(created_at) = '2025-12-03');"

echo ""
echo "✅ Restauração concluída!"

