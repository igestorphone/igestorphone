#!/bin/bash

# iGestorPhone - Script de Backup do Banco de Dados
# Este script cria backups automáticos do banco PostgreSQL

echo "💾 iGestorPhone - Backup do Banco de Dados"
echo "=========================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
DB_NAME="igestorphone"
DB_USER="${USER}"
BACKUP_DIR="backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/igestorphone_backup_${DATE}.sql"
BACKUP_FILE_COMPRESSED="${BACKUP_FILE}.gz"

# Criar diretório de backup se não existir
mkdir -p $BACKUP_DIR

# Função para criar backup
create_backup() {
    echo -e "${BLUE}📦 Criando backup do banco de dados...${NC}"
    
    # Verificar se PostgreSQL está rodando
    if ! brew services list | grep -q "postgresql.*started"; then
        echo -e "${RED}❌ PostgreSQL não está rodando${NC}"
        echo -e "${YELLOW}💡 Execute: brew services start postgresql@14${NC}"
        exit 1
    fi
    
    # Verificar se banco existe
    if ! psql -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${RED}❌ Banco de dados '$DB_NAME' não encontrado${NC}"
        exit 1
    fi
    
    # Criar backup
    echo -e "${BLUE}🔄 Executando pg_dump...${NC}"
    if pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_FILE; then
        echo -e "${GREEN}✅ Backup criado: $BACKUP_FILE${NC}"
        
        # Comprimir backup
        echo -e "${BLUE}🗜️  Comprimindo backup...${NC}"
        if gzip $BACKUP_FILE; then
            echo -e "${GREEN}✅ Backup comprimido: $BACKUP_FILE_COMPRESSED${NC}"
            BACKUP_FILE=$BACKUP_FILE_COMPRESSED
        else
            echo -e "${YELLOW}⚠️  Erro ao comprimir, mantendo arquivo original${NC}"
        fi
        
        # Mostrar informações do backup
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${BLUE}📊 Tamanho do backup: $BACKUP_SIZE${NC}"
        
        return 0
    else
        echo -e "${RED}❌ Erro ao criar backup${NC}"
        exit 1
    fi
}

# Função para restaurar backup
restore_backup() {
    local backup_file=$1
    
    if [ -z "$backup_file" ]; then
        echo -e "${RED}❌ Arquivo de backup não especificado${NC}"
        echo -e "${YELLOW}💡 Uso: $0 restore <arquivo_backup>${NC}"
        exit 1
    fi
    
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}❌ Arquivo de backup não encontrado: $backup_file${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER o banco atual!${NC}"
    read -p "Tem certeza que deseja continuar? (y/N): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ Operação cancelada${NC}"
        exit 0
    fi
    
    echo -e "${BLUE}🔄 Restaurando backup...${NC}"
    
    # Verificar se PostgreSQL está rodando
    if ! brew services list | grep -q "postgresql.*started"; then
        echo -e "${YELLOW}⚠️  PostgreSQL não está rodando. Iniciando...${NC}"
        brew services start postgresql@14
        sleep 5
    fi
    
    # Restaurar backup
    if [[ $backup_file == *.gz ]]; then
        # Backup comprimido
        if gunzip -c "$backup_file" | psql -h localhost -U $DB_USER -d $DB_NAME; then
            echo -e "${GREEN}✅ Backup restaurado com sucesso${NC}"
        else
            echo -e "${RED}❌ Erro ao restaurar backup${NC}"
            exit 1
        fi
    else
        # Backup não comprimido
        if psql -h localhost -U $DB_USER -d $DB_NAME < "$backup_file"; then
            echo -e "${GREEN}✅ Backup restaurado com sucesso${NC}"
        else
            echo -e "${RED}❌ Erro ao restaurar backup${NC}"
            exit 1
        fi
    fi
}

# Função para listar backups
list_backups() {
    echo -e "${BLUE}📋 Backups disponíveis:${NC}"
    echo "========================"
    
    if [ -d "$BACKUP_DIR" ] && [ "$(ls -A $BACKUP_DIR)" ]; then
        ls -lah $BACKUP_DIR/*.sql* 2>/dev/null | while read line; do
            echo -e "${GREEN}$line${NC}"
        done
    else
        echo -e "${YELLOW}⚠️  Nenhum backup encontrado${NC}"
    fi
}

# Função para limpar backups antigos
cleanup_old_backups() {
    local days=${1:-30}
    
    echo -e "${BLUE}🧹 Limpando backups antigos (mais de $days dias)...${NC}"
    
    if find $BACKUP_DIR -name "*.sql*" -mtime +$days -delete 2>/dev/null; then
        echo -e "${GREEN}✅ Backups antigos removidos${NC}"
    else
        echo -e "${YELLOW}⚠️  Nenhum backup antigo encontrado${NC}"
    fi
}

# Função para backup automático
auto_backup() {
    echo -e "${BLUE}🤖 Iniciando backup automático...${NC}"
    
    # Criar backup
    create_backup
    
    # Limpar backups antigos (manter últimos 7 dias)
    cleanup_old_backups 7
    
    echo -e "${GREEN}✅ Backup automático concluído${NC}"
}

# Função para mostrar ajuda
show_help() {
    echo -e "${BLUE}📖 Comandos Disponíveis:${NC}"
    echo "  create              - Criar backup"
    echo "  restore <arquivo>   - Restaurar backup"
    echo "  list               - Listar backups"
    echo "  cleanup [dias]     - Limpar backups antigos (padrão: 30 dias)"
    echo "  auto               - Backup automático com limpeza"
    echo "  help               - Mostrar esta ajuda"
    echo ""
    echo -e "${BLUE}Exemplos:${NC}"
    echo "  $0 create"
    echo "  $0 restore backups/igestorphone_backup_20240101_120000.sql.gz"
    echo "  $0 list"
    echo "  $0 cleanup 7"
    echo "  $0 auto"
}

# Função principal
main() {
    case "${1:-create}" in
        "create")
            create_backup
            ;;
        "restore")
            restore_backup "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_old_backups "$2"
            ;;
        "auto")
            auto_backup
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












