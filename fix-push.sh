#!/bin/bash

# Script para resolver problemas de push para GitHub
# Execute: bash fix-push.sh

echo "🔧 Corrigindo configuração do Git para push..."

cd "$(dirname "$0")"

# 1. Tentar mudar para HTTPS (mais confiável que SSH quando há problemas de DNS)
echo "📝 Alterando remote para HTTPS..."
git remote set-url origin https://github.com/igestorphone/igestorphone.git

# 2. Verificar conectividade
echo "🌐 Verificando conectividade com GitHub..."
if curl -I https://github.com 2>&1 | grep -q "HTTP"; then
    echo "✅ Conectividade OK"
else
    echo "⚠️  Problema de conectividade detectado"
    echo "   Tentando resolver DNS..."
    
    # Tentar adicionar GitHub ao /etc/hosts temporariamente
    if ! grep -q "github.com" /etc/hosts 2>/dev/null; then
        echo "   Execute manualmente: sudo sh -c 'echo \"140.82.121.3 github.com\" >> /etc/hosts'"
    fi
fi

# 3. Tentar fazer push
echo "🚀 Tentando fazer push..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
else
    echo "❌ Push falhou. Tentando alternativas..."
    
    # Tentar com token (se configurado)
    echo ""
    echo "💡 Alternativas:"
    echo "   1. Verifique sua conexão com a internet"
    echo "   2. Tente usar um token do GitHub:"
    echo "      git remote set-url origin https://SEU_TOKEN@github.com/igestorphone/igestorphone.git"
    echo "   3. Ou configure SSH corretamente:"
    echo "      ssh-keygen -t ed25519 -C \"seu_email@example.com\""
    echo "      ssh-add ~/.ssh/id_ed25519"
    echo "      # Depois adicione a chave pública no GitHub"
fi
