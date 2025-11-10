# 🚀 iGestorPhone - Configuração Profissional

Sistema completo de automação para lojistas Apple com banco de dados PostgreSQL, backend Node.js e interface visual.

## 📋 Visão Geral

Este sistema foi projetado para funcionar 24/7 no seu MacBook, com:
- **Banco de dados PostgreSQL** permanente e confiável
- **Backend Node.js** com Express e autenticação JWT
- **Frontend React** com TypeScript
- **Sistema de assinatura** com Stripe
- **Interface visual** (pgAdmin) para gerenciar o banco
- **Monitoramento automático** e restart em caso de falhas

## 🛠️ Instalação Rápida

### 1. Configuração Completa (Recomendado)
```bash
./setup-complete.sh
```

Este script faz tudo automaticamente:
- Instala e configura PostgreSQL
- Instala todas as dependências
- Configura o banco de dados
- Popula com dados iniciais
- Instala pgAdmin (interface visual)
- Inicia o sistema

### 2. Instalação Manual

#### Passo 1: Configurar PostgreSQL
```bash
./setup-database.sh
```

#### Passo 2: Instalar Dependências
```bash
npm install
```

#### Passo 3: Configurar Variáveis de Ambiente
```bash
cp env.example .env
# Edite o arquivo .env com suas configurações
```

#### Passo 4: Configurar Banco de Dados
```bash
npm run db:migrate
npm run db:seed
```

#### Passo 5: Instalar Interface Visual (Opcional)
```bash
./install-pgadmin.sh
```

## 🚀 Executando o Sistema

### Desenvolvimento
```bash
# Frontend e Backend juntos
npm run dev:full

# Apenas frontend
npm run dev

# Apenas backend
npm run backend
```

### Produção (24/7)
```bash
# Iniciar sistema
./start-production.sh start

# Ver status
./start-production.sh status

# Ver logs
./start-production.sh logs

# Monitorar sistema
./start-production.sh monitor

# Parar sistema
./start-production.sh stop
```

## 📊 Acessos

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **pgAdmin**: Abra o aplicativo pgAdmin 4

## 👤 Usuários Padrão

- **Admin**: admin@igestorphone.com (senha: admin123)
- **Teste**: teste@igestorphone.com (senha: test123)

## 🗄️ Banco de Dados

### Configuração
- **Host**: localhost
- **Porta**: 5432
- **Banco**: igestorphone
- **Usuário**: seu_usuario_mac
- **Senha**: (vazia por padrão)

### Gerenciamento Visual
1. Abra o pgAdmin 4
2. Clique em "Add New Server"
3. Use as configurações acima
4. Explore tabelas, execute queries, etc.

### Comandos Úteis
```bash
# Conectar ao banco
psql -d igestorphone

# Ver tabelas
\dt

# Ver dados de uma tabela
SELECT * FROM users;

# Sair
\q
```

## 🔧 Configuração Avançada

### Variáveis de Ambiente (.env)
```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=igestorphone
DB_USER=mac
DB_PASSWORD=

# Servidor
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# JWT
JWT_SECRET=sua_chave_secreta_super_segura
JWT_EXPIRES_IN=7d

# Stripe (para pagamentos)
STRIPE_SECRET_KEY=sk_live_sua_chave_secreta
STRIPE_PUBLISHABLE_KEY=pk_live_sua_chave_publica
STRIPE_WEBHOOK_SECRET=whsec_sua_chave_webhook

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
FROM_EMAIL=noreply@igestorphone.com
```

### Configuração do Stripe
1. Crie uma conta no Stripe
2. Obtenha suas chaves de API
3. Configure webhooks para: `/api/subscriptions/webhook`
4. Adicione as chaves no arquivo `.env`

### Configuração de Email
1. Configure um servidor SMTP (Gmail, SendGrid, etc.)
2. Adicione as credenciais no arquivo `.env`
3. Teste o envio de emails

## 📱 Sistema de Assinatura

### Planos Disponíveis
- **Trial**: 30 dias grátis
- **Básico**: R$ 29,90/mês
- **Premium**: R$ 59,90/mês

### Funcionalidades por Plano
- **Trial**: Busca básica, acompanhamento de preços
- **Básico**: Busca avançada, alertas de preço, gerenciamento de fornecedores
- **Premium**: Todas as funcionalidades, acesso à API, suporte prioritário

## 🔍 Monitoramento

### Logs
- **Backend**: `logs/backend.log`
- **Frontend**: `logs/frontend.log`
- **Erros**: `logs/error.log`
- **Geral**: `logs/combined.log`

### Health Check
```bash
# Verificar status
curl http://localhost:3001/api/health

# Verificar logs
./start-production.sh logs

# Monitorar em tempo real
./start-production.sh monitor
```

## 🛡️ Segurança

### Configurações Implementadas
- Autenticação JWT
- Rate limiting
- Validação de dados
- Sanitização de inputs
- Headers de segurança
- Logs de auditoria

### Recomendações
1. Altere a JWT_SECRET em produção
2. Configure HTTPS
3. Use senhas fortes
4. Monitore logs regularmente
5. Mantenha dependências atualizadas

## 📈 Escalabilidade

### Para Múltiplos Usuários
1. Configure um servidor dedicado
2. Use um banco PostgreSQL em servidor separado
3. Configure load balancer
4. Implemente cache (Redis)
5. Use CDN para assets estáticos

### Backup
```bash
# Backup do banco
pg_dump igestorphone > backup_$(date +%Y%m%d).sql

# Restaurar backup
psql igestorphone < backup_20240101.sql
```

## 🚨 Troubleshooting

### Problemas Comuns

#### PostgreSQL não inicia
```bash
brew services restart postgresql@14
```

#### Porta já em uso
```bash
# Verificar o que está usando a porta
lsof -i :3000
lsof -i :3001

# Matar processo
kill -9 PID_DO_PROCESSO
```

#### Erro de permissão
```bash
chmod +x *.sh
```

#### Dependências não instaladas
```bash
rm -rf node_modules package-lock.json
npm install
```

### Logs de Erro
```bash
# Ver logs de erro
tail -f logs/error.log

# Ver logs do sistema
./start-production.sh logs all
```

## 📞 Suporte

### Comandos de Diagnóstico
```bash
# Status completo
./start-production.sh status

# Health check
curl http://localhost:3001/api/health

# Logs em tempo real
./start-production.sh logs all

# Verificar PostgreSQL
brew services list | grep postgresql
```

### Informações do Sistema
```bash
# Versão do Node
node --version

# Versão do PostgreSQL
psql --version

# Espaço em disco
df -h

# Memória
top -l 1 | grep PhysMem
```

## 🎯 Próximos Passos

1. **Configure suas chaves do Stripe** no arquivo `.env`
2. **Configure o email** para notificações
3. **Teste o sistema** com os usuários padrão
4. **Personalize** conforme suas necessidades
5. **Configure backup** automático
6. **Monitore** o sistema regularmente

## 📚 Documentação Adicional

- [API Documentation](docs/api.md)
- [Database Schema](docs/database.md)
- [Frontend Components](docs/frontend.md)
- [Deployment Guide](docs/deployment.md)

---

**🎉 Parabéns! Seu sistema iGestorPhone está pronto para uso profissional!**

Para dúvidas ou suporte, consulte os logs ou execute os comandos de diagnóstico acima.