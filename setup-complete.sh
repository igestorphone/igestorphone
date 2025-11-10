#!/bin/bash

# iGestorPhone - Configuração Completa do Sistema
# Este script configura todo o ambiente: banco, backend, frontend e interface visual

echo "🚀 iGestorPhone - Configuração Completa do Sistema"
echo "=================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Função para verificar se comando foi executado com sucesso
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        exit 1
    fi
}

# 1. Configurar PostgreSQL
echo -e "${BLUE}📊 Passo 1/6: Configurando PostgreSQL...${NC}"
chmod +x setup-database.sh
./setup-database.sh
check_success "PostgreSQL configurado"

# 2. Instalar dependências do Node.js
echo -e "${BLUE}📦 Passo 2/6: Instalando dependências do Node.js...${NC}"
npm install
check_success "Dependências instaladas"

# 3. Configurar variáveis de ambiente
echo -e "${BLUE}⚙️  Passo 3/6: Configurando variáveis de ambiente...${NC}"
if [ ! -f .env ]; then
    cp env.example .env
    echo -e "${YELLOW}⚠️  Arquivo .env criado. Configure suas chaves do Stripe e email.${NC}"
else
    echo -e "${GREEN}✅ Arquivo .env já existe${NC}"
fi

# 4. Executar migrações do banco
echo -e "${BLUE}🗄️  Passo 4/6: Executando migrações do banco...${NC}"
npm run db:migrate
check_success "Migrações executadas"

# 5. Popular banco com dados iniciais
echo -e "${BLUE}🌱 Passo 5/6: Populando banco com dados iniciais...${NC}"
npm run db:seed
check_success "Dados iniciais inseridos"

# 6. Instalar pgAdmin (opcional)
echo -e "${BLUE}🖥️  Passo 6/6: Instalando pgAdmin (Interface Visual)...${NC}"
read -p "Deseja instalar o pgAdmin para gerenciar o banco visualmente? (y/n): " install_pgadmin

if [[ $install_pgadmin =~ ^[Yy]$ ]]; then
    chmod +x install-pgadmin.sh
    ./install-pgadmin.sh
    check_success "pgAdmin instalado"
else
    echo -e "${YELLOW}⚠️  pgAdmin não instalado. Você pode instalar depois com: ./install-pgadmin.sh${NC}"
fi

# Verificar se tudo está funcionando
echo -e "${BLUE}🔍 Verificando configuração...${NC}"

# Verificar PostgreSQL
if brew services list | grep -q "postgresql.*started"; then
    echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"
else
    echo -e "${RED}❌ PostgreSQL não está rodando${NC}"
    echo -e "${YELLOW}💡 Execute: brew services start postgresql@14${NC}"
fi

# Verificar banco de dados
if psql -d igestorphone -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Banco de dados 'igestorphone' acessível${NC}"
else
    echo -e "${RED}❌ Banco de dados 'igestorphone' não acessível${NC}"
fi

# Mostrar informações finais
echo ""
echo -e "${GREEN}🎉 Configuração Completa Finalizada!${NC}"
echo "=================================================="
echo ""
echo -e "${BLUE}📊 Informações do Sistema:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend: ${GREEN}http://localhost:3001${NC}"
echo -e "   Banco: ${GREEN}PostgreSQL (localhost:5432)${NC}"
echo -e "   Interface Visual: ${GREEN}pgAdmin 4${NC}"
echo ""
echo -e "${BLUE}👤 Usuários Criados:${NC}"
echo -e "   Admin: ${GREEN}admin@igestorphone.com${NC} (senha: admin123)"
echo -e "   Teste: ${GREEN}teste@igestorphone.com${NC} (senha: test123)"
echo ""
echo -e "${BLUE}🚀 Comandos para Iniciar:${NC}"
echo -e "   Desenvolvimento completo: ${GREEN}npm run dev:full${NC}"
echo -e "   Apenas frontend: ${GREEN}npm run dev${NC}"
echo -e "   Apenas backend: ${GREEN}npm run backend${NC}"
echo ""
echo -e "${BLUE}🔧 Comandos de Banco:${NC}"
echo -e "   Migrar: ${GREEN}npm run db:migrate${NC}"
echo -e "   Popular: ${GREEN}npm run db:seed${NC}"
echo -e "   Resetar: ${GREEN}npm run db:reset${NC}"
echo ""
echo -e "${BLUE}📱 Próximos Passos:${NC}"
echo -e "   1. Configure suas chaves do Stripe no arquivo .env"
echo -e "   2. Configure suas credenciais de email no arquivo .env"
echo -e "   3. Execute: ${GREEN}npm run dev:full${NC}"
echo -e "   4. Acesse: ${GREEN}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}💡 Dicas:${NC}"
echo -e "   • O PostgreSQL iniciará automaticamente com o MacBook"
echo -e "   • Use o pgAdmin para gerenciar o banco visualmente"
echo -e "   • Os logs ficam na pasta 'logs/'"
echo -e "   • Para produção, configure as variáveis de ambiente adequadamente"
echo ""

# Perguntar se quer iniciar o sistema
read -p "Deseja iniciar o sistema agora? (y/n): " start_now

if [[ $start_now =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🚀 Iniciando sistema...${NC}"
    npm run dev:full
else
    echo -e "${YELLOW}💡 Execute 'npm run dev:full' quando quiser iniciar o sistema${NC}"
fi












