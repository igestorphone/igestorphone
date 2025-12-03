# 🔧 Corrigir: Link de Cadastro Fica Vazio/Travado

## 🚨 Problema

O link de cadastro abre, mas a página fica em branco ou mostra apenas "Verificando link de cadastro..." sem progredir.

---

## ✅ Correções Aplicadas

1. ✅ **Timeout adicionado** - Se a verificação demorar mais de 15 segundos, mostra erro
2. ✅ **Melhor tratamento de erros** - Mensagens mais específicas
3. ✅ **Logs melhorados** - Para facilitar diagnóstico

---

## 🔍 Possíveis Causas

### 1. **Rota do backend não está respondendo**

**Verificar:**
```bash
# Teste direto no backend
curl https://seu-backend.onrender.com/api/register/TOKEN_AQUI
```

**Solução:** Verifique se o backend está online no Render Dashboard

---

### 2. **Tabela `registration_tokens` não existe**

**Verificar (Render Shell):**
```sql
SELECT * FROM registration_tokens LIMIT 1;
```

**Se der erro, executar migration:**
```bash
cd backend/src/migrations
node add-registration-system.js
```

---

### 3. **Token inválido ou expirado**

**Solução:** Gere um novo link de cadastro

---

### 4. **URL da API incorreta no frontend**

**Verificar no Vercel:**
- Variável `VITE_API_URL` está configurada?
- URL está correta? (ex: `https://seu-backend.onrender.com/api`)

---

### 5. **Erro de CORS**

**Verificar logs do Render:**
- Procure por erros de CORS nos logs do backend

**Solução:** Verifique a configuração de CORS no `server.js`

---

## 🚀 Diagnóstico Rápido

### Passo 1: Abra o Console do Navegador (F12)

Veja se há mensagens como:
- `🔍 Verificando token: ...`
- `✅ Token válido:` ou `❌ Erro ao verificar token:`

### Passo 2: Verifique a Aba Network (F12 → Network)

1. Recarregue a página com o link
2. Procure por uma requisição para `/api/register/...`
3. Clique nela e veja:
   - **Status:** 200? 404? 400? 500?
   - **Response:** O que retorna?

### Passo 3: Teste o Backend Diretamente

Substitua `SEU_TOKEN` pelo token do link:
```bash
curl https://seu-backend.onrender.com/api/register/SEU_TOKEN
```

**Resposta esperada:**
- `{"message":"Token válido","data":{...}}` ✅
- `{"message":"Token inválido"}` ❌
- `{"message":"Este link expirou"}` ❌
- Erro 500 ❌ (problema no banco de dados)

---

## 🔧 Ações Imediatas

1. **Verificar se backend está online**
   - Render Dashboard → Ver status do serviço

2. **Verificar variável de ambiente `VITE_API_URL` no Vercel**
   - Deve estar: `https://seu-backend.onrender.com/api`

3. **Gerar um novo link**
   - Link antigo pode estar com problema

4. **Verificar tabela `registration_tokens`**
   - Execute a migration se necessário

---

## 📋 Checklist de Verificação

- [ ] Backend está online no Render
- [ ] Tabela `registration_tokens` existe no banco
- [ ] Token existe no banco (verificar com SELECT)
- [ ] Token não expirou (verificar data)
- [ ] `VITE_API_URL` está configurado no Vercel
- [ ] Frontend foi feito redeploy após alterações
- [ ] Console do navegador não mostra erros críticos

---

**Status:** ✅ Correções aplicadas - Aguardando deploy e verificação

