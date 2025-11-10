#!/bin/bash

# iGestorPhone - Script de Produção
# Este script mantém o sistema rodando 24/7 com monitoramento e restart automático

echo "🚀 iGestorPhone - Iniciando Sistema de Produção"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
FRONTEND_PORT=3000
BACKEND_PORT=3001
LOG_DIR="logs"
PID_DIR="pids"

# Criar diretórios necessários
mkdir -p $LOG_DIR
mkdir -p $PID_DIR

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        return 0
    else
        return 1
    fi
}

# Função para matar processo na porta
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}⚠️  Matando processo na porta $port (PID: $pid)${NC}"
        kill -9 $pid
        sleep 2
    fi
}

# Função para verificar se processo está rodando
is_running() {
    local pidfile=$1
    if [ -f "$pidfile" ]; then
        local pid=$(cat $pidfile)
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        else
            rm -f $pidfile
            return 1
        fi
    else
        return 1
    fi
}

# Função para iniciar processo
start_process() {
    local name=$1
    local command=$2
    local pidfile=$3
    local logfile=$4
    
    if is_running $pidfile; then
        echo -e "${GREEN}✅ $name já está rodando${NC}"
        return 0
    fi
    
    echo -e "${BLUE}🚀 Iniciando $name...${NC}"
    nohup $command > $logfile 2>&1 &
    local pid=$!
    echo $pid > $pidfile
    
    sleep 3
    
    if is_running $pidfile; then
        echo -e "${GREEN}✅ $name iniciado com sucesso (PID: $pid)${NC}"
        return 0
    else
        echo -e "${RED}❌ Erro ao iniciar $name${NC}"
        return 1
    fi
}

# Função para parar processo
stop_process() {
    local name=$1
    local pidfile=$2
    
    if is_running $pidfile; then
        local pid=$(cat $pidfile)
        echo -e "${YELLOW}🛑 Parando $name (PID: $pid)...${NC}"
        kill $pid
        sleep 3
        
        if is_running $pidfile; then
            echo -e "${YELLOW}⚠️  Forçando parada do $name...${NC}"
            kill -9 $pid
            sleep 2
        fi
        
        rm -f $pidfile
        echo -e "${GREEN}✅ $name parado${NC}"
    else
        echo -e "${YELLOW}⚠️  $name não estava rodando${NC}"
    fi
}

# Função para monitorar processo
monitor_process() {
    local name=$1
    local pidfile=$2
    local logfile=$3
    local command=$4
    
    while true; do
        if ! is_running $pidfile; then
            echo -e "${RED}❌ $name parou inesperadamente. Reiniciando...${NC}"
            start_process "$name" "$command" "$pidfile" "$logfile"
        fi
        sleep 30
    done
}

# Função para verificar saúde do sistema
health_check() {
    local backend_healthy=false
    local frontend_healthy=false
    
    # Verificar backend
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
        backend_healthy=true
    fi
    
    # Verificar frontend
    if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
        frontend_healthy=true
    fi
    
    echo -e "${BLUE}🔍 Health Check:${NC}"
    echo -e "   Backend: $([ "$backend_healthy" = true ] && echo -e "${GREEN}✅ OK${NC}" || echo -e "${RED}❌ FALHA${NC}")"
    echo -e "   Frontend: $([ "$frontend_healthy" = true ] && echo -e "${GREEN}✅ OK${NC}" || echo -e "${RED}❌ FALHA${NC}")"
    
    return $([ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ] && echo 0 || echo 1)
}

# Função para mostrar status
show_status() {
    echo -e "${BLUE}📊 Status do Sistema:${NC}"
    echo "========================"
    
    # Backend
    if is_running "$PID_DIR/backend.pid"; then
        local backend_pid=$(cat $PID_DIR/backend.pid)
        echo -e "Backend: ${GREEN}✅ Rodando${NC} (PID: $backend_pid)"
    else
        echo -e "Backend: ${RED}❌ Parado${NC}"
    fi
    
    # Frontend
    if is_running "$PID_DIR/frontend.pid"; then
        local frontend_pid=$(cat $PID_DIR/frontend.pid)
        echo -e "Frontend: ${GREEN}✅ Rodando${NC} (PID: $frontend_pid)"
    else
        echo -e "Frontend: ${RED}❌ Parado${NC}"
    fi
    
    # PostgreSQL
    if brew services list | grep -q "postgresql.*started"; then
        echo -e "PostgreSQL: ${GREEN}✅ Rodando${NC}"
    else
        echo -e "PostgreSQL: ${RED}❌ Parado${NC}"
    fi
    
    echo ""
    health_check
}

