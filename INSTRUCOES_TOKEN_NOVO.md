# 🔑 Criar Novo Token e Fazer Push

## ⚠️ Situação:
O GitHub bloqueou porque detectou token no código. Você autorizou, mas precisa de um NOVO token porque a conta é via Google.

## 🚀 Solução Passo a Passo:

### Passo 1: Criar NOVO Token no GitHub

1. **Acesse:** https://github.com/settings/tokens
2. **Clique em:** "Generate new token" → "Generate new token (classic)"
3. **Preencha:**
   - **Note:** `igestorphone-push-v2`
   - **Expiration:** Escolha uma data ou "No expiration"
   - **Scopes:** Marque apenas ✅ **`repo`**
4. **Clique em:** "Generate token"
5. **⚠️ COPIE O TOKEN IMEDIATAMENTE!**

### Passo 2: Configurar e Fazer Push

**Opção A: Script Automático (Recomendado)**
```bash
cd /Users/MAC/igestorphone
bash configurar-token-novo.sh
# Cole o novo token quando pedir
```

**Opção B: Manual**
```bash
cd /Users/MAC/igestorphone

# Substitua NOVO_TOKEN pelo token que você copiou
git remote set-url origin https://NOVO_TOKEN@github.com/igestorphone/igestorphone.git

# Fazer push
git push origin main
```

### Passo 3: Se Ainda Pedir Autorização

Se o GitHub ainda pedir autorização após configurar o token:

1. **Use o link que o GitHub forneceu:**
   ```
   https://github.com/igestorphone/igestorphone/security/secret-scanning/unblock-secret/38tv7Do13232KfOP23C6C2bjiFk
   ```

2. **Ou permita via GitHub CLI:**
   ```bash
   gh auth login
   ```

3. **Ou configure credenciais no macOS:**
   ```bash
   git config --global credential.helper osxkeychain
   ```

## ✅ Depois do Push:

- ✅ Render fará deploy automaticamente
- ✅ Botão "Desconectar Todos" estará disponível
- ✅ Logout automático (15 min) funcionando

---

**Dica:** Revogue o token antigo (`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`) em https://github.com/settings/tokens por segurança!
