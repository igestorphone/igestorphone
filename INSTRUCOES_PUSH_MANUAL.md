# 📤 Instruções para Fazer Push Manualmente

## ⚠️ Situação Atual:
- ✅ Commit criado: `dfed9a1` (logout automático 15 min)
- ❌ Push bloqueado: Sem conectividade de internet

## 🚀 Quando a Conexão Voltar:

### Opção 1: Push Normal (Recomendado)
```bash
cd /Users/MAC/igestorphone
git push origin main
```

### Opção 2: Usar Script Automático
```bash
cd /Users/MAC/igestorphone
bash push-forcado.sh
```

### Opção 3: Push Automático (Hook)
O hook `post-commit` tentará fazer push automaticamente no próximo commit que você fizer.

## 📦 Arquivos de Backup Criados:

1. **`commit-pendente.patch`** - Patch do commit (pode aplicar em outro repositório)
2. **`commit-pendente.bundle`** - Bundle Git completo (pode fazer pull em outro lugar)

## 🔧 Verificar Status:

```bash
# Ver commits pendentes
git log origin/main..main

# Ver status
git status

# Ver informações do commit
git show dfed9a1
```

## 💡 Alternativas se Push Continuar Falhando:

### 1. Usar Personal Access Token
```bash
# Criar token em: https://github.com/settings/tokens
git remote set-url origin https://SEU_TOKEN@github.com/igestorphone/igestorphone.git
git push origin main
```

### 2. Usar SSH
```bash
git remote set-url origin git@github.com:igestorphone/igestorphone.git
git push origin main
```

### 3. Upload Manual via GitHub Web
1. Acesse: https://github.com/igestorphone/igestorphone
2. Vá em "Upload files"
3. Faça upload dos arquivos alterados manualmente

## ✅ O que está Pronto:

- ✅ Código commitado localmente
- ✅ Push automático configurado (hook post-commit)
- ✅ DNS do GitHub resolvido (/etc/hosts)
- ⏳ Aguardando conectividade de rede

## 🎯 Próximos Passos:

1. **Aguarde conexão de internet voltar**
2. **Execute:** `git push origin main`
3. **Render fará deploy automaticamente**

---

**Commit pendente:** `dfed9a1` - "feat: logout automático por inatividade (15 min)"
