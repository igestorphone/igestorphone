# 🚀 **ROTINA COMPLETA - iGestorPhone**

## 📋 **ROTINA DIÁRIA - Passo a Passo**

### **1️⃣ VERIFICAR SE TUDO ESTÁ FUNCIONANDO**

```bash
# Verificar status do sistema
./start-production.sh status
```

**✅ Deve mostrar:**
- Backend: ✅ Rodando
- Frontend: ✅ Rodando  
- PostgreSQL: ✅ Rodando

---

### **2️⃣ SE NADA ESTIVER RODANDO - INICIAR TUDO**

```bash
# Iniciar sistema completo
./start-production.sh start
```

**✅ Deve mostrar:**
- Backend iniciado com sucesso
- Frontend iniciado com sucesso
- Health Check: ✅ OK

---

### **3️⃣ SE APENAS O POSTGRESQL NÃO ESTIVER RODANDO**

```bash
# Iniciar apenas PostgreSQL
brew services start postgresql@14

# Aguardar 5 segundos
sleep 5

# Verificar se iniciou
brew services list | grep postgresql
```

**✅ Deve mostrar:**
- postgresql@14 started

---

### **4️⃣ SE APENAS O BACKEND/FRONTEND NÃO ESTIVER RODANDO**

```bash
# Parar tudo primeiro
./start-production.sh stop

# Aguardar 2 segundos
sleep 2

# Iniciar novamente
./start-production.sh start
```

---

### **5️⃣ ABRIR O SISTEMA NO NAVEGADOR**

**Acesse:** http://localhost:3000

**Login:**
- **Admin**: admin@igestorphone.com (senha: admin123)
- **Teste**: teste@igestorphone.com (senha: test123)

---

### **6️⃣ ABRIR O BANCO DE DADOS VISUAL (pgAdmin)**

```bash
# Abrir pgAdmin
open -a "pgAdmin 4"
```

**No pgAdmin:**
1. Clique em "Add New Server"
2. **Name**: iGestorPhone Local
3. **Host**: localhost
4. **Port**: 5432
5. **Database**: igestorphone
6. **Username**: MAC
7. **Password**: (deixe vazio)
8. Clique em "Save"

---

## 🚨 **COMANDOS DE EMERGÊNCIA**

### **Se algo der errado:**

```bash
# Parar tudo
./start-production.sh stop

# Limpar cache
./clear-cache.sh

# Reinstalar dependências
npm install

# Recriar banco (CUIDADO: apaga tudo!)
npm run db:reset
npm run db:migrate
npm run db:seed

# Iniciar novamente
./start-production.sh start
```

---

## 📊 **VERIFICAÇÕES RÁPIDAS**

### **Verificar se está tudo OK:**

```bash
# Status completo
./start-production.sh status

# Testar API
curl http://localhost:3001/api/health

# Testar frontend
curl http://localhost:3000

# Ver logs se houver problema
./start-production.sh logs
```

---

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **Erro: "Porta já em uso"**
```bash
# Ver o que está usando a porta
lsof -i :3000
lsof -i :3001

# Matar processo específico
kill -9 PID_DO_PROCESSO

# Ou parar tudo e reiniciar
./start-production.sh stop
./start-production.sh start
```

### **Erro: "PostgreSQL não conecta"**
```bash
# Reiniciar PostgreSQL
brew services restart postgresql@14

# Aguardar e testar
sleep 5
psql -d igestorphone -c "SELECT 1;"
```

### **Erro: "Dependências não encontradas"**
```bash
# Reinstalar dependências
npm install

# Limpar cache
npm cache clean --force
```

---

## 📱 **ROTINA DE DESENVOLVIMENTO**

### **Para trabalhar no código:**

```bash
# Parar produção
./start-production.sh stop

# Iniciar em modo desenvolvimento
npm run dev:full

# Ou apenas frontend
npm run dev

# Ou apenas backend
npm run backend
```

### **Para voltar à produção:**

```bash
# Parar desenvolvimento (Ctrl+C)
# Iniciar produção
./start-production.sh start
```

---

## 🔄 **ROTINA DE BACKUP**

### **Fazer backup do banco:**

```bash
# Criar backup
./backup-database.sh create

# Listar backups
./backup-database.sh list

# Restaurar backup (se necessário)
./backup-database.sh restore nome_do_arquivo.sql.gz
```

---

## ⚙️ **CONFIGURAÇÃO INICIAL (UMA VEZ SÓ)**

### **Se for a primeira vez:**

```bash
# Configuração completa
./setup-complete.sh

# Configurar inicialização automática
./setup-autostart.sh install

# Testar sistema
./test-system.sh
```

---

## 📋 **CHECKLIST DIÁRIO**

- [ ] **PostgreSQL rodando?** `brew services list | grep postgresql`
- [ ] **Backend rodando?** `curl http://localhost:3001/api/health`
- [ ] **Frontend rodando?** `curl http://localhost:3000`
- [ ] **Sistema acessível?** http://localhost:3000
- [ ] **pgAdmin funcionando?** `open -a "pgAdmin 4"`

---

## 🎯 **RESUMO DOS COMANDOS PRINCIPAIS**

```bash
# INICIAR TUDO
./start-production.sh start

# VER STATUS
./start-production.sh status

# PARAR TUDO
./start-production.sh stop

# REINICIAR TUDO
./start-production.sh restart

# VER LOGS
./start-production.sh logs

# ABRIR BANCO VISUAL
open -a "pgAdmin 4"

# TESTAR SISTEMA
./test-system.sh
```

---

## 📊 **INFORMAÇÕES DO SISTEMA**

### **Acessos:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **pgAdmin**: Aplicativo pgAdmin 4

### **Usuários Padrão:**
- **Admin**: admin@igestorphone.com (senha: admin123)
- **Teste**: teste@igestorphone.com (senha: test123)

### **Banco de Dados:**
- **Host**: localhost
- **Porta**: 5432
- **Banco**: igestorphone
- **Usuário**: MAC
- **Senha**: (vazia)

---

## 🔧 **COMANDOS DE DIAGNÓSTICO**

### **Verificar logs:**
```bash
# Logs do backend
tail -f logs/backend.log

# Logs do frontend
tail -f logs/frontend.log

# Logs de erro
tail -f logs/error.log

# Todos os logs
./start-production.sh logs all
```

### **Verificar processos:**
```bash
# Ver processos rodando
ps aux | grep node
ps aux | grep postgres

# Ver portas em uso
lsof -i :3000
lsof -i :3001
lsof -i :5432
```

### **Verificar espaço em disco:**
```bash
# Espaço em disco
df -h

# Tamanho dos logs
du -sh logs/
```

---

## 🚀 **PRONTO!**

**Siga esta rotina e seu sistema iGestorPhone estará sempre funcionando perfeitamente!**

**Lembre-se:**
- ✅ **Sempre verifique o status** antes de começar
- ✅ **Use os comandos de emergência** se algo der errado
- ✅ **Faça backup regularmente** dos seus dados
- ✅ **Mantenha o sistema atualizado** com `npm install`

**Boa sorte com seu negócio! 🚀💰**

---

*Documento gerado automaticamente pelo sistema iGestorPhone*
*Data: $(date)*
*Versão: 1.0*












