#!/bin/bash

# iGestorPhone - Instalação do Serviço de Inicialização Automática
# Este script instala o iGestorPhone para iniciar automaticamente com o macOS

echo "🔧 Instalando Serviço de Inicialização Automática..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se estamos no diretório correto
if [ ! -f "start-system.sh" ]; then
    echo -e "${RED}❌ Execute este script no diretório raiz do projeto iGestorPhone${NC}"
    exit 1
fi

# Criar diretório de logs
echo -e "${BLUE}📁 Criando diretório de logs...${NC}"
mkdir -p logs

# Copiar arquivo de configuração para LaunchAgents
echo -e "${BLUE}📋 Instalando arquivo de configuração...${NC}"
cp com.igestorphone.startup.plist ~/Library/LaunchAgents/

# Carregar o serviço
echo -e "${BLUE}🔄 Carregando serviço...${NC}"
launchctl load ~/Library/LaunchAgents/com.igestorphone.startup.plist

# Verificar se o serviço foi carregado
if launchctl list | grep -q "com.igestorphone.startup"; then
    echo -e "${GREEN}✅ Serviço instalado com sucesso!${NC}"
else
    echo -e "${RED}❌ Erro ao instalar serviço${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 iGestorPhone configurado para iniciar automaticamente!${NC}"
echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo -e "   Parar serviço: ${YELLOW}launchctl unload ~/Library/LaunchAgents/com.igestorphone.startup.plist${NC}"
echo -e "   Iniciar serviço: ${YELLOW}launchctl load ~/Library/LaunchAgents/com.igestorphone.startup.plist${NC}"
echo -e "   Ver status: ${YELLOW}launchctl list | grep igestorphone${NC}"
echo -e "   Ver logs: ${YELLOW}tail -f logs/system.log${NC}"
echo ""
echo -e "${YELLOW}💡 O sistema iniciará automaticamente na próxima reinicialização do MacBook${NC}"













