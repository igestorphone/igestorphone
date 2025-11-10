# 🚀 iGestorPhone - Instalação Completa

Sistema completo de comparação de preços de celulares com IA integrada.

## 📋 Pré-requisitos

### 1. Software Necessário
- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 12+** - [Download](https://www.postgresql.org/download/)
- **Git** - [Download](https://git-scm.com/)

### 2. Contas Necessárias
- **OpenAI API** - [Criar conta](https://platform.openai.com/)

## ⚙️ Instalação Passo a Passo

### 1. Clone o Repositório
```bash
git clone <seu-repositorio>
cd igestorphone
```

### 2. Configure o PostgreSQL

**macOS (com Homebrew):**
```bash
# Instalar PostgreSQL
brew install postgresql

# Iniciar serviço
brew services start postgresql

# Criar banco de dados
createdb igestorphone
```

**Linux (Ubuntu/Debian):**
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Criar banco de dados
sudo -u postgres createdb igestorphone
```

**Windows:**
- Instale PostgreSQL pelo site oficial
- Use pgAdmin para criar o banco `igestorphone`

### 3. Configure as Variáveis de Ambiente

**Backend:**
```bash
cd backend
cp env.example .env
```

Edite `backend/.env`:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=igestorphone
DB_USER=postgres
DB_PASSWORD=SUA_SENHA_POSTGRESQL

# JWT Configuration
JWT_SECRET=uma_chave_super_secreta_aqui
JWT_EXPIRES_IN=7d

# OpenAI Configuration
OPENAI_API_KEY=sk-sua_chave_openai_aqui

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
```

### 4. Instale as Dependências

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd ..
npm install
```

### 5. Configure o Banco de Dados

```bash
cd backend
npm run seed
```

### 6. Inicie o Sistema

**Opção 1 - Script Automático:**
```bash
./start-dev.sh
```

**Opção 2 - Manual:**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd ..
npm run dev
```

## 🎯 Verificação da Instalação

### 1. Backend
- Acesse: http://localhost:3001/health
- Deve retornar: `{"success": true, "message": "iGestorPhone API is running"}`

### 2. Frontend
- Acesse: http://localhost:5173
- Deve carregar a tela de login

### 3. Login de Teste
- **Admin:** admin@igestorphone.com / admin123
- **Usuário:** usuario@igestorphone.com / usuario123

## 🤖 Configuração da IA

### 1. Obter Chave OpenAI
1. Acesse: https://platform.openai.com/
2. Crie uma conta ou faça login
3. Vá em "API Keys"
4. Crie uma nova chave
5. Copie a chave (começa com `sk-`)

### 2. Configurar no Backend
```bash
# Edite backend/.env
OPENAI_API_KEY=sk-sua_chave_aqui
```

### 3. Testar IA
1. Faça login no sistema
2. Vá em "Processar Lista com IA"
3. Cole uma lista de produtos
4. Clique em "Processar Lista"

## 📊 Funcionalidades Disponíveis

### ✅ Implementado
- **Autenticação** - Login/logout com JWT
- **Processamento de Listas** - IA OpenAI integrada
- **Gestão de Fornecedores** - CRUD completo
- **Consulta de Produtos** - Busca e filtros
- **Estatísticas** - Dados em tempo real
- **Interface Responsiva** - Mobile e desktop

### 🔄 Em Desenvolvimento
- **Notificações Push** - Alertas em tempo real
- **Relatórios Avançados** - PDF e Excel
- **API Externa** - Integração com marketplaces
- **Cache Inteligente** - Performance otimizada

## 🛠️ Solução de Problemas

### Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Verificar se banco existe
psql -l | grep igestorphone
```

### Erro de OpenAI
- Verifique se a chave está correta
- Verifique se tem créditos na conta OpenAI
- Verifique a conexão com a internet

### Erro de CORS
- Verifique se `CORS_ORIGIN` está correto no `.env`
- Deve ser: `http://localhost:5173`

### Porta em Uso
```bash
# Verificar portas em uso
lsof -i :3001
lsof -i :5173

# Matar processo se necessário
kill -9 <PID>
```

## 📱 Testando o Sistema

### 1. Login
- Use as credenciais de teste
- Verifique se redireciona para dashboard

### 2. Processar Lista
- Vá em "Processar Lista com IA"
- Cole uma lista como:
```
KING FORNECEDOR
WhatsApp: +5511983132474

iPhone 15 Pro 256GB lacrado - R$ 6.499
iPhone 15 Pro Max 512GB - R$ 7.999
iPhone 14 128GB seminovo - R$ 2.450
```

### 3. Consultar Fornecedores
- Vá em "Consultar Fornecedores"
- Verifique se os dados processados aparecem

## 🚀 Deploy em Produção

### 1. Configurar Variáveis
```env
NODE_ENV=production
DB_HOST=seu_host_producao
DB_PASSWORD=sua_senha_producao
JWT_SECRET=chave_super_secreta_producao
```

### 2. Build Frontend
```bash
npm run build
```

### 3. Iniciar Backend
```bash
cd backend
npm start
```

## 📞 Suporte

Para suporte técnico:
- **Email:** suporte@igestorphone.com
- **GitHub:** [Issues](https://github.com/seu-usuario/igestorphone/issues)

## 🎉 Pronto!

Seu sistema iGestorPhone está funcionando com:
- ✅ Backend completo
- ✅ Banco de dados configurado
- ✅ IA integrada
- ✅ Frontend responsivo
- ✅ Autenticação segura

**Aproveite o sistema!** 🚀














