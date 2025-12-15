# ⚡ Renovar Token GitHub - Guia Rápido

## 🚨 O token "igestorphone-push" expirou!

### ✅ Solução Rápida (5 minutos)

#### 1. Criar Novo Token (2 min)
1. Acesse: https://github.com/settings/tokens/new
2. **Note**: `igestorphone-push-v2`
3. **Expiration**: 1 ano (ou "No expiration")
4. **Scopes**: Marque apenas `repo` ✅
5. Clique **"Generate token"**
6. **COPIE O TOKEN** (você não verá novamente!)

#### 2. Atualizar no Render (2 min)
1. Acesse: https://dashboard.render.com
2. Vá em seu serviço backend
3. **Settings** → **Environment**
4. Procure `GITHUB_TOKEN` ou `GIT_TOKEN`
5. Cole o novo token
6. Clique **"Save Changes"**

#### 3. Atualizar no Vercel (1 min)
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. **Settings** → **Environment Variables**
4. Procure `GITHUB_TOKEN` ou `GIT_TOKEN`
5. Atualize com o novo token
6. Salve

### 🔍 Onde o Token Pode Estar

O token está configurado em uma dessas plataformas:

- ✅ **Render** (mais provável para backend)
- ✅ **Vercel** (mais provável para frontend)
- ⚠️ **GitHub Actions** (se usar CI/CD)
- ⚠️ **GitHub Secrets** (se usar Actions)

### 📝 Nota

Seu repositório usa **SSH** (`git@github.com`), então o token provavelmente está apenas nas plataformas de deploy (Render/Vercel), não no seu Git local.

### ✅ Testar

Após atualizar, faça um commit de teste:

```bash
git add .
git commit -m "chore: atualizar token GitHub"
git push origin main
```

Se o deploy automático funcionar, está tudo certo! 🎉

---

**Precisa de ajuda?** Verifique os logs de deploy no Render/Vercel para ver erros específicos.

