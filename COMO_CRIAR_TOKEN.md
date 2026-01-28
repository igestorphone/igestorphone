# 🔑 Como Criar Personal Access Token no GitHub

## 📋 Passo a Passo:

### 1. Acessar Configurações de Tokens
Acesse: **https://github.com/settings/tokens**

### 2. Criar Novo Token
- Clique em **"Generate new token"**
- Selecione **"Generate new token (classic)"**

### 3. Configurar Token
- **Note:** `igestorphone-push` (ou qualquer nome)
- **Expiration:** Escolha uma data (ex: 1 ano) ou **"No expiration"**
- **Scopes:** Marque apenas:
  - ✅ **`repo`** (acesso completo aos repositórios)

### 4. Gerar Token
- Clique em **"Generate token"**
- ⚠️ **COPIE O TOKEN IMEDIATAMENTE!** Você não verá novamente!

### 5. Usar o Token

**Opção A: Script Automático**
```bash
cd /Users/MAC/igestorphone
bash configurar-token-github.sh
# Cole o token quando pedir
```

**Opção B: Manual**
```bash
cd /Users/MAC/igestorphone

# Substitua SEU_TOKEN pelo token que você copiou
git remote set-url origin https://SEU_TOKEN@github.com/igestorphone/igestorphone.git

# Fazer push
git push origin main
```

## 🔒 Segurança:

- ✅ O token fica salvo apenas no `.git/config` (local)
- ✅ Não será commitado no repositório (está no .gitignore)
- ⚠️ Se alguém tiver acesso ao seu computador, pode ver o token
- 💡 Você pode revogar o token a qualquer momento no GitHub

## 🗑️ Para Remover o Token Depois:

```bash
git remote set-url origin https://github.com/igestorphone/igestorphone.git
```

Ou criar um novo token e substituir.

---

**Dica:** Se você usa SSH, pode configurar chave SSH em vez de token:
```bash
ssh-keygen -t ed25519 -C "seu_email@example.com"
# Adicione a chave pública no GitHub: https://github.com/settings/keys
git remote set-url origin git@github.com:igestorphone/igestorphone.git
```
