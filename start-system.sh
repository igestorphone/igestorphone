#!/bin/bash

# iGestorPhone - Script de Inicialização do Sistema
# Este script inicia o backend e frontend automaticamente

echo "🚀 Iniciando iGestorPhone System..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Porta $1 já está em uso${NC}"
        return 1
    else
        echo -e "${GREEN}✅ Porta $1 disponível${NC}"
        return 0
    fi
}

# Função para matar processos nas portas
kill_ports() {
    echo -e "${YELLOW}🔄 Limpando portas 3000 e 3001...${NC}"
    pkill -f "node.*3000" 2>/dev/null || true
    pkill -f "node.*3001" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    sleep 2
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto iGestorPhone${NC}"
    exit 1
fi

# Verificar se PostgreSQL está rodando
echo -e "${BLUE}🔍 Verificando PostgreSQL...${NC}"
if ! brew services list | grep -q "postgresql.*started"; then
    echo -e "${YELLOW}⚠️  PostgreSQL não está rodando. Iniciando...${NC}"
    brew services start postgresql@14
    sleep 3
fi

# Limpar portas se necessário
kill_ports

# Verificar portas
check_port 3001
check_port 3000

echo -e "${BLUE}📦 Instalando dependências...${NC}"
npm install --silent

echo -e "${BLUE}📦 Instalando dependências do backend...${NC}"
cd backend
npm install --silent
cd ..

echo -e "${GREEN}🚀 Iniciando Backend...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Aguardar backend inicializar
echo -e "${YELLOW}⏳ Aguardando backend inicializar...${NC}"
sleep 5

# Verificar se backend está rodando
if curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend iniciado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar backend${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

echo -e "${GREEN}🚀 Iniciando Frontend...${NC}"
npm run dev &
FRONTEND_PID=$!

# Aguardar frontend inicializar
echo -e "${YELLOW}⏳ Aguardando frontend inicializar...${NC}"
sleep 3

echo -e "${GREEN}🎉 Sistema iGestorPhone iniciado com sucesso!${NC}"
echo ""
echo -e "${BLUE}📍 URLs de Acesso:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:3001${NC}"
echo ""
echo -e "${BLUE}👤 Credenciais de Login:${NC}"
echo -e "   Admin: ${GREEN}admin@igestorphone.com${NC} / ${GREEN}admin123${NC}"
echo -e "   User:  ${GREEN}usuario@igestorphone.com${NC} / ${GREEN}usuario123${NC}"
echo ""
echo -e "${YELLOW}💡 Para parar o sistema, pressione Ctrl+C${NC}"

# Função para cleanup ao sair
cleanup() {
    echo -e "\n${YELLOW}🛑 Parando sistema...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}✅ Sistema parado com sucesso!${NC}"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Manter script rodando
wait













