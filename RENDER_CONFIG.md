# 🚀 Configuração do Backend no Render

## 📋 Verificar e Configurar Variáveis de Ambiente

### Passo 1: Acessar o Dashboard do Render

1. Acesse: https://dashboard.render.com
2. Faça login na sua conta
3. Encontre o serviço do backend (geralmente chamado de "igestorphone-backend" ou similar)

### Passo 2: Verificar Variáveis de Ambiente

1. No seu serviço do backend, clique em **"Environment"** (ou "Variáveis de Ambiente")
2. Procure por estas variáveis:
   - `OPENAI_API_KEY` - **CRÍTICO**: Precisa estar configurada com sua chave da OpenAI
   - `DATABASE_URL` - URL do banco de dados PostgreSQL
   - `JWT_SECRET` - Chave secreta para JWT
   - `NODE_ENV` - Deve ser `production`

### Passo 3: Adicionar/Atualizar OPENAI_API_KEY

Se a variável `OPENAI_API_KEY` **NÃO EXISTE** ou está **VAZIA**:

1. Clique em **"Add Environment Variable"** (ou "Adicionar Variável")
2. **Key**: `OPENAI_API_KEY`
3. **Value**: Sua chave da OpenAI (começa com `sk-...`)
4. Clique em **"Save Changes"**

**Onde conseguir a chave da OpenAI:**
- Acesse: https://platform.openai.com/api-keys
- Faça login na sua conta OpenAI
- Clique em "Create new secret key"
- Copie a chave (ela só aparece uma vez!)

### Passo 4: Verificar Logs do Backend

1. No seu serviço do backend, clique em **"Logs"** (ou "Logs" na barra lateral)
2. Procure por erros recentes:
   - `❌ Erro na validação de lista`
   - `❌ Erro na API da OpenAI`
   - `OPENAI_API_KEY`
3. Os logs mostrarão o erro específico

### Passo 5: Reiniciar o Serviço (se necessário)

Após adicionar/atualizar variáveis de ambiente:

1. Vá em **"Manual Deploy"** → **"Clear build cache & deploy"**
2. Ou clique em **"Manual Deploy"** → **"Deploy latest commit"**
3. Aguarde o deploy terminar (pode levar alguns minutos)

## 🔍 Verificar se Está Funcionando

### Teste 1: Health Check
```bash
curl https://api.igestorphone.com.br/api/health
```
Deve retornar: `{"status":"ok"}`

### Teste 2: Verificar Logs em Tempo Real

1. No Render, vá em **"Logs"**
2. Tente processar uma lista no frontend
3. Veja os logs aparecerem em tempo real
4. Procure por:
   - `🔍 ProcessList - Enviando lista BRUTA para IA processar`
   - `❌ Erro na validação de lista` (se houver erro)
   - `❌ Erro na API da OpenAI` (se houver erro da OpenAI)

## ⚠️ Problemas Comuns

### Erro: "OPENAI_API_KEY is not defined"
**Solução**: Adicione a variável `OPENAI_API_KEY` no Render (Passo 3)

### Erro: "Invalid API key"
**Solução**: 
- Verifique se a chave está correta (começa com `sk-`)
- Gere uma nova chave na OpenAI se necessário
- Certifique-se de que copiou a chave completa (sem espaços)

### Erro: "Rate limit exceeded"
**Solução**: 
- Você atingiu o limite de uso da OpenAI
- Aguarde alguns minutos e tente novamente
- Ou verifique seu plano da OpenAI

### Erro: "500 Internal Server Error"
**Solução**:
- Verifique os logs do Render para ver o erro específico
- Pode ser problema com a chave da OpenAI ou com o banco de dados

## 📝 Checklist

- [ ] Backend deployado no Render
- [ ] Variável `OPENAI_API_KEY` configurada
- [ ] Variável `DATABASE_URL` configurada
- [ ] Variável `JWT_SECRET` configurada
- [ ] `NODE_ENV=production` configurado
- [ ] Health check retorna `{"status":"ok"}`
- [ ] Logs do backend estão acessíveis
- [ ] Testado processamento de lista

## 🆘 Ainda Não Funciona?

1. **Verifique os logs do Render**:
   - Vá em Logs → Veja os erros mais recentes
   - Procure por mensagens de erro específicas

2. **Teste a chave da OpenAI**:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer SUA_CHAVE_AQUI"
   ```
   Deve retornar uma lista de modelos (não erro 401)

3. **Verifique o build do backend**:
   - No Render, vá em "Events"
   - Veja se o último deploy foi bem-sucedido
   - Se houver erros no build, corrija-os primeiro

4. **Entre em contato**:
   - Se ainda não funcionar, envie:
     - Screenshot dos logs do Render
     - Screenshot das variáveis de ambiente (ocultando valores sensíveis)
     - Mensagem de erro completa






