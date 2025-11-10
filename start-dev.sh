#!/bin/bash

echo "🚀 Iniciando iGestorPhone - Sistema Completo"
echo "=============================================="

# Verificar se o PostgreSQL está rodando
echo "📊 Verificando PostgreSQL..."
if ! pg_isready -q; then
    echo "❌ PostgreSQL não está rodando. Inicie o PostgreSQL primeiro."
    echo "   macOS: brew services start postgresql"
    echo "   Linux: sudo systemctl start postgresql"
    exit 1
fi
echo "✅ PostgreSQL está rodando"

# Verificar se o banco existe
echo "🗄️ Verificando banco de dados..."
if ! psql -lqt | cut -d \| -f 1 | grep -qw igestorphone; then
    echo "📝 Criando banco de dados..."
    createdb igestorphone
    echo "✅ Banco de dados criado"
else
    echo "✅ Banco de dados já existe"
fi

# Instalar dependências do backend
echo "📦 Instalando dependências do backend..."
cd backend
npm install

# Configurar .env se não existir
if [ ! -f .env ]; then
    echo "⚙️ Configurando arquivo .env..."
    cp env.example .env
    echo "📝 Edite o arquivo backend/.env com suas configurações"
    echo "   - DB_PASSWORD: sua senha do PostgreSQL"
    echo "   - OPENAI_API_KEY: sua chave da API OpenAI"
    echo "   - JWT_SECRET: uma chave secreta para JWT"
fi

# Iniciar backend
echo "🔧 Iniciando backend..."
npm run dev &
BACKEND_PID=$!

# Aguardar backend iniciar
echo "⏳ Aguardando backend iniciar..."
sleep 5

# Verificar se backend está rodando
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Backend não iniciou corretamente"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi
echo "✅ Backend iniciado com sucesso"

# Voltar para o diretório raiz
cd ..

# Instalar dependências do frontend
echo "📦 Instalando dependências do frontend..."
npm install

# Iniciar frontend
echo "🎨 Iniciando frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Sistema iniciado com sucesso!"
echo "=============================================="
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend:  http://localhost:3001"
echo "📊 Health:   http://localhost:3001/health"
echo ""
echo "👤 Usuários de teste:"
echo "   Admin: admin@igestorphone.com / admin123"
echo "   User:  usuario@igestorphone.com / usuario123"
echo ""
echo "🛑 Para parar: Ctrl+C"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo "🛑 Parando serviços..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Serviços parados"
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT

# Manter script rodando
wait














