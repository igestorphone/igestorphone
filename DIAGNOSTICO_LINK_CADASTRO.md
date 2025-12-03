# 🔍 Diagnóstico: Link de Cadastro Não Funciona

## ⚠️ Problemas Comuns e Soluções

### 1️⃣ **O link abre mas mostra erro**

#### Verifique:
- **Erro no console do navegador (F12)**
- **Mensagem exibida na tela**

#### Possíveis causas:
- Token inválido ou expirado
- Tabela `registration_tokens` não existe no banco
- Erro de CORS
- URL do backend incorreta

---

### 2️⃣ **O link redireciona para tela inicial**

#### Possível causa:
- Problema com o Vercel (SPA routing)
- Rota `/register/:token` não está sendo reconhecida

#### Solução:
1. Verifique se o arquivo `vercel.json` existe na raiz do projeto
2. Verifique se contém:
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

---

### 3️⃣ **Tela em branco**

#### Possível causa:
- Erro JavaScript no frontend
- Token inválido na verificação inicial

#### Como diagnosticar:
1. Abra o console do navegador (F12)
2. Veja se há erros em vermelho
3. Verifique a aba "Network" - veja se a requisição para `/api/register/:token` está sendo feita

---

### 4️⃣ **"Token inválido" ou "Link expirado"**

#### Possíveis causas:
- Token não existe no banco de dados
- Token expirou (padrão: 7 dias)
- Link foi copiado incorretamente

#### Solução:
1. Gere um novo link
2. Copie o link completo (não apenas o token)
3. Verifique se o token está no banco de dados

---

### 5️⃣ **Erro 500 ou "Erro interno do servidor"**

#### Possível causa:
- Tabela `registration_tokens` não existe
- Erro na query do banco de dados

#### Como verificar:
1. Acesse o Render Dashboard
2. Vá em **Shell**
3. Execute:
```sql
SELECT * FROM registration_tokens LIMIT 1;
```

Se der erro, a tabela não existe. Execute a migration:
```bash
cd backend/src/migrations
node add-registration-system.js
```

---

## 🔧 Verificações Rápidas

### ✅ Checklist:

- [ ] Link foi gerado corretamente (copiou o link completo?)
- [ ] Link não está expirado (verifique a data de expiração)
- [ ] Tabela `registration_tokens` existe no banco
- [ ] `FRONTEND_URL` está configurada corretamente no Render
- [ ] `vercel.json` existe e está configurado
- [ ] Não há erros no console do navegador
- [ ] A URL do backend está correta (`VITE_API_URL` no Vercel)

---

## 🚀 Teste Rápido

### 1. Teste se o backend está respondendo:
```bash
curl https://seu-backend.onrender.com/api/register/TOKEN_DE_TESTE
```

**Resposta esperada:**
- Se o token não existir: `{"message":"Token inválido"}`
- Se existir mas expirado: `{"message":"Este link expirou"}`
- Se válido: `{"message":"Token válido","data":{...}}`

### 2. Verifique no navegador:
1. Abra o DevTools (F12)
2. Vá na aba "Network"
3. Clique no link de cadastro
4. Veja se a requisição para `/api/register/:token` aparece
5. Veja o status da resposta

---

## 🐛 Erros Específicos

### "Cannot GET /register/..."
- **Causa:** Rota não encontrada
- **Solução:** Verifique se a rota está registrada no `server.js` e se está acessível publicamente

### Erro de CORS
- **Causa:** Backend não permite requisições do frontend
- **Solução:** Verifique a configuração de CORS no `server.js`

### "registration_tokens does not exist"
- **Causa:** Tabela não foi criada
- **Solução:** Execute a migration `add-registration-system.js`

---

## 📞 Informações para Diagnóstico

Quando reportar o problema, forneça:

1. **O que acontece exatamente?**
   - Link não abre?
   - Mostra erro?
   - Tela branca?
   - Redireciona?

2. **Mensagem de erro (se houver):**
   - Copie a mensagem exata

3. **Console do navegador:**
   - Abra F12 → Console
   - Veja se há erros em vermelho
   - Copie os erros

4. **Aba Network:**
   - F12 → Network
   - Tente acessar o link
   - Veja qual requisição falha
   - Copie o status e resposta

5. **URL do link:**
   - Qual é a URL completa do link?
   - (Pode mascarar o token se quiser)

---

## ✅ Solução Rápida (Tentativa)

Se nada funcionar, tente:

1. **Gerar um novo link** (link antigo pode estar com problema)
2. **Limpar cache do navegador** (Ctrl+Shift+Del)
3. **Abrir em aba anônima/privada**
4. **Verificar se o backend está online** (Render Dashboard)

---

**Precisa de mais ajuda?** Me envie:
- Screenshot da tela
- Erros do console
- URL do link (mascarada)

