# 🔧 Guia: Executar Migração do Banco em Produção

## 📋 Passo a Passo Detalhado

### Método 1: Via Console do Render (Mais Fácil)

#### Passo 1: Acessar o Dashboard do Render

1. Acesse: https://dashboard.render.com
2. Faça login na sua conta
3. Você verá uma lista dos seus serviços

#### Passo 2: Encontrar o Serviço do Backend

1. Procure pelo serviço do backend (geralmente chamado de algo como):
   - `igestorphone-backend`
   - `igestorphone-api`
   - `backend`
   - Ou qualquer nome que você deu ao serviço
2. Clique no serviço para abrir

#### Passo 3: Abrir o Shell/Console

1. No menu lateral esquerdo, procure por:
   - **"Shell"** ou
   - **"Console"** ou
   - **"SSH"** ou
   - **"Terminal"**
2. Clique para abrir o terminal

**Se não encontrar a opção Shell:**
- Procure por **"Settings"** (Configurações)
- Procure por uma aba ou seção chamada **"Shell"** ou **"Terminal"**

#### Passo 4: Executar a Migração

No terminal que abriu, execute:

```bash
cd backend
node src/migrations/add-registration-system.js
```

Ou se o caminho for diferente:

```bash
node backend/src/migrations/add-registration-system.js
```

#### Passo 5: Verificar Resultado

Você deve ver:
```
🔄 Adicionando sistema de registro com aprovação...
Executando migração: ALTER TABLE users ADD COLUMN IF NOT EXISTS approva...
✅ Conectado ao PostgreSQL
✅ Migrações do sistema de registro executadas com sucesso!
🔌 Conexão fechada
```

✅ **Pronto!** A migração foi executada.

---

### Método 2: Via SSH (Alternativa)

#### Passo 1: Obter Credenciais SSH

1. No dashboard do Render, vá em **Settings**
2. Procure por **"SSH"** ou **"Access"**
3. Copie o comando SSH que aparece (algo como):
   ```bash
   ssh render@ssh.render.com -p 22
   ```

#### Passo 2: Conectar via SSH

No seu terminal local:

```bash
ssh render@ssh.render.com -p 22
```

Siga as instruções para autenticar.

#### Passo 3: Navegar e Executar

```bash
cd /opt/render/project/src  # ou o caminho do seu projeto
node backend/src/migrations/add-registration-system.js
```

---

### Método 3: Via Script de Deploy (Avançado)

Se você quiser que a migração rode automaticamente em cada deploy:

#### Passo 1: Criar Script de Deploy

Crie um arquivo `render-build.sh` na raiz do projeto:

```bash
#!/bin/bash
# render-build.sh

# Build do projeto
npm install

# Executar migração
cd backend
node src/migrations/add-registration-system.js

# Iniciar servidor
npm start
```

#### Passo 2: Configurar no Render

1. No dashboard do Render, vá em **Settings**
2. Procure por **"Build Command"**
3. Defina:
   ```bash
   chmod +x render-build.sh && ./render-build.sh
   ```

---

## 🔍 Verificando se Funcionou

### Verificar no Banco de Dados

#### Opção 1: Via Render Dashboard

1. Vá em **"PostgreSQL"** no dashboard
2. Clique no seu banco de dados
3. Abra o **"Shell"** ou **"Query Editor"**
4. Execute:

```sql
-- Verificar se a tabela existe
SELECT * FROM information_schema.tables 
WHERE table_name = 'registration_tokens';

-- Verificar se os campos foram adicionados
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('approval_status', 'access_expires_at', 'access_duration_days');
```

#### Opção 2: Via Frontend (Após Deploy)

1. Acesse o site em produção
2. Faça login como admin
3. Vá em **"Gerenciar Usuários"**
4. Se aparecer a aba **"Links de Cadastro"** e **"Pendentes"**, funcionou! ✅

---

## ⚠️ Problemas Comuns

### Erro: "Cannot find module"

**Solução:**
```bash
# Verificar se está no diretório correto
pwd

# Verificar estrutura de pastas
ls -la

# Tentar caminho absoluto
cd /opt/render/project/src
node backend/src/migrations/add-registration-system.js
```

### Erro: "Database connection failed"

**Solução:**
1. Verifique se a variável `DATABASE_URL` está configurada no Render
2. Vá em **Settings** → **Environment**
3. Verifique se `DATABASE_URL` existe e está correta

### Erro: "Permission denied"

**Solução:**
```bash
# Dar permissão de execução
chmod +x backend/src/migrations/add-registration-system.js
```

### Não encontro a opção Shell

**Solução:**
1. Alguns planos do Render podem não ter Shell
2. Use o **Método 2 (SSH)** ou
3. Use o **Método 3 (Script de Deploy)**

---

## 📸 Screenshots do Render (Onde Clicar)

### Localizar o Serviço:
```
Dashboard → Lista de Serviços → [Nome do Backend]
```

### Abrir Shell:
```
Serviço → Menu Lateral → Shell/Console/SSH
```

### Verificar Variáveis:
```
Serviço → Settings → Environment
```

---

## ✅ Checklist

- [ ] Acessei o dashboard do Render
- [ ] Encontrei o serviço do backend
- [ ] Abri o Shell/Console
- [ ] Executei a migração
- [ ] Vi a mensagem de sucesso
- [ ] Verifiquei que funcionou (via frontend ou banco)

---

## 🆘 Ainda com Dúvidas?

1. **Verifique os logs do Render:**
   - Serviço → Logs
   - Procure por erros relacionados a banco de dados

2. **Teste a conexão:**
   ```bash
   # No shell do Render, teste conexão
   psql $DATABASE_URL -c "SELECT version();"
   ```

3. **Contate o suporte do Render:**
   - Eles podem ajudar com acesso ao shell
   - Ou executar a migração para você

---

**Boa sorte! Se precisar de ajuda, me avise! 🚀**

