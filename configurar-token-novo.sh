#!/bin/bash

# Script para configurar NOVO token do GitHub
# Execute: bash configurar-token-novo.sh

echo "🔑 Configurando NOVO Personal Access Token do GitHub"
echo ""
echo "📝 Para criar um NOVO token:"
echo ""
echo "1. Acesse: https://github.com/settings/tokens"
echo "2. Clique em 'Generate new token' > 'Generate new token (classic)'"
echo "3. Dê um nome: 'igestorphone-push-v2'"
echo "4. Expiração: Escolha uma data ou 'No expiration'"
echo "5. Marque a opção: ✅ repo (acesso completo aos repositórios)"
echo "6. Clique em 'Generate token'"
echo "7. ⚠️ COPIE O TOKEN IMEDIATAMENTE (você não verá novamente!)"
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
    echo ""
    echo "🎉 O Render deve detectar o push e fazer deploy automaticamente!"
else
    echo ""
    echo "❌ Push falhou."
    echo ""
    echo "💡 Verifique:"
    echo "   1. Se o token está correto"
    echo "   2. Se o token tem permissão 'repo'"
    echo "   3. Se autorizou o push no link do GitHub"
fi

echo ""
echo "💡 O token foi salvo no .git/config (não será commitado)."
