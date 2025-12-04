# ✅ Verificar FRONTEND_URL no Backend

## 🔍 Problema

Os links podem estar sendo gerados com URL incorreta se a variável `FRONTEND_URL` não estiver configurada corretamente no backend (Render).

## ✅ Solução

### 1. Verificar/Configurar FRONTEND_URL no Render

1. Acesse: https://dashboard.render.com
2. Entre no seu serviço do backend (igestorphone)
3. Vá em **Environment**
4. Procure pela variável: `FRONTEND_URL`

### 2. Valor Correto

A variável deve estar configurada como:

```
FRONTEND_URL=https://igestorphone.com.br
```

**OU se tiver múltiplos domínios:**

```
FRONTEND_URL=https://igestorphone.com.br,https://www.igestorphone.com.br
```

### 3. Importante

- ✅ **NÃO** deve terminar com `/` (barra)
- ✅ Deve usar `https://` (não http)
- ✅ Deve ser exatamente o domínio do frontend

### 4. Reiniciar o Serviço

Após adicionar/modificar a variável:

1. No Render, vá em **Manual Deploy**
2. Clique em **Clear build cache & deploy**
3. Aguarde o deploy finalizar

## 🧪 Testar

Após configurar, gere um novo link:

1. Acesse o sistema: https://igestorphone.com.br/manage-users
2. Clique em "Convidar Novo Usuário"
3. O link gerado deve ser: `https://igestorphone.com.br/register/SEU_TOKEN`

Se o link estiver correto, está tudo certo!

## 📝 Verificação Rápida

O link que funciona é:
```
https://igestorphone.com.br/register/c9f0b8910c7d74aabd6dd49dce1a41d5384065742de7a623c500c39b426ecffd
```

Os novos links devem ter o mesmo formato:
```
https://igestorphone.com.br/register/SEU_TOKEN
```

