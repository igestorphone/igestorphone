# 🔥 Solução: Problema de Firewall/Segurança

## 🔍 Diagnóstico:
O trace do Git mostra:
- ✅ DNS resolvendo: `github.com` → `140.82.121.3`
- ❌ Conexão bloqueada: `Operation not permitted`

**Isso indica que o macOS está bloqueando a conexão de rede!**

## 🛠️ Soluções (tente nesta ordem):

### 1. Verificar Firewall do macOS
```bash
# Abrir configurações de firewall
open "x-apple.systempreferences:com.apple.preference.security?Firewall"
```

Ou manualmente:
1. **Preferências do Sistema** > **Segurança e Privacidade** > **Firewall**
2. Clique em **"Opções de Firewall..."**
3. Verifique se há regras bloqueando conexões
4. Tente desabilitar temporariamente para testar

### 2. Verificar Software de Segurança
- Little Snitch
- Lulu
- Radio Silence
- Outros firewalls de terceiros

Desabilite temporariamente para testar.

### 3. Verificar VPN
Se estiver usando VPN:
- Desconecte temporariamente
- Tente fazer push
- Se funcionar, configure exceção na VPN

### 4. Usar SSH em vez de HTTPS
```bash
cd /Users/MAC/igestorphone

# Verificar se tem chave SSH
ls -la ~/.ssh/id_*.pub

# Se não tiver, criar uma
ssh-keygen -t ed25519 -C "seu_email@example.com"

# Adicionar ao ssh-agent
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública (adicione no GitHub)
cat ~/.ssh/id_ed25519.pub | pbcopy

# Mudar remote para SSH
git remote set-url origin git@github.com:igestorphone/igestorphone.git

# Tentar push
git push origin main
```

### 5. Usar Personal Access Token
```bash
# 1. Criar token em: https://github.com/settings/tokens
#    - Marque: repo (acesso completo)

# 2. Usar token no remote
git remote set-url origin https://SEU_TOKEN_AQUI@github.com/igestorphone/igestorphone.git

# 3. Fazer push
git push origin main
```

### 6. Permitir Acesso de Rede para Terminal/Git
```bash
# Verificar permissões de rede
tccutil reset Network com.apple.Terminal

# Ou permitir manualmente em:
# Preferências do Sistema > Segurança e Privacidade > Privacidade > Rede
```

## 🧪 Testar Conectividade:

```bash
# Executar script de diagnóstico
bash resolver-conectividade.sh

# Ou testar manualmente
curl -I https://github.com
ping -c 3 github.com
```

## ✅ Solução Rápida (Recomendada):

1. **Desabilitar firewall temporariamente**
2. **Fazer push:** `git push origin main`
3. **Reabilitar firewall**
4. **Configurar exceção** para Git/Terminal

---

**Commit pendente:** `dfed9a1` - "feat: logout automático por inatividade (15 min)"
