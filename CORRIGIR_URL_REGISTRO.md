# 🔧 Corrigir URL dos Links de Registro

## ⚠️ Problema Identificado

O link está sendo gerado com `localhost:3000` em vez do domínio de produção porque a variável `FRONTEND_URL` não está configurada no backend.

---

## ✅ Solução: Configurar FRONTEND_URL no Render

### Passo 1: Acessar o Render

1. Acesse: https://dashboard.render.com
2. Faça login
3. Encontre seu serviço de **backend** (não o frontend!)

### Passo 2: Adicionar Variável de Ambiente

1. No serviço do backend, clique em **"Environment"** (ou "Variáveis de Ambiente")
2. Procure se já existe a variável `FRONTEND_URL`
3. Se **NÃO existir**, clique em **"Add Environment Variable"**

### Passo 3: Configurar o Valor

**Opção A - Se seu site está no Vercel:**
```
Key: FRONTEND_URL
Value: https://igestorphone.com.br
```
(Substitua pelo seu domínio real)

**Opção B - Se está em outro lugar:**
```
Key: FRONTEND_URL
Value: https://seu-dominio.com.br
```

### Passo 4: Salvar e Reiniciar

1. Clique em **"Save Changes"**
2. O Render vai reiniciar automaticamente o serviço
3. Aguarde alguns minutos para o restart

---

## 🔍 Verificar Qual é o Seu Domínio

### Se está no Vercel:
- Acesse: https://vercel.com/dashboard
- Encontre seu projeto
- Veja o domínio em "Domains" ou na URL do preview

### Se está em outro lugar:
- Verifique qual é a URL do seu site em produção
- Use essa URL completa (com https://)

---

## 🎯 Valores Comuns

**Vercel:**
```
FRONTEND_URL=https://igestorphone.vercel.app
```
OU se tiver domínio customizado:
```
FRONTEND_URL=https://igestorphone.com.br
```

**Netlify:**
```
FRONTEND_URL=https://igestorphone.netlify.app
```

**Render (se frontend também estiver no Render):**
```
FRONTEND_URL=https://igestorphone.onrender.com
```

---

## ✅ Como Testar

### 1. Após Configurar:

1. Aguarde o backend reiniciar (alguns minutos)
2. No frontend, vá em "Gerenciar Usuários"
3. Aba "Links de Cadastro"
4. Clique em "Gerar Link"
5. O link deve aparecer com o domínio correto:
   - ✅ `https://igestorphone.com.br/register/abc123...`
   - ❌ `http://localhost:3000/register/abc123...`

### 2. Testar o Link:

1. Copie o link gerado
2. Cole em uma aba anônima/privada
3. Deve abrir a página de registro (não erro DNS)

---

## 🐛 Se Ainda Não Funcionar

### Problema: Link ainda mostra localhost

**Solução:**
1. Verifique se salvou a variável corretamente
2. Verifique se o backend reiniciou (veja logs)
3. Gere um **NOVO** link (os links antigos ainda terão localhost)
4. Se ainda não funcionar, veja os logs do backend

### Problema: URL está malformada (múltiplas URLs)

**Solução:**
Isso pode acontecer se:
1. Você copiou o link de forma errada
2. Ou há um problema na exibição

**Tente:**
- Gerar um novo link
- Copiar apenas a parte do link que começa com `https://`
- Verificar se não há espaços ou quebras de linha

---

## 📝 Checklist

- [ ] Acessei o Render dashboard
- [ ] Encontrei o serviço de BACKEND
- [ ] Fui em "Environment"
- [ ] Adicionei/Atualizei `FRONTEND_URL`
- [ ] Configurei com o domínio correto (https://...)
- [ ] Salvei as alterações
- [ ] Aguardei o backend reiniciar
- [ ] Gerei um NOVO link
- [ ] Testei o link em aba anônima
- [ ] Funcionou! ✅

---

## 🆘 Ajuda Rápida

**Qual domínio usar?**
- Se não souber, me diga onde está hospedado seu frontend
- Vercel? Netlify? Render? Outro?

**Não encontro "Environment"?**
- Pode estar em "Settings" → "Environment"
- Ou "Configurações" → "Variáveis de Ambiente"

**Ainda com erro?**
- Me envie:
  - Qual domínio você configurou
  - O link que está sendo gerado
  - Screenshot se possível

---

**Configure isso e os links vão funcionar perfeitamente! 🚀**

