#!/bin/bash

# iGestorPhone - Configuração de Inicialização Automática
# Este script configura o sistema para iniciar automaticamente com o MacBook

echo "🚀 iGestorPhone - Configuração de Inicialização Automática"
echo "========================================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
SERVICE_NAME="com.igestorphone.startup"
SERVICE_FILE="/Library/LaunchDaemons/${SERVICE_NAME}.plist"
SCRIPT_PATH="$(pwd)/start-production.sh"
USER_NAME="${USER}"

# Função para verificar se script existe
check_script() {
    if [ ! -f "$SCRIPT_PATH" ]; then
        echo -e "${RED}❌ Script start-production.sh não encontrado${NC}"
        echo -e "${YELLOW}💡 Execute este script no diretório do projeto${NC}"
        exit 1
    fi
    
    if [ ! -x "$SCRIPT_PATH" ]; then
        echo -e "${YELLOW}⚠️  Tornando script executável...${NC}"
        chmod +x "$SCRIPT_PATH"
    fi
}

# Função para criar arquivo plist
create_plist() {
    echo -e "${BLUE}📝 Criando arquivo de configuração...${NC}"
    
    sudo tee "$SERVICE_FILE" > /dev/null << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${SERVICE_NAME}</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>${SCRIPT_PATH}</string>
        <string>start</string>
    </array>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <true/>
    
    <key>StandardOutPath</key>
    <string>${PWD}/logs/launchd.log</string>
    
    <key>StandardErrorPath</key>
    <string>${PWD}/logs/launchd.error.log</string>
    
    <key>WorkingDirectory</key>
    <string>${PWD}</string>
    
    <key>UserName</key>
    <string>${USER_NAME}</string>
    
    <key>GroupName</key>
    <string>staff</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
        <key>NODE_ENV</key>
        <string>production</string>
    </dict>
</dict>
</plist>
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Arquivo plist criado: $SERVICE_FILE${NC}"
    else
        echo -e "${RED}❌ Erro ao criar arquivo plist${NC}"
        exit 1
    fi
}

# Função para carregar serviço
load_service() {
    echo -e "${BLUE}🔄 Carregando serviço...${NC}"
    
    # Descarregar se já estiver carregado
    sudo launchctl unload "$SERVICE_FILE" 2>/dev/null || true
    
    # Carregar serviço
    if sudo launchctl load "$SERVICE_FILE"; then
        echo -e "${GREEN}✅ Serviço carregado com sucesso${NC}"
    else
        echo -e "${RED}❌ Erro ao carregar serviço${NC}"
        exit 1
    fi
}

# Função para verificar status
check_status() {
    echo -e "${BLUE}📊 Verificando status do serviço...${NC}"
    
    if launchctl list | grep -q "$SERVICE_NAME"; then
        echo -e "${GREEN}✅ Serviço está carregado${NC}"
        
        # Verificar se está rodando
        if launchctl list | grep "$SERVICE_NAME" | grep -q "running"; then
            echo -e "${GREEN}✅ Serviço está rodando${NC}"
        else
            echo -e "${YELLOW}⚠️  Serviço carregado mas não está rodando${NC}"
        fi
    else
        echo -e "${RED}❌ Serviço não está carregado${NC}"
    fi
}

# Função para parar serviço
stop_service() {
    echo -e "${YELLOW}🛑 Parando serviço...${NC}"
    
    if sudo launchctl unload "$SERVICE_FILE"; then
        echo -e "${GREEN}✅ Serviço parado${NC}"
    else
        echo -e "${RED}❌ Erro ao parar serviço${NC}"
    fi
}

# Função para remover serviço
remove_service() {
    echo -e "${YELLOW}🗑️  Removendo serviço...${NC}"
    
    # Parar serviço
    stop_service
    
    # Remover arquivo
    if sudo rm -f "$SERVICE_FILE"; then
        echo -e "${GREEN}✅ Serviço removido${NC}"
    else
        echo -e "${RED}❌ Erro ao remover serviço${NC}"
    fi
}

# Função para mostrar logs
show_logs() {
    echo -e "${BLUE}📋 Logs do LaunchDaemon:${NC}"
    echo "========================"
    
    if [ -f "${PWD}/logs/launchd.log" ]; then
        echo -e "${GREEN}📄 Logs de saída:${NC}"
        tail -20 "${PWD}/logs/launchd.log"
    else
        echo -e "${YELLOW}⚠️  Arquivo de log não encontrado${NC}"
    fi
    
    echo ""
    
    if [ -f "${PWD}/logs/launchd.error.log" ]; then
        echo -e "${RED}📄 Logs de erro:${NC}"
        tail -20 "${PWD}/logs/launchd.error.log"
    else
        echo -e "${GREEN}✅ Nenhum erro encontrado${NC}"
    fi
}

# Função para mostrar ajuda
show_help() {
    echo -e "${BLUE}📖 Comandos Disponíveis:${NC}"
    echo "  install   - Instalar serviço de inicialização automática"
    echo "  uninstall - Remover serviço de inicialização automática"
    echo "  start     - Iniciar serviço"
    echo "  stop      - Parar serviço"
    echo "  restart   - Reiniciar serviço"
    echo "  status    - Verificar status do serviço"
    echo "  logs      - Mostrar logs do serviço"
    echo "  help      - Mostrar esta ajuda"
    echo ""
    echo -e "${BLUE}Exemplos:${NC}"
    echo "  $0 install"
    echo "  $0 status"
    echo "  $0 logs"
    echo "  $0 uninstall"
}

# Função principal
main() {
    case "${1:-install}" in
        "install")
            echo -e "${BLUE}🔧 Instalando serviço de inicialização automática...${NC}"
            check_script
            create_plist
            load_service
            check_status
            echo -e "${GREEN}🎉 Instalação concluída!${NC}"
            echo -e "${YELLOW}💡 O sistema iniciará automaticamente com o MacBook${NC}"
            ;;
        "uninstall")
            remove_service
            ;;
        "start")
            load_service
            check_status
            ;;
        "stop")
            stop_service
            ;;
        "restart")
            stop_service
            sleep 2
            load_service
            check_status
            ;;
        "status")
            check_status
            ;;
        "logs")
            show_logs
            ;;
        "help")
            show_help
            ;;
        *)
            echo -e "${RED}❌ Comando inválido: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@"