# Função para mostrar logs
show_logs() {
    local service=$1
    local lines=${2:-50}
    
    case $service in
        "backend")
            echo -e "${BLUE}📋 Logs do Backend (últimas $lines linhas):${NC}"
            tail -n $lines $LOG_DIR/backend.log
            ;;
        "frontend")
            echo -e "${BLUE}📋 Logs do Frontend (últimas $lines linhas):${NC}"
            tail -n $lines $LOG_DIR/frontend.log
            ;;
        "all")
            echo -e "${BLUE}📋 Logs Combinados (últimas $lines linhas):${NC}"
            tail -n $lines $LOG_DIR/*.log
            ;;
        *)
            echo -e "${RED}❌ Serviço inválido. Use: backend, frontend ou all${NC}"
            ;;
    esac
}

# Função principal
main() {
    case "${1:-start}" in
        "start")
            echo -e "${BLUE}🚀 Iniciando Sistema de Produção...${NC}"
            
            # Verificar se PostgreSQL está rodando
            if ! brew services list | grep -q "postgresql.*started"; then
                echo -e "${YELLOW}⚠️  PostgreSQL não está rodando. Iniciando...${NC}"
                brew services start postgresql@14
                sleep 5
            fi
            
            # Limpar portas se necessário
            kill_port $BACKEND_PORT
            kill_port $FRONTEND_PORT
            
            # Iniciar backend
            start_process "Backend" "npm run backend" "$PID_DIR/backend.pid" "$LOG_DIR/backend.log"
            
            # Aguardar backend inicializar
            sleep 5
            
            # Iniciar frontend
            start_process "Frontend" "npm run dev" "$PID_DIR/frontend.pid" "$LOG_DIR/frontend.log"
            
            # Aguardar frontend inicializar
            sleep 5
            
            # Verificar saúde
            health_check
            
            echo -e "${GREEN}🎉 Sistema iniciado com sucesso!${NC}"
            echo -e "${BLUE}📊 Acesse: http://localhost:$FRONTEND_PORT${NC}"
            echo -e "${BLUE}🔧 API: http://localhost:$BACKEND_PORT${NC}"
            ;;
            
        "stop")
            echo -e "${YELLOW}🛑 Parando Sistema de Produção...${NC}"
            stop_process "Backend" "$PID_DIR/backend.pid"
            stop_process "Frontend" "$PID_DIR/frontend.pid"
            echo -e "${GREEN}✅ Sistema parado${NC}"
            ;;
            
        "restart")
            echo -e "${YELLOW}🔄 Reiniciando Sistema de Produção...${NC}"
            $0 stop
            sleep 3
            $0 start
            ;;
            
        "status")
            show_status
            ;;
            
        "logs")
            show_logs "$2" "$3"
            ;;
            
        "monitor")
            echo -e "${BLUE}👁️  Iniciando monitoramento...${NC}"
            echo -e "${YELLOW}💡 Pressione Ctrl+C para parar${NC}"
            
            # Iniciar monitoramento em background
            monitor_process "Backend" "$PID_DIR/backend.pid" "$LOG_DIR/backend.log" "npm run backend" &
            monitor_process "Frontend" "$PID_DIR/frontend.pid" "$LOG_DIR/frontend.log" "npm run dev" &
            
            # Monitor principal
            while true; do
                sleep 60
                health_check
                echo -e "${BLUE}⏰ $(date): Sistema monitorado${NC}"
            done
            ;;
            
        "help")
            echo -e "${BLUE}📖 Comandos Disponíveis:${NC}"
            echo "  start    - Iniciar sistema"
            echo "  stop     - Parar sistema"
            echo "  restart  - Reiniciar sistema"
            echo "  status   - Mostrar status"
            echo "  logs     - Mostrar logs (backend|frontend|all)"
            echo "  monitor  - Monitorar sistema"
            echo "  help     - Mostrar esta ajuda"
            ;;
            
        *)
            echo -e "${RED}❌ Comando inválido: $1${NC}"
            echo -e "${YELLOW}💡 Use '$0 help' para ver comandos disponíveis${NC}"
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"












