#!/bin/bash

# Script seguro para configurar token (não commita o token)
# Execute: bash configurar-token-seguro.sh

echo "🔑 Configurando Personal Access Token do GitHub"
echo ""
echo "⚠️ IMPORTANTE: O token anterior foi exposto e precisa ser revogado!"
echo "   1. Acesse: https://github.com/settings/tokens"
echo "   2. Revogue o token antigo: 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"
echo "   3. Crie um novo token"
echo ""
echo "Cole o NOVO token aqui e pressione Enter:"
read -s GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token não fornecido. Cancelando..."
    exit 1
fi

echo ""
echo "🔧 Configurando Git para usar o novo token..."

cd /Users/MAC/igestorphone

# Configurar remote com novo token
git remote set-url origin https://${GITHUB_TOKEN}@github.com/igestorphone/igestorphone.git

echo "✅ Novo token configurado!"
echo ""
echo "🚀 Tentando fazer push..."

if git push origin main 2>&1; then
    echo ""
    echo "✅✅✅ PUSH REALIZADO COM SUCESSO! ✅✅✅"
else
    echo ""
    echo "❌ Push falhou."
    echo ""
    echo "💡 Se o GitHub ainda bloquear:"
    echo "   1. Use o link de desbloqueio que o GitHub forneceu"
    echo "   2. Ou permita o push temporariamente no GitHub"
fi

echo ""
echo "💡 O token foi salvo apenas no .git/config (não será commitado)."
