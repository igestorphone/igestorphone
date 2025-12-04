# 🔄 Restaurar Produtos - Passo a Passo

## ⚡ Opção 1: SQL Direto (Mais Rápido)

### 1. Acesse o Render Shell
- Vá em **Render Dashboard**
- Selecione seu serviço de **backend**
- Clique em **Shell** (lado esquerdo)

### 2. Execute este SQL:

```sql
-- Ver quantos produtos serão restaurados
SELECT COUNT(*) as total_desativados
FROM products
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours';
```

### 3. Se mostrar produtos, execute para restaurar:

```sql
-- RESTAURAR TODOS OS PRODUTOS DESATIVADOS
UPDATE products
SET is_active = true,
    updated_at = NOW()
WHERE is_active = false
  AND updated_at >= NOW() - INTERVAL '24 hours';
```

### 4. Verificar resultado:

```sql
SELECT 
  COUNT(*) FILTER (WHERE is_active = true) as ativos,
  COUNT(*) FILTER (WHERE is_active = false) as inativos
FROM products;
```

---

## ⚡ Opção 2: Restaurar TODOS os Produtos (Se necessário)

Se quiser restaurar TODOS os produtos desativados (não só os recentes):

```sql
UPDATE products
SET is_active = true
WHERE is_active = false;
```

---

## ✅ Pronto!

Depois de executar, os produtos estarão restaurados!

