#!/bin/bash

# iGestorPhone - Instalação do pgAdmin (Interface Visual para PostgreSQL)
# Este script instala e configura o pgAdmin para gerenciar o banco de dados

echo "🖥️  Instalando pgAdmin - Interface Visual para PostgreSQL..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se Homebrew está instalado
if ! command -v brew &> /dev/null; then
    echo -e "${RED}❌ Homebrew não encontrado. Instalando...${NC}"
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Instalar pgAdmin
echo -e "${BLUE}📦 Instalando pgAdmin...${NC}"
brew install --cask pgadmin4

# Aguardar instalação
echo -e "${YELLOW}⏳ Aguardando instalação do pgAdmin...${NC}"
sleep 10

# Verificar se pgAdmin foi instalado
if [ -d "/Applications/pgAdmin 4.app" ]; then
    echo -e "${GREEN}✅ pgAdmin instalado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro na instalação do pgAdmin${NC}"
    exit 1
fi

# Criar arquivo de configuração para conexão automática
echo -e "${BLUE}🔧 Configurando conexão automática...${NC}"

# Criar diretório de configuração se não existir
mkdir -p ~/.pgadmin

# Criar arquivo de configuração
cat > ~/.pgadmin/servers.json << EOF
{
    "servers": [
        {
            "name": "iGestorPhone Local",
            "host": "localhost",
            "port": 5432,
            "maintenance_db": "igestorphone",
            "username": "$USER",
            "password": "",
            "sslmode": "prefer",
            "comment": "Banco de dados local do iGestorPhone"
        }
    ]
}
EOF

echo -e "${GREEN}🎉 pgAdmin configurado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📊 Informações de Conexão:${NC}"
echo -e "   Nome: ${GREEN}iGestorPhone Local${NC}"
echo -e "   Host: ${GREEN}localhost${NC}"
echo -e "   Porta: ${GREEN}5432${NC}"
echo -e "   Banco: ${GREEN}igestorphone${NC}"
echo -e "   Usuário: ${GREEN}$USER${NC}"
echo ""
echo -e "${YELLOW}💡 Para abrir o pgAdmin:${NC}"
echo -e "   1. Abra o Spotlight (Cmd + Espaço)"
echo -e "   2. Digite 'pgAdmin'"
echo -e "   3. Clique em 'Add New Server'"
echo -e "   4. Use as informações acima para conectar"
echo ""
echo -e "${YELLOW}💡 Alternativa - Interface Web:${NC}"
echo -e "   Acesse: http://localhost:5050 (se estiver rodando)"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo -e "   Iniciar pgAdmin: ${GREEN}open -a 'pgAdmin 4'${NC}"
echo -e "   Verificar PostgreSQL: ${GREEN}brew services list | grep postgresql${NC}"
echo -e "   Iniciar PostgreSQL: ${GREEN}brew services start postgresql@14${NC}"
echo -e "   Parar PostgreSQL: ${GREEN}brew services stop postgresql@14${NC}"

# Abrir pgAdmin automaticamente
echo -e "${BLUE}🚀 Abrindo pgAdmin...${NC}"
open -a "pgAdmin 4" 2>/dev/null || echo -e "${YELLOW}⚠️  Abra o pgAdmin manualmente${NC}"

echo ""
echo -e "${GREEN}✅ Instalação concluída!${NC}"












