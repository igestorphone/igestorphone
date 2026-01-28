#!/bin/bash

# Script para configurar Personal Access Token do GitHub
# Execute: bash configurar-token-github.sh

echo "🔑 Configurando Personal Access Token do GitHub"
echo ""

cd "$(dirname "$0")"

echo "📝 Para criar um token:"
echo ""
echo "1. Acesse: https://github.com/settings/tokens"
echo "2. Clique em 'Generate new token' > 'Generate new token (classic)'"
echo "3. Dê um nome: 'igestorphone-push'"
echo "4. Expiração: Escolha uma data (ex: 1 ano) ou 'No expiration'"
echo "5. Marque a opção: ✅ repo (acesso completo aos repositórios)"
echo "6. Clique em 'Generate token'"
echo "7. ⚠️ COPIE O TOKEN IMEDIATAMENTE (você não verá novamente!)"
echo ""
echo "Cole o token aqui e pressione Enter:"
read -s GITHUB_TOKEN

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token não fornecido. Cancelando..."
    exit 1
fi

echo ""
echo "🔧 Configurando Git para usar o token..."

# Configurar remote com token
git remote set-url origin https://${GITHUB_TOKEN}@github.com/igestorphone/igestorphone.git

echo "✅ Token configurado!"
echo ""
echo "🚀 Tentando fazer push..."

if git push origin main 2>&1; then
    echo ""
    echo "✅✅✅ PUSH REALIZADO COM SUCESSO! ✅✅✅"
    echo ""
    echo "🎉 O Render deve detectar o push e fazer deploy automaticamente!"
else
    echo ""
    echo "❌ Push falhou. Verifique:"
    echo "   1. Se o token está correto"
    echo "   2. Se o token tem permissão 'repo'"
    echo "   3. Sua conexão com a internet"
fi

echo ""
echo "💡 O token foi salvo no remote do Git."
echo "   Para ver: git remote -v"
echo "   Para remover depois: git remote set-url origin https://github.com/igestorphone/igestorphone.git"
