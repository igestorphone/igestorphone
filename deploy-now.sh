#!/bin/bash

# Script para fazer deploy das alterações
# Execute: bash deploy-now.sh

echo "🚀 Fazendo deploy das alterações..."

cd "$(dirname "$0")"

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Execute este script no diretório raiz do projeto"
    exit 1
fi

# Aceitar licença do Xcode (se necessário)
echo "📝 Verificando licença do Xcode..."
if ! xcodebuild -license check 2>/dev/null; then
    echo "⚠️  É necessário aceitar a licença do Xcode primeiro."
    echo "   Execute: sudo xcodebuild -license"
    echo "   Depois execute este script novamente."
    exit 1
fi

# Adicionar todas as alterações
echo "📦 Adicionando alterações ao Git..."
git add -A

# Verificar se há alterações
if git diff --cached --quiet; then
    echo "ℹ️  Nenhuma alteração para commitar."
else
    # Fazer commit
    echo "💾 Fazendo commit..."
    git commit -m "feat: logout automático por inatividade (15 min) e desconectar todos os usuários

- Implementado logout automático após 15 minutos de inatividade
- Frontend: hook useIdleLogout com timeout de 15 min
- Backend: middleware valida inatividade e retorna 401 após 15 min
- Script para desconectar todos os usuários: npm run users:force-logout-all
- Migração: adicionada coluna last_activity_at na tabela users
- Build de produção gerado em dist/"
    
    # Fazer push
    echo "🚀 Fazendo push para o repositório..."
    git push origin main
    
    if [ $? -eq 0 ]; then
        echo "✅ Deploy realizado com sucesso!"
        echo "📊 O Render deve detectar o push e fazer deploy automático."
    else
        echo "❌ Erro ao fazer push. Verifique suas credenciais Git."
        exit 1
    fi
fi

echo "✨ Concluído!"
