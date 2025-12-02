# ⚡ Corrigir CORS - Guia Rápido

## 🎯 O Problema

Erro no console:
```
CORS policy: Response to preflight request doesn't pass access control check
```

Frontend está em `www.igestorphone.com.br` mas backend não permite.

## ✅ Solução (2 minutos)

### 1. Render → Backend → Environment

### 2. Encontre `FRONTEND_URL`

### 3. Clique em "Edit"

### 4. APAGUE tudo que está lá e coloque APENAS:

```
https://igestorphone.com.br
```

**IMPORTANTE:** Só UMA URL, sem vírgulas, sem múltiplas URLs!

### 5. Salve e aguarde 2-3 minutos

### 6. Tente fazer login novamente

✅ **O código já aceita automaticamente:**
- `https://igestorphone.com.br`
- `https://www.igestorphone.com.br`

---

## 🆘 Se Ainda Não Funcionar

Me envie:
- Qual URL está configurada no FRONTEND_URL
- O erro completo do console
- Screenshot se possível

**Vamos resolver! 💪**

