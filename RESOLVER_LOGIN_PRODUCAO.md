# 🔐 Resolver Problema de Login em Produção

## ⚠️ Problema

Não consegue fazer login com `igestorphone@gmail.com` em produção.

## ✅ Soluções

### Solução 1: Criar/Resetar Usuário Admin no Render (Recomendado)

#### Passo 1: Acessar o Shell do Render

1. Acesse: https://dashboard.render.com
2. Encontre o serviço de **backend**
3. Clique em **"Shell"** no menu lateral
4. Aguarde o terminal abrir

#### Passo 2: Executar Script

No terminal do Render, execute:

```bash
cd backend
node src/scripts/create-admin.js
```

Você verá:
```
🔐 Criando/Atualizando usuário admin...
✅ Usuário admin criado/atualizado!
   Email: igestorphone@gmail.com
   Senha: admin123
   Tipo: admin
```

#### Passo 3: Testar Login

1. Acesse: https://igestorphone.com.br/login
2. Email: `igestorphone@gmail.com`
3. Senha: `admin123`
4. Clique em "Entrar"

✅ **Deve funcionar agora!**

---

### Solução 2: Criar Usuário Direto no Banco (Alternativa)

Se o script não funcionar, podemos criar direto no banco:

#### Passo 1: Acessar PostgreSQL no Render

1. No Render, encontre seu serviço **PostgreSQL**
2. Clique em **"Shell"** ou **"Query"**
3. Ou use a **Connection String** no Render

#### Passo 2: Executar SQL

Execute este SQL:

```sql
-- Verificar se usuário existe
SELECT email, tipo, is_active FROM users WHERE email = 'igestorphone@gmail.com';

-- Se não existir ou precisar criar/atualizar:
-- Primeiro, verificar se precisa criar
INSERT INTO users (
  email, password_hash, name, tipo, role, 
  is_active, approval_status, subscription_status, subscription_expires_at
)
VALUES (
  'igestorphone@gmail.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5K2Z9YvK8PqVW', -- senha: admin123
  'Administrador',
  'admin',
  'admin',
  true,
  'approved',
  'active',
  NOW() + INTERVAL '365 days'
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  tipo = 'admin',
  role = 'admin',
  is_active = true,
  approval_status = 'approved';
```

---

### Solução 3: Verificar Credenciais Existentes

#### Via Render Shell:

```bash
# Conectar ao banco
psql $DATABASE_URL

# Ver usuários
SELECT id, email, name, tipo, is_active, approval_status FROM users;

# Ver qual senha está configurada
SELECT email, tipo, is_active FROM users WHERE email LIKE '%igestorphone%';
```

---

## 🔍 Diagnosticar o Problema

### Verificar se Usuário Existe

No Shell do Render, execute:

```bash
psql $DATABASE_URL -c "SELECT email, tipo, is_active, approval_status FROM users WHERE email = 'igestorphone@gmail.com';"
```

**Possíveis resultados:**

1. **Nenhum resultado** = Usuário não existe → Criar (Solução 1)
2. **Existe mas `is_active = false`** = Usuário desativado → Ativar
3. **Existe mas `tipo != 'admin'`** = Não é admin → Atualizar tipo
4. **Existe mas senha errada** = Resetar senha (Solução 1)

---

## 🎯 Credenciais Padrão

Após executar o script, use:

```
Email: igestorphone@gmail.com
Senha: admin123
```

---

## ⚠️ Problemas Comuns

### Erro: "Cannot find module"

**Solução:**
```bash
# Verificar caminho
pwd
ls -la backend/src/scripts/

# Se não existir, criar diretório
mkdir -p backend/src/scripts
# Depois copiar o arquivo create-admin.js
```

### Erro: "Database connection failed"

**Solução:**
- Verifique se `DATABASE_URL` está configurada no Render
- Verifique se o banco está acessível

### Ainda não funciona após criar

**Verifique:**
1. O backend reiniciou após as mudanças?
2. Você está usando a senha correta: `admin123`?
3. O email está exatamente: `igestorphone@gmail.com`?

---

## ✅ Checklist

- [ ] Acessei o Shell do Render
- [ ] Executei o script `create-admin.js`
- [ ] Vi mensagem de sucesso
- [ ] Aguardei alguns segundos
- [ ] Tentei fazer login com:
  - Email: `igestorphone@gmail.com`
  - Senha: `admin123`
- [ ] Funcionou! ✅

---

## 🆘 Ainda Não Funciona?

Me envie:
1. O resultado do comando:
   ```bash
   psql $DATABASE_URL -c "SELECT email, tipo, is_active, approval_status FROM users WHERE email = 'igestorphone@gmail.com';"
   ```
2. Qual erro aparece no login
3. Screenshot se possível

**Vamos resolver juntos! 🔧**

