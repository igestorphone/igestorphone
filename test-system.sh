#!/bin/bash

# iGestorPhone - Teste do Sistema
# Este script verifica se todos os componentes estão funcionando

echo "🧪 iGestorPhone - Teste do Sistema"
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0

# Função para testar comando
test_command() {
    local test_name="$1"
    local command="$2"
    local expected_exit_code="${3:-0}"
    
    echo -n "🔍 Testando $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        if [ $? -eq $expected_exit_code ]; then
            echo -e "${GREEN}✅ PASSOU${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ FALHOU (código de saída incorreto)${NC}"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "${RED}❌ FALHOU${NC}"
        ((TESTS_FAILED++))
    fi
}

# Função para testar URL
test_url() {
    local test_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    echo -n "🔍 Testando $test_name... "
    
    local status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSOU (Status: $status_code)${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FALHOU (Status: $status_code, Esperado: $expected_status)${NC}"
        ((TESTS_FAILED++))
    fi
}

echo -e "${BLUE}🚀 Iniciando testes do sistema...${NC}"
echo ""

# Teste 1: Verificar se Node.js está instalado
test_command "Node.js" "node --version"

# Teste 2: Verificar se npm está instalado
test_command "npm" "npm --version"

# Teste 3: Verificar se PostgreSQL está instalado
test_command "PostgreSQL" "psql --version"

# Teste 4: Verificar se PostgreSQL está rodando
test_command "PostgreSQL rodando" "brew services list | grep -q 'postgresql.*started'"

# Teste 5: Verificar se banco existe
test_command "Banco igestorphone" "psql -d igestorphone -c 'SELECT 1;'"

# Teste 6: Verificar se dependências estão instaladas
test_command "Dependências Node.js" "npm list --depth=0"

# Teste 7: Verificar se arquivos de configuração existem
test_command "Arquivo .env" "[ -f .env ]"

# Teste 8: Verificar se scripts são executáveis
test_command "Scripts executáveis" "[ -x setup-complete.sh ] && [ -x start-production.sh ]"

# Teste 9: Verificar se diretórios existem
test_command "Diretório backend" "[ -d backend/src ]"
test_command "Diretório logs" "[ -d logs ]"

# Teste 10: Verificar se arquivos de migração existem
test_command "Arquivo migrate.js" "[ -f backend/src/migrate.js ]"
test_command "Arquivo seed.js" "[ -f backend/src/seed.js ]"

echo ""
echo -e "${BLUE}🌐 Testando conectividade...${NC}"

# Teste 11: Verificar se backend responde (se estiver rodando)
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    test_url "Backend API" "http://localhost:3001/api/health" "200"
else
    echo -e "${YELLOW}⚠️  Backend não está rodando - pulando teste de API${NC}"
fi

# Teste 12: Verificar se frontend responde (se estiver rodando)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    test_url "Frontend" "http://localhost:3000" "200"
else
    echo -e "${YELLOW}⚠️  Frontend não está rodando - pulando teste de frontend${NC}"
fi

echo ""
echo -e "${BLUE}📊 Verificando estrutura do banco...${NC}"

# Teste 13: Verificar se tabelas existem
test_command "Tabela users" "psql -d igestorphone -c 'SELECT 1 FROM users LIMIT 1;'"
test_command "Tabela products" "psql -d igestorphone -c 'SELECT 1 FROM products LIMIT 1;'"
test_command "Tabela suppliers" "psql -d igestorphone -c 'SELECT 1 FROM suppliers LIMIT 1;'"
test_command "Tabela subscriptions" "psql -d igestorphone -c 'SELECT 1 FROM subscriptions LIMIT 1;'"

# Teste 14: Verificar se dados iniciais existem
test_command "Usuário admin" "psql -d igestorphone -c 'SELECT 1 FROM users WHERE email = '\''admin@igestorphone.com'\'';'"
test_command "Fornecedores" "psql -d igestorphone -c 'SELECT COUNT(*) FROM suppliers;' | grep -q '[1-9]'"

echo ""
echo -e "${BLUE}🔧 Testando funcionalidades...${NC}"

# Teste 15: Verificar se migrações funcionam
test_command "Migrações" "cd backend && node src/migrate.js"

# Teste 16: Verificar se seed funciona (sem duplicar dados)
test_command "Seed (verificação)" "cd backend && node src/seed.js"

echo ""
echo "=================================="
echo -e "${BLUE}📊 Resultado dos Testes:${NC}"
echo -e "   Testes passaram: ${GREEN}$TESTS_PASSED${NC}"
echo -e "   Testes falharam: ${RED}$TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 Todos os testes passaram! Sistema funcionando perfeitamente.${NC}"
    echo ""
    echo -e "${BLUE}🚀 Próximos passos:${NC}"
    echo "   1. Execute: ./setup-complete.sh (se ainda não executou)"
    echo "   2. Execute: ./start-production.sh start"
    echo "   3. Acesse: http://localhost:3000"
    echo "   4. Configure suas chaves do Stripe no arquivo .env"
    exit 0
else
    echo -e "${RED}❌ Alguns testes falharam. Verifique os erros acima.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Comandos para resolver problemas:${NC}"
    echo "   • PostgreSQL não rodando: brew services start postgresql@14"
    echo "   • Dependências: npm install"
    echo "   • Banco não existe: ./setup-database.sh"
    echo "   • Dados não existem: npm run db:migrate && npm run db:seed"
    exit 1
fi












