# 🔧 Configurar Novo Token do GitHub

## ✅ Token Criado com Sucesso!

Agora você precisa configurar esse token nas plataformas de deploy.

## 🚨 IMPORTANTE - Segurança

**⚠️ Tokens são secretos!** Não compartilhe em:
- Repositórios públicos
- Screenshots
- Mensagens públicas
- Chats públicos

Se você compartilhou acidentalmente, pode **regenerar** o token no GitHub para invalidar o anterior.

## 📋 Configurar no Render (Backend)

### Passo a passo:

1. **Acesse o Render:**
   - Vá em: https://dashboard.render.com

2. **Selecione seu serviço backend:**
   - Clique no serviço do backend

3. **Vá em Settings → Environment:**
   - Menu lateral → **"Settings"**
   - Aba **"Environment"**

4. **Adicione/Atualize a variável:**
   - Procure por: `GITHUB_TOKEN` ou `GIT_TOKEN`
   - Se existir: Clique para editar
   - Se não existir: Clique **"Add Environment Variable"**
   - **Key:** `GITHUB_TOKEN` (ou mantenha o nome que estava antes)
   - **Value:** Cole o novo token que você criou
   - Clique **"Save Changes"**

5. **Render vai fazer redeploy automaticamente**

## 📋 Configurar no Vercel (Frontend)

### Passo a passo:

1. **Acesse o Vercel:**
   - Vá em: https://vercel.com/dashboard

2. **Selecione seu projeto frontend:**
   - Clique no projeto do frontend

3. **Vá em Settings → Environment Variables:**
   - Menu superior → **"Settings"**
   - Menu lateral → **"Environment Variables"**

4. **Adicione/Atualize a variável:**
   - Procure por: `GITHUB_TOKEN` ou `GIT_TOKEN`
   - Se existir: Clique nos três pontos → **"Edit"**
   - Se não existir: Clique **"Add New"**
   - **Key:** `GITHUB_TOKEN` (ou mantenha o nome que estava antes)
   - **Value:** Cole o novo token que você criou
   - **Environment:** Marque os ambientes necessários (Production, Preview, Development)
   - Clique **"Save"**

5. **Vercel vai fazer redeploy automaticamente**

## ✅ Testar se Funcionou

Após configurar, teste fazendo um push:

```bash
git add .
git commit -m "chore: testar novo token GitHub"
git push origin main
```

Se o deploy automático funcionar, está tudo certo! 🎉

## 🔍 Verificar se Está Funcionando

1. **Render:**
   - Vá em **"Events"** ou **"Logs"** do serviço
   - Veja se o deploy iniciou automaticamente após o push

2. **Vercel:**
   - Vá em **"Deployments"** do projeto
   - Veja se um novo deploy foi criado automaticamente

## 🗑️ Limpar Tokens Antigos

**Depois** de confirmar que tudo está funcionando:

1. Volte para: https://github.com/settings/tokens
2. Você pode excluir os tokens antigos:
   - `igestorphone-push`
   - `Deploy iGestorPhone`

**Importante:** Só exclua depois de confirmar que o novo token está funcionando!

## 🆘 Se Algo Der Errado

- Verifique os logs de deploy no Render/Vercel
- Confirme que o token tem o scope `repo`
- Verifique se a variável de ambiente tem o nome correto
- Teste fazer push manual para ver mensagens de erro

---

**Última atualização:** 15/12/2024

