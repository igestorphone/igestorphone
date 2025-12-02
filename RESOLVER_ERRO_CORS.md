# 🔧 Resolver Erro de CORS

## ⚠️ Problema

Erro no console:
```
Access to XMLHttpRequest at 'https://api.igestorphone.com.br/api/auth/login' 
from origin 'https://www.igestorphone.com.br' has been blocked by CORS policy
```

O frontend está em `www.igestorphone.com.br` mas o backend não permite essa origem.

## ✅ Solução

### Passo 1: Corrigir FRONTEND_URL no Render

1. Acesse: https://dashboard.render.com
2. Vá em seu serviço de **backend**
3. Clique em **"Environment"**
4. Encontre `FRONTEND_URL`
5. Clique em **"Edit"**

### Passo 2: Configurar Corretamente

**Opção A - Se você quer aceitar ambos (com e sem www):**

Coloque APENAS:
```
https://igestorphone.com.br
```

O código agora aceita automaticamente:
- `https://igestorphone.com.br`
- `https://www.igestorphone.com.br`

**Opção B - Se quiser especificar ambos manualmente:**

```
https://igestorphone.com.br,https://www.igestorphone.com.br
```

### Passo 3: Salvar e Aguardar

1. Clique em **"Save Changes"**
2. Aguarde o backend reiniciar (2-3 minutos)
3. Verifique nos logs quando reiniciou

### Passo 4: Testar Novamente

1. Acesse: https://www.igestorphone.com.br/login
2. Tente fazer login novamente
3. O erro de CORS deve desaparecer

---

## 🔍 Verificar se Funcionou

### No Console do Navegador:

**Antes (Erro):**
```
❌ Access to XMLHttpRequest... blocked by CORS policy
```

**Depois (Sucesso):**
```
✅ API Request - URL: /auth/login
✅ Login realizado com sucesso
```

---

## 🐛 Se Ainda Não Funcionar

### Verificar Logs do Backend:

1. Render → Backend → **Logs**
2. Procure por mensagens de CORS:
   - `🚫 CORS bloqueado - Origem: ...`
   - `✅ Origens permitidas: ...`

### Testar Manualmente:

No terminal do Render (Shell):

```bash
# Verificar variável de ambiente
echo $FRONTEND_URL

# Deve mostrar:
# https://igestorphone.com.br
```

---

## 📝 Configurações Recomendadas

**No Render (Environment):**

```
FRONTEND_URL=https://igestorphone.com.br
```

O sistema agora aceita automaticamente:
- ✅ `https://igestorphone.com.br`
- ✅ `https://www.igestorphone.com.br`

---

## ✅ Checklist

- [ ] Acessei o Render dashboard
- [ ] Fui em Backend → Environment
- [ ] Editei `FRONTEND_URL` para `https://igestorphone.com.br`
- [ ] Salvei as alterações
- [ ] Aguardei backend reiniciar (2-3 minutos)
- [ ] Tentei fazer login novamente
- [ ] Erro de CORS desapareceu ✅

---

**Depois de corrigir, o login deve funcionar! 🚀**

