#!/bin/bash

echo "🧹 Limpando cache e reiniciando servidor..."

# Parar servidor se estiver rodando
pkill -f "npm run dev" 2>/dev/null

# Limpar cache do npm
npm cache clean --force

# Limpar node_modules e reinstalar
rm -rf node_modules
npm install

# Iniciar servidor
echo "🚀 Iniciando servidor..."
npm run dev













