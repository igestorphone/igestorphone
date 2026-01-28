#!/bin/bash

# ⚠️ IMPORTANTE: Execute este script DIRETAMENTE no Terminal do macOS
# Não execute via Cursor/IDE - execute no Terminal nativo

echo "🚀 Fazendo push para GitHub..."
echo ""

cd /Users/MAC/igestorphone

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute no diretório correto"
    exit 1
fi

# Tentar push com HTTPS primeiro
echo "📤 Tentativa 1: HTTPS..."
git remote set-url origin https://github.com/igestorphone/igestorphone.git
if git push origin main 2>&1; then
    echo "✅ Push realizado com sucesso via HTTPS!"
    exit 0
fi

# Tentar SSH
echo ""
echo "📤 Tentativa 2: SSH..."
git remote set-url origin git@github.com:igestorphone/igestorphone.git
if git push origin main 2>&1; then
    echo "✅ Push realizado com sucesso via SSH!"
    exit 0
fi

# Se falhar, mostrar instruções
echo ""
echo "❌ Push falhou. Tente manualmente:"
echo ""
echo "1. Verifique sua conexão:"
echo "   curl -I https://github.com"
echo ""
echo "2. Use Personal Access Token:"
echo "   git remote set-url origin https://SEU_TOKEN@github.com/igestorphone/igestorphone.git"
echo "   git push origin main"
echo ""
echo "3. Ou configure SSH:"
echo "   ssh-keygen -t ed25519 -C \"seu_email@example.com\""
echo "   # Adicione a chave pública no GitHub"
echo "   git remote set-url origin git@github.com:igestorphone/igestorphone.git"
echo "   git push origin main"
