# 🔧 Corrigir FRONTEND_URL no Render

## ⚠️ Problema Encontrado

A variável `FRONTEND_URL` está com múltiplas URLs:
```
https://igestorphone.vercel.app,https://www.igestorphone.com.br,https://igestorphone.com.br,http://localhost:3000
```

Isso está causando os links malformados!

## ✅ Solução: Editar para Uma Única URL

### Passo 1: Editar a Variável

1. Na tela que você está (Environment Variables)
2. Clique no botão **"Edit"** (no canto superior direito)
3. Você vai poder editar os valores

### Passo 2: Corrigir o Valor de FRONTEND_URL

1. Encontre a linha do `FRONTEND_URL`
2. Clique no campo de valor (onde está a URL longa)
3. **Apague tudo** que está lá
4. Coloque **APENAS UMA URL**:

**Opção A - Se seu site está no Vercel:**
```
https://igestorphone.com.br
```
(Use o domínio principal, sem múltiplas URLs)

**Opção B - Se quiser usar o vercel.app:**
```
https://igestorphone.vercel.app
```

**IMPORTANTE:** Escolha **UMA** única URL, não múltiplas!

### Passo 3: Salvar

1. Clique em **"Save Changes"** (ou botão de salvar)
2. Aguarde alguns minutos para o Render reiniciar o serviço
3. Você pode verificar nos logs quando reiniciou

---

## 🎯 Qual URL Usar?

**Recomendação:** Use o domínio principal do seu site

Se você tem:
- `igestorphone.com.br` → Use: `https://igestorphone.com.br`
- `www.igestorphone.com.br` → Use: `https://www.igestorphone.com.br`
- Apenas vercel.app → Use: `https://igestorphone.vercel.app`

**Escolha UMA e use sempre a mesma!**

---

## ✅ Depois de Corrigir

1. Aguarde o backend reiniciar (2-3 minutos)
2. Gere um **NOVO** link de cadastro
3. O link deve aparecer correto:
   - ✅ `https://igestorphone.com.br/register/abc123...`
   - ❌ Não mais `localhost:3000`

---

## 📝 Valores Corretos vs Incorretos

### ❌ ERRADO (atual):
```
FRONTEND_URL=https://igestorphone.vercel.app,https://www.igestorphone.com.br,https://igestorphone.com.br,http://localhost:3000
```

### ✅ CORRETO (escolha um):
```
FRONTEND_URL=https://igestorphone.com.br
```

OU

```
FRONTEND_URL=https://igestorphone.vercel.app
```

**Mas NUNCA múltiplas URLs juntas!**

---

## 🚀 Pronto!

Depois de corrigir e o backend reiniciar, os links vão funcionar perfeitamente!

