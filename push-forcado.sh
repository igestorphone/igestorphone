#!/bin/bash

# Script para fazer push forçado com várias tentativas
# Execute: bash push-forcado.sh

echo "🚀 Tentando fazer push com múltiplas estratégias..."

cd "$(dirname "$0")"

# Estratégia 1: Push normal
echo "📤 Tentativa 1: Push normal..."
if git push origin main 2>&1; then
    echo "✅ Push realizado com sucesso!"
    exit 0
fi

# Estratégia 2: Com variáveis de ambiente
echo "📤 Tentativa 2: Com configurações de timeout..."
GIT_HTTP_LOW_SPEED_LIMIT=0 GIT_HTTP_LOW_SPEED_TIME=999999 git push origin main 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
    exit 0
fi

# Estratégia 3: Usar IP direto
echo "📤 Tentativa 3: Usando IP direto do GitHub..."
git remote set-url origin https://140.82.121.3/igestorphone/igestorphone.git 2>&1
git config http.https://140.82.121.3.sslVerify false 2>&1
if git push origin main 2>&1; then
    echo "✅ Push realizado com sucesso!"
    # Restaurar URL original
    git remote set-url origin https://github.com/igestorphone/igestorphone.git
    exit 0
fi

# Restaurar URL original
git remote set-url origin https://github.com/igestorphone/igestorphone.git

# Estratégia 4: Verificar se precisa de autenticação
echo "📤 Tentativa 4: Verificando autenticação..."
echo "💡 Se pedir credenciais, você pode:"
echo "   1. Usar um Personal Access Token do GitHub"
echo "   2. Ou configurar SSH"
echo ""
git push origin main 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Push realizado com sucesso!"
    exit 0
else
    echo ""
    echo "❌ Todas as tentativas falharam."
    echo ""
    echo "🔍 Diagnóstico:"
    echo "   - DNS: $(host github.com 2>&1 | head -1)"
    echo "   - Conectividade: $(curl -I https://github.com 2>&1 | head -1)"
    echo ""
    echo "💡 Soluções:"
    echo "   1. Verifique sua conexão com a internet"
    echo "   2. Tente usar outra rede Wi-Fi"
    echo "   3. Configure um Personal Access Token:"
    echo "      git remote set-url origin https://SEU_TOKEN@github.com/igestorphone/igestorphone.git"
    echo "   4. Ou aguarde a conexão voltar e execute: git push origin main"
    exit 1
fi
