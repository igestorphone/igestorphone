# 🔍 Verificar e Corrigir Banco de Dados

## 🚨 Problema

Erro ao criar usuário pode ser causado por:
1. Tabela `users` não existe
2. Colunas faltando na tabela `users`
3. Tabelas relacionadas faltando (`user_permissions`, `subscriptions`, etc.)

---

## ✅ Verificação Rápida

### 1. Acessar Render Shell

1. Vá no **Render Dashboard**
2. Selecione seu serviço de **backend**
3. Clique em **Shell** (lado esquerdo)
4. Aguarde a conexão

### 2. Verificar Tabela `users`

Execute:

```sql
-- Verificar se a tabela existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'users';

-- Se retornar algo, a tabela existe ✅
-- Se não retornar nada, a tabela não existe ❌
```

### 3. Verificar Colunas da Tabela `users`

Execute:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**Colunas que DEVEM existir:**

- ✅ `id` (SERIAL PRIMARY KEY)
- ✅ `name` (VARCHAR)
- ✅ `email` (VARCHAR, UNIQUE)
- ✅ `password_hash` (VARCHAR)
- ✅ `tipo` (VARCHAR)
- ✅ `telefone` (VARCHAR, nullable)
- ✅ `endereco` (VARCHAR, nullable)
- ✅ `cidade` (VARCHAR, nullable)
- ✅ `estado` (VARCHAR, nullable)
- ✅ `cep` (VARCHAR, nullable)
- ✅ `cpf` (VARCHAR, nullable)
- ✅ `rg` (VARCHAR, nullable)
- ✅ `data_nascimento` (DATE, nullable)
- ✅ `is_active` (BOOLEAN)
- ✅ `created_at` (TIMESTAMP)
- ✅ `last_login` (TIMESTAMP, nullable)
- ✅ `subscription_status` (VARCHAR, nullable)
- ✅ `subscription_expires_at` (TIMESTAMP, nullable)

**Colunas NOVAS (sistema de registro):**

- ✅ `approval_status` (VARCHAR, nullable)
- ✅ `access_expires_at` (TIMESTAMP, nullable)
- ✅ `access_duration_days` (INTEGER, nullable)
- ✅ `whatsapp` (VARCHAR, nullable)
- ✅ `nome_loja` (VARCHAR, nullable)
- ✅ `cnpj` (VARCHAR, nullable)

---

## 🔧 Adicionar Colunas Faltando

Se alguma coluna estiver faltando, execute:

```sql
-- Adicionar colunas básicas (se faltarem)
ALTER TABLE users ADD COLUMN IF NOT EXISTS telefone VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS endereco VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cidade VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS estado VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf VARCHAR(14);
ALTER TABLE users ADD COLUMN IF NOT EXISTS rg VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_nascimento DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Adicionar colunas do sistema de registro (se faltarem)
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_duration_days INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS nome_loja VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
```

---

## 🔍 Verificar Tabelas Relacionadas

### Tabela `user_permissions`

```sql
-- Verificar se existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'user_permissions';

-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  permission_name VARCHAR(100) NOT NULL,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission_name)
);
```

### Tabela `subscriptions`

```sql
-- Verificar se existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'subscriptions';

-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_name VARCHAR(100),
  plan_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  duration_months INTEGER,
  price DECIMAL(10, 2),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabela `registration_tokens`

```sql
-- Verificar se existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'registration_tokens';

-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS registration_tokens (
  id SERIAL PRIMARY KEY,
  token VARCHAR(255) UNIQUE NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  used_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🚀 Executar Migration Completa

Se preferir executar a migration completa:

```bash
cd backend/src/migrations
node add-registration-system.js
```

Isso adiciona todas as colunas e tabelas necessárias.

---

## 📋 Checklist Completo

- [ ] Tabela `users` existe
- [ ] Todas as colunas básicas existem
- [ ] Colunas do sistema de registro existem
- [ ] Tabela `user_permissions` existe
- [ ] Tabela `subscriptions` existe
- [ ] Tabela `registration_tokens` existe
- [ ] Testar criar usuário novamente

---

## 🆘 Se Ainda Não Funcionar

1. **Copie o erro completo** do console do navegador (F12)
2. **Copie os logs do Render** (últimas 50 linhas)
3. **Me envie essas informações** para diagnóstico preciso

---

**Status:** ✅ Guia completo para diagnóstico do banco de dados

