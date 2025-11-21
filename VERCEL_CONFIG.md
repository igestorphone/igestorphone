# 🚀 Configuração do Vercel para Produção

## ⚠️ IMPORTANTE: Configurar URL da API no Vercel

Para que o sistema funcione em produção, você precisa configurar a variável de ambiente `VITE_API_URL` no Vercel.

### Passo 1: Acessar o Dashboard do Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `igestorphone` (ou o nome do seu projeto)
3. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar Variável de Ambiente

Adicione a seguinte variável:

**Nome:** `VITE_API_URL`
**Valor:** `https://sua-url-do-backend.com/api`

**Importante:**
- Substitua `sua-url-do-backend.com` pela URL real do seu backend
- Se o backend estiver em outro serviço (Render, Railway, etc.), use essa URL
- Se o backend estiver no Vercel também (como serverless function), use: `https://igestorphone.com.br/api`

### Passo 3: Verificar Ambiente

Certifique-se de adicionar a variável para:
- ✅ **Production**
- ✅ **Preview** (opcional, mas recomendado)
- ✅ **Development** (opcional)

### Passo 4: Redeploy

Após adicionar a variável:
1. Vá em **Deployments**
2. Clique nos **3 pontinhos** do último deploy
3. Selecione **Redeploy**
4. Aguarde o deploy terminar

### Exemplos de URLs do Backend

#### Se o backend estiver no Render:
```
VITE_API_URL=https://seu-backend.onrender.com/api
```

#### Se o backend estiver no Railway:
```
VITE_API_URL=https://seu-backend.railway.app/api
```

#### Se o backend estiver no Heroku:
```
VITE_API_URL=https://seu-backend.herokuapp.com/api
```

#### Se o backend estiver no Vercel (serverless):
```
VITE_API_URL=https://igestorphone.com.br/api
```

### 🔍 Verificar se Está Funcionando

1. Após o redeploy, acesse: `https://igestorphone.com.br/process-list`
2. Abra o console do navegador (F12)
3. Tente processar uma lista
4. Veja os logs:
   - `🔍 ProcessList - URL da API: https://...` (deve mostrar a URL correta)
   - Se aparecer `http://localhost:3001/api`, a variável não foi configurada corretamente

### ⚠️ Problema: Backend Não Está Deployado?

Se o backend ainda não está em produção, você precisa deployar ele primeiro:

#### Opções para Deploy do Backend:

1. **Render** (Recomendado - Gratuito):
   - Acesse: https://render.com
   - Crie um novo Web Service
   - Conecte seu repositório GitHub
   - Configure o build: `cd backend && npm install`
   - Configure o start: `cd backend && npm start`
   - Configure variáveis de ambiente (DATABASE_URL, JWT_SECRET, etc.)

2. **Railway** (Recomendado - Gratuito):
   - Acesse: https://railway.app
   - Crie um novo projeto
   - Conecte seu repositório GitHub
   - Configure o diretório: `backend`
   - Configure variáveis de ambiente

3. **Heroku** (Pago):
   - Similar ao Render/Railway

### 📝 Checklist Final

- [ ] Backend deployado e funcionando
- [ ] Variável `VITE_API_URL` configurada no Vercel
- [ ] Redeploy feito no Vercel
- [ ] Testado processamento de lista em produção
- [ ] Logs do console mostram URL correta

### 🆘 Ainda Não Funciona?

1. Verifique se o backend está respondendo:
   ```bash
   curl https://sua-url-do-backend.com/api/health
   ```
   Deve retornar: `{"status":"ok"}`

2. Verifique CORS no backend:
   - O backend precisa permitir requisições de `https://igestorphone.com.br`
   - Configure no backend: `FRONTEND_URL=https://igestorphone.com.br`

3. Verifique logs no Vercel:
   - Vercel Dashboard → Deployments → Último deploy → Functions
   - Veja se há erros

4. Console do navegador:
   - F12 → Console → Veja os logs detalhados
   - F12 → Network → Veja as requisições falhando

