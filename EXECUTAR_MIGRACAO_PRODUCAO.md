# 🚀 Executar Migração em Produção - Rápido

## ⚠️ Problema
A tela de "Pendentes" está dando erro 500 porque a coluna `approval_status` não existe no banco de dados em produção.

## ✅ Solução Rápida

### Opção 1: Via Render Shell (Recomendado)

1. **Acesse o Render Dashboard:**
   - Vá para https://dashboard.render.com
   - Encontre o serviço do backend (API)

2. **Abra o Shell:**
   - Clique no serviço
   - Vá na aba "Shell"
   - Ou use o botão "Shell" no dashboard

3. **Execute a migração:**
   ```bash
   cd backend
   node src/migrations/add-registration-system.js
   ```

4. **Verifique se funcionou:**
   - Você deve ver: `✅ Migrações do sistema de registro executadas com sucesso!`

### Opção 2: Via SQL Direto no Banco

Se você tem acesso ao banco de dados PostgreSQL, execute:

```sql
-- Adicionar colunas na tabela users
ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS access_duration_days INTEGER;

-- Criar tabela de tokens de registro
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens(token);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_created_by ON registration_tokens(created_by);
CREATE INDEX IF NOT EXISTS idx_registration_tokens_is_used ON registration_tokens(is_used);
CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status);
```

## 🔍 Como Verificar

Depois de executar a migração, verifique:

```sql
-- Verificar se as colunas foram criadas
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('approval_status', 'access_expires_at', 'access_duration_days');

-- Verificar se a tabela foi criada
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'registration_tokens';
```

## ✅ Depois da Migração

1. Recarregue a página de "Pendentes"
2. O erro 500 deve desaparecer
3. Os usuários pendentes devem aparecer corretamente

## 📞 Precisa de Ajuda?

Se ainda tiver problemas, verifique os logs do backend no Render para ver o erro exato.

