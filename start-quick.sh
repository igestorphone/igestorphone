#!/bin/bash

# iGestorPhone - Inicialização Rápida
# Script otimizado para iniciar o sistema rapidamente

echo "🚀 iGestorPhone - Inicialização Rápida"
echo "======================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Função para verificar se uma porta está em uso
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Verificar se já está rodando
if check_port 3001 && check_port 3000; then
    echo -e "${GREEN}✅ Sistema já está rodando!${NC}"
    echo -e "${BLUE}Frontend: http://localhost:3000${NC}"
    echo -e "${BLUE}Backend: http://localhost:3001${NC}"
    exit 0
fi

# Limpar processos se necessário
echo -e "${YELLOW}🧹 Limpando processos anteriores...${NC}"
pkill -f "node.*3001" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
sleep 2

# Iniciar backend
echo -e "${BLUE}📦 Iniciando backend...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Aguardar backend
echo -e "${YELLOW}⏳ Aguardando backend...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:3001/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend iniciado!${NC}"
        break
    fi
    sleep 1
done

# Iniciar frontend
echo -e "${BLUE}📦 Iniciando frontend...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Aguardar frontend
echo -e "${YELLOW}⏳ Aguardando frontend...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend iniciado!${NC}"
        break
    fi
    sleep 1
done

# Resultado final
echo ""
echo -e "${GREEN}🎉 SISTEMA INICIADO COM SUCESSO!${NC}"
echo "======================================"
echo -e "${BLUE}🌐 Frontend: http://localhost:3000${NC}"
echo -e "${BLUE}🔧 Backend: http://localhost:3001${NC}"
echo ""
echo -e "${YELLOW}👤 Credenciais:${NC}"
echo "   Admin: admin@igestorphone.com / admin123"
echo "   User:  usuario@igestorphone.com / usuario123"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo "   Backend: logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo -e "${GREEN}✅ Pronto para usar!${NC}"













