#!/bin/bash

# iGestorPhone - Configuração do Banco de Dados Profissional
# Este script configura o PostgreSQL para rodar sempre no MacBook

echo "🗄️  Configurando Banco de Dados Profissional..."

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

# Instalar PostgreSQL se não estiver instalado
if ! brew list postgresql@14 &> /dev/null; then
    echo -e "${BLUE}📦 Instalando PostgreSQL 14...${NC}"
    brew install postgresql@14
fi

# Configurar PostgreSQL para iniciar automaticamente
echo -e "${BLUE}🔧 Configurando PostgreSQL para iniciar automaticamente...${NC}"
brew services start postgresql@14

# Aguardar PostgreSQL inicializar
echo -e "${YELLOW}⏳ Aguardando PostgreSQL inicializar...${NC}"
sleep 5

# Verificar se PostgreSQL está rodando
if brew services list | grep -q "postgresql.*started"; then
    echo -e "${GREEN}✅ PostgreSQL configurado e rodando!${NC}"
else
    echo -e "${RED}❌ Erro ao configurar PostgreSQL${NC}"
    exit 1
fi

# Criar banco de dados se não existir
echo -e "${BLUE}🗄️  Configurando banco de dados...${NC}"
createdb igestorphone 2>/dev/null || echo -e "${YELLOW}⚠️  Banco 'igestorphone' já existe${NC}"

# Executar migrações
echo -e "${BLUE}🔄 Executando migrações do banco...${NC}"
cd backend
node src/migrate.js

# Executar seed se necessário
echo -e "${BLUE}🌱 Populando banco com dados iniciais...${NC}"
node src/seed.js
cd ..

echo -e "${GREEN}🎉 Banco de dados configurado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📊 Informações do Banco:${NC}"
echo -e "   Host: ${GREEN}localhost${NC}"
echo -e "   Porta: ${GREEN}5432${NC}"
echo -e "   Banco: ${GREEN}igestorphone${NC}"
echo -e "   Usuário: ${GREEN}${USER}${NC}"
echo ""
echo -e "${YELLOW}💡 O PostgreSQL agora iniciará automaticamente com o MacBook${NC}"
echo -e "${YELLOW}💡 Para parar: brew services stop postgresql@14${NC}"
echo -e "${YELLOW}💡 Para iniciar: brew services start postgresql@14${NC}"













