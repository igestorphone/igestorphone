# 🔑 Guia para Renovar Token do GitHub

O token "igestorphone-push" expirou e precisa ser renovado para manter os deploys automáticos funcionando.

## 📋 Passo a Passo

### 1. Criar Novo Token no GitHub

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Configure o token:
   - **Note**: `igestorphone-push` (ou outro nome de sua preferência)
   - **Expiration**: Escolha uma data longa (ex: 1 ano) ou "No expiration"
   - **Scopes**: Marque apenas:
     - ✅ `repo` (acesso completo ao repositório)
     - ✅ `workflow` (se usar GitHub Actions)
4. Clique em **"Generate token"**
5. **⚠️ IMPORTANTE**: Copie o token imediatamente! Você não poderá vê-lo novamente.

### 2. Atualizar no Render (Backend)

1. Acesse o painel do Render: https://dashboard.render.com
2. Vá em **"Services"** → Selecione seu serviço backend
3. Vá em **"Environment"** (ou **"Environment Variables"**)
4. Procure por variáveis relacionadas ao GitHub:
   - `GITHUB_TOKEN`
   - `GIT_TOKEN`
   - Ou qualquer variável que contenha o token antigo
5. Se encontrar, atualize com o novo token
6. Se não encontrar, pode não estar configurado (o Render pode usar SSH keys)

### 3. Atualizar no Vercel (Frontend)

1. Acesse o painel do Vercel: https://vercel.com/dashboard
2. Vá em **"Settings"** → **"Environment Variables"**
3. Procure por:
   - `GITHUB_TOKEN`
   - `GIT_TOKEN`
   - Ou variáveis relacionadas
4. Atualize com o novo token se encontrar

### 4. Verificar Configuração do Git Local

Se você faz push manualmente, verifique se há alguma configuração:

```bash
# Verificar configurações do Git
git config --list | grep -i token
git config --list | grep -i github

# Verificar credenciais salvas (macOS)
git credential-osxkeychain get <<EOF
protocol=https
host=github.com
EOF
```

### 5. Se o Token Estiver em Scripts ou CI/CD

Verifique se há arquivos de configuração:

- `.github/workflows/*.yml` (GitHub Actions)
- `render.yaml` (Render)
- `vercel.json` (Vercel)
- Scripts de deploy (`deploy.sh`, etc.)

## 🔍 Verificar Onde o Token Está Sendo Usado

O token pode estar configurado em:

1. **Render Dashboard** → Environment Variables
2. **Vercel Dashboard** → Environment Variables  
3. **GitHub Secrets** (se usar GitHub Actions)
4. **Arquivo `.env` local** (não deve estar aqui por segurança)
5. **Credenciais do Git** (macOS Keychain, Windows Credential Manager)

## ✅ Testar o Novo Token

Após atualizar, teste fazendo um push:

```bash
# Fazer um commit de teste
git add .
git commit -m "test: verificar token do GitHub"
git push origin main
```

Se funcionar, o token está correto! 🎉

## 🆘 Se Ainda Não Funcionar

1. Verifique os logs de deploy no Render/Vercel
2. Verifique se o token tem as permissões corretas (`repo` scope)
3. Tente fazer um push manual para ver a mensagem de erro
4. Verifique se o repositório está configurado corretamente

## 📝 Nota Importante

- **Nunca** commite tokens no código
- Use sempre variáveis de ambiente
- Tokens devem ter expiração definida (exceto em casos especiais)
- Revise tokens antigos e remova os que não são mais usados

---

**Última atualização**: 15/12/2024

