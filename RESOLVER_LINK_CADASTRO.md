# 🔧 Resolver: Link de Cadastro Não Funciona

## 🚨 Diagnóstico Rápido

### Passo 1: O que acontece quando você clica no link?

**Opção A: Não abre nada / Tela em branco**
- ✅ Verifique o console do navegador (F12 → Console)
- ✅ Veja se há erros em vermelho

**Opção B: Mostra mensagem de erro**
- ✅ Qual mensagem aparece?
- ✅ Copie a mensagem exata

**Opção C: Redireciona para outra página**
- ✅ Para onde redireciona?
- ✅ Verifique se `vercel.json` existe

**Opção D: Link parece inválido**
- ✅ Gere um novo link
- ✅ Copie o link completo (não apenas parte dele)

---

## 🔍 Verificações Importantes

### 1. Tabela `registration_tokens` existe?

Execute no Render Shell:
```sql
SELECT * FROM registration_tokens LIMIT 1;
```

**Se der erro:** Execute a migration:
```bash
cd backend/src/migrations
node add-registration-system.js
```

### 2. Variável `FRONTEND_URL` está configurada?

No Render Dashboard → Environment:
- Nome: `FRONTEND_URL`
- Valor: `https://igestorphone.com.br` (sem barra final)

### 3. Arquivo `vercel.json` existe?

Na raiz do projeto deve existir:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 4. Link foi gerado corretamente?

1. Vá em "Gerenciar Usuários"
2. Clique em "Convidar Novo Usuário"
3. Copie o link COMPLETO (começa com `https://...`)

---

## 🐛 Problemas Comuns

### ❌ "Token inválido"
- **Causa:** Token não existe no banco
- **Solução:** Gere um novo link

### ❌ "Este link expirou"
- **Causa:** Link passou de 7 dias
- **Solução:** Gere um novo link

### ❌ Erro 500
- **Causa:** Tabela não existe ou erro no banco
- **Solução:** Execute a migration

### ❌ Redireciona para tela inicial
- **Causa:** Problema com Vercel routing
- **Solução:** Verifique `vercel.json` e faça redeploy

### ❌ Tela em branco
- **Causa:** Erro JavaScript
- **Solução:** Abra F12 → Console e veja os erros

---

## ✅ Teste Rápido

### 1. Teste o backend diretamente:

Substitua `SEU_TOKEN` pelo token do link:
```bash
curl https://seu-backend.onrender.com/api/register/SEU_TOKEN
```

**Resposta esperada:**
- `{"message":"Token válido","data":{...}}` ✅
- `{"message":"Token inválido"}` ❌ (token não existe)
- `{"message":"Este link expirou"}` ❌ (token expirado)

### 2. Teste no navegador:

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Clique no link de cadastro
4. Veja as mensagens no console:
   - `🔍 Verificando token: ...` (aparece?)
   - `✅ Token válido` (aparece?)
   - Ou algum erro?

5. Vá na aba **Network**
6. Recarregue a página com o link
7. Procure por uma requisição para `/api/register/...`
8. Clique nela e veja:
   - **Status:** 200? 404? 400? 500?
   - **Response:** O que retorna?

---

## 📋 Checklist Completo

- [ ] Tabela `registration_tokens` existe no banco
- [ ] Variável `FRONTEND_URL` está configurada no Render
- [ ] Arquivo `vercel.json` existe na raiz
- [ ] Link foi gerado hoje (não está expirado)
- [ ] Link foi copiado completo (não apenas o token)
- [ ] Backend está online (Render Dashboard)
- [ ] Frontend está online (Vercel Dashboard)
- [ ] Não há erros no console do navegador

---

## 🆘 Ainda não funcionou?

**Me envie estas informações:**

1. **Screenshot da tela** (o que aparece quando clica no link)

2. **Console do navegador (F12 → Console):**
   - Copie todas as mensagens em vermelho

3. **Aba Network (F12 → Network):**
   - Clique no link
   - Encontre a requisição para `/api/register/...`
   - Me envie:
     - Status Code
     - Response Body

4. **URL do link** (pode mascarar o token):
   - Exemplo: `https://igestorphone.com.br/register/abc123...`

5. **Logs do Render:**
   - Render Dashboard → Logs
   - Veja se há erros relacionados a `/register/`

---

## 🚀 Solução Rápida (Tentativa)

Se nada funcionar, tente:

1. **Gerar um novo link** (pode ter algum problema com o anterior)
2. **Limpar cache do navegador** (Ctrl+Shift+Del)
3. **Abrir em aba anônima/privada**
4. **Verificar se backend está online** (Render Dashboard)
5. **Fazer redeploy do frontend** (Vercel Dashboard)

---

**Ajuda rápida:** Me diga qual das opções acima acontece quando você clica no link! 🚀

