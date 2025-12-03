# 🔧 Resolver Problemas em Produção

## ❌ Problema 1: Erro 500 na aba "Pendentes"

**Causa:** A coluna `approval_status` não existe no banco de dados em produção.

**Solução:** Execute a migração do banco de dados.

### Passo a Passo:

1. **Acesse o Render Dashboard:**
   - https://dashboard.render.com
   - Encontre o serviço backend (API)

2. **Abra o Shell:**
   - Clique no serviço
   - Vá em "Shell" ou use o botão "Shell"

3. **Execute a migração:**
   ```bash
   cd backend
   node src/migrations/add-registration-system.js
   ```

4. **Você deve ver:**
   ```
   ✅ Migrações do sistema de registro executadas com sucesso!
   ```

---

## ❌ Problema 2: Usuário criado não aparece na lista

**Causa:** Pode estar sendo filtrado ou não carregado corretamente.

**Soluções:**

1. **Recarregue a página** - Pressione F5 ou Ctrl+R
2. **Limpe o cache** - Tente em aba anônima
3. **Verifique se o usuário foi criado:**
   - O usuário deve aparecer na lista após recarregar

---

## ✅ Correções Aplicadas

1. ✅ Query simplificada para funcionar sem migração
2. ✅ Limite aumentado para 100 usuários por página
3. ✅ Filtro de approval_status removido temporariamente
4. ✅ Melhor tratamento de erros nas queries

---

## 📝 Próximos Passos

1. **Execute a migração** (veja Problema 1)
2. **Depois da migração:**
   - Recarregue a página
   - O erro 500 deve sumir
   - Os usuários pendentes vão aparecer
   - A lista geral vai funcionar normalmente

---

## 🔍 Verificar se Migração Foi Executada

No Render Shell, execute:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('approval_status', 'access_expires_at', 'access_duration_days');
```

Se retornar 3 linhas, a migração foi executada com sucesso! ✅

