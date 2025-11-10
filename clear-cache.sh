#!/bin/bash

echo "🧹 LIMPANDO CACHE E REINICIANDO SISTEMA..."

# Parar processos
pkill -f "vite" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true

# Limpar cache do npm
npm cache clean --force

# Limpar cache do Vite
rm -rf node_modules/.vite 2>/dev/null || true
rm -rf dist 2>/dev/null || true

# Reinstalar dependências
npm install

echo "✅ Cache limpo! Reiniciando frontend..."

# Iniciar frontend
npm run dev













