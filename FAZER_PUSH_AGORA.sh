#!/bin/bash

# Script para fazer push AGORA com o token configurado
# Execute: bash FAZER_PUSH_AGORA.sh

echo "🚀 Configurando token e fazendo push..."
echo ""

cd /Users/MAC/igestorphone

# Configurar remote com token
git remote set-url origin https://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@github.com/igestorphone/igestorphone.git

echo "✅ Token configurado!"
echo ""
echo "📤 Fazendo push..."

# Fazer push
if git push origin main 2>&1; then
    echo ""
    echo "✅✅✅ PUSH REALIZADO COM SUCESSO! ✅✅✅"
    echo ""
    echo "🎉 O Render deve detectar o push e fazer deploy automaticamente!"
    echo ""
    echo "📊 Commit enviado:"
    git log --oneline -1
else
    echo ""
    echo "❌ Push falhou."
    echo ""
    echo "💡 Possíveis causas:"
    echo "   1. Problema de conectividade de rede"
    echo "   2. Token pode ter expirado ou não ter permissão 'repo'"
    echo "   3. Firewall bloqueando conexão"
    echo ""
    echo "🔍 Verificar:"
    echo "   - Teste: curl -I https://github.com"
    echo "   - Verifique se o token tem permissão 'repo' no GitHub"
fi

echo ""
