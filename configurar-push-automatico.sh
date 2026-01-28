#!/bin/bash

# Script para configurar push automático
# Execute: bash configurar-push-automatico.sh

echo "🔧 Configurando push automático..."

cd "$(dirname "$0")"

# 1. Garantir que hooks estão executáveis
chmod +x .git/hooks/post-commit 2>/dev/null
chmod +x .git/hooks/pre-push 2>/dev/null

# 2. Verificar se remote está configurado
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "❌ Remote 'origin' não configurado"
    exit 1
fi

# 3. Tentar resolver DNS do GitHub
echo "🌐 Verificando conectividade com GitHub..."
if ! curl -I https://github.com > /dev/null 2>&1; then
    echo "⚠️  Problema de DNS detectado"
    echo "💡 Adicionando GitHub ao /etc/hosts..."
    
    if ! grep -q "github.com" /etc/hosts 2>/dev/null; then
        echo "140.82.121.3 github.com" | sudo tee -a /etc/hosts > /dev/null 2>&1
        echo "✅ GitHub adicionado ao /etc/hosts"
    else
        echo "✅ GitHub já está no /etc/hosts"
    fi
fi

# 4. Testar push
echo "🧪 Testando push..."
if git push origin main --dry-run > /dev/null 2>&1; then
    echo "✅ Configuração OK! Push automático está ativo."
    echo ""
    echo "📝 Agora, sempre que você fizer um commit, o push será automático!"
else
    echo "⚠️  Push ainda não está funcionando. Verifique:"
    echo "   1. Sua conexão com a internet"
    echo "   2. Suas credenciais Git (se usar HTTPS)"
    echo "   3. Suas chaves SSH (se usar SSH)"
fi

echo ""
echo "✨ Configuração concluída!"
