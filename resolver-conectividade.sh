#!/bin/bash

# Script para resolver problema de conectividade com GitHub
# Execute: bash resolver-conectividade.sh

echo "🔧 Diagnosticando problema de conectividade..."

# 1. Verificar DNS
echo "1️⃣ Verificando DNS..."
if host github.com > /dev/null 2>&1; then
    echo "   ✅ DNS resolvendo github.com"
    host github.com | grep "has address"
else
    echo "   ❌ DNS não está resolvendo"
    echo "   💡 Adicionando ao /etc/hosts..."
    if ! grep -q "github.com" /etc/hosts; then
        echo "140.82.121.3 github.com" | sudo tee -a /etc/hosts
    fi
fi

# 2. Verificar conectividade básica
echo ""
echo "2️⃣ Testando conectividade..."
if curl -I https://www.google.com > /dev/null 2>&1; then
    echo "   ✅ Conectividade básica OK"
else
    echo "   ⚠️  Sem conectividade básica"
    echo "   💡 Verifique:"
    echo "      - Firewall do macOS"
    echo "      - VPN ativa"
    echo "      - Software de segurança"
fi

# 3. Testar GitHub especificamente
echo ""
echo "3️⃣ Testando GitHub..."
if curl -I https://github.com > /dev/null 2>&1; then
    echo "   ✅ GitHub acessível!"
    echo ""
    echo "🚀 Tentando fazer push..."
    cd "$(dirname "$0")"
    git push origin main
else
    echo "   ❌ GitHub não acessível"
    echo ""
    echo "💡 Soluções:"
    echo ""
    echo "A) Verificar Firewall do macOS:"
    echo "   1. Abra: Preferências do Sistema > Segurança e Privacidade > Firewall"
    echo "   2. Clique em 'Opções de Firewall...'"
    echo "   3. Verifique se não está bloqueando conexões"
    echo ""
    echo "B) Desabilitar temporariamente software de segurança/VPN"
    echo ""
    echo "C) Tentar usar SSH em vez de HTTPS:"
    echo "   git remote set-url origin git@github.com:igestorphone/igestorphone.git"
    echo "   git push origin main"
    echo ""
    echo "D) Usar Personal Access Token:"
    echo "   1. Crie token em: https://github.com/settings/tokens"
    echo "   2. Execute: git remote set-url origin https://SEU_TOKEN@github.com/igestorphone/igestorphone.git"
    echo "   3. Execute: git push origin main"
fi

echo ""
echo "✨ Diagnóstico concluído!"
