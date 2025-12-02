# 📋 Guia do Sistema de Registro e Aprovação de Usuários

## ✅ Status da Implementação

Todas as funcionalidades foram implementadas e a migração do banco de dados foi executada com sucesso!

## 🎯 Funcionalidades Implementadas

### 1. **Geração de Links de Cadastro**
- Admin pode gerar links únicos de cadastro
- Links têm validade configurável (dias)
- Lista de todos os links gerados com status

### 2. **Registro via Link**
- Usuário acessa link público e se cadastra
- Não precisa conhecer senha do admin
- Cadastro fica pendente de aprovação

### 3. **Aprovação de Usuários**
- Admin vê lista de usuários pendentes
- Define período de acesso: 5 dias (demo), 30 dias, 90 dias ou 1 ano
- Usuário é ativado automaticamente após aprovação

## 🚀 Como Usar

### Passo 1: Gerar Link de Cadastro

1. Faça login como **Administrador**
2. Acesse: **Gerenciar Usuários** (menu lateral)
3. Clique na aba **"Links de Cadastro"**
4. Clique em **"Gerar Link"**
5. Defina quantos dias o link será válido (padrão: 7 dias)
6. Clique em **"Gerar Link"**
7. Copie o link gerado e compartilhe com o usuário

### Passo 2: Usuário se Cadastra

1. Usuário acessa o link recebido (ex: `http://seusite.com/register/abc123...`)
2. Preenche o formulário:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
3. Clica em **"Cadastrar"**
4. Recebe mensagem: "Cadastro realizado! Aguarde aprovação do administrador."

### Passo 3: Aprovar Usuário

1. Como admin, vá em **Gerenciar Usuários**
2. Clique na aba **"Pendentes"** (badge com número de pendentes)
3. Você verá a lista de usuários aguardando aprovação
4. Clique em **"Aprovar"** no usuário desejado
5. Escolha o período de acesso:
   - **5 dias** - Demonstração
   - **30 dias** - Mensal
   - **90 dias** - Trimestral
   - **1 ano** - Anual
6. Clique em **"Aprovar"**
7. Usuário é ativado e pode fazer login!

## 📊 Estrutura do Banco de Dados

### Tabela: `registration_tokens`
Armazena os links de cadastro gerados:
- `id` - ID único
- `token` - Token único do link
- `created_by` - Admin que criou o link
- `created_at` - Data de criação
- `expires_at` - Data de expiração
- `is_used` - Se já foi usado
- `used_at` - Quando foi usado
- `used_by` - Usuário que usou

### Campos Adicionados em `users`:
- `approval_status` - Status de aprovação (pending/approved/rejected)
- `access_expires_at` - Quando o acesso expira
- `access_duration_days` - Duração do acesso em dias

## 🔐 Segurança

- Links são únicos e não podem ser reutilizados
- Links expiram automaticamente
- Senhas são hasheadas (bcrypt)
- Admin não vê senha dos usuários
- Aprovação é obrigatória antes do acesso

## 🛠️ Rotas da API

### Admin (Autenticado)
- `POST /api/registration-links` - Gerar link
- `GET /api/registration-links` - Listar links
- `GET /api/users/pending` - Listar pendentes
- `POST /api/users/:id/approve` - Aprovar usuário

### Público
- `GET /api/register/:token` - Verificar token
- `POST /api/register/:token` - Registrar usuário

## 📝 Exemplo de Uso

### Fluxo Completo:

1. **Admin gera link:**
   ```
   POST /api/registration-links
   Body: { expiresInDays: 7 }
   
   Response: {
     data: {
       url: "http://localhost:3000/register/abc123...",
       expiresAt: "2024-01-15T10:00:00Z"
     }
   }
   ```

2. **Usuário acessa e se cadastra:**
   ```
   POST /api/register/abc123...
   Body: {
     name: "João Silva",
     email: "joao@email.com",
     password: "senha123"
   }
   ```

3. **Admin aprova:**
   ```
   POST /api/users/123/approve
   Body: { durationDays: 30 }
   ```

4. **Usuário pode fazer login normalmente!**

## 🎨 Interface

### Aba "Usuários"
- Lista todos os usuários cadastrados
- Filtros e busca
- Editar/Excluir usuários

### Aba "Links de Cadastro"
- Lista todos os links gerados
- Mostra status (Válido/Usado/Expirado)
- Botão para copiar link
- Botão para gerar novo link

### Aba "Pendentes"
- Lista usuários aguardando aprovação
- Badge com contador
- Botão para aprovar cada usuário
- Modal para escolher período

## ⚠️ Observações Importantes

1. **Migração já executada** - O banco já foi atualizado
2. **Links não reutilizáveis** - Cada link só pode ser usado uma vez
3. **Aprovação obrigatória** - Usuário não pode fazer login até ser aprovado
4. **Período configuravel** - Escolha entre 5, 30, 90 ou 365 dias
5. **Acesso expira automaticamente** - Baseado no período definido

## 🐛 Troubleshooting

### Link não funciona
- Verifique se o link não expirou
- Verifique se o link já foi usado
- Verifique se o token está correto

### Usuário não aparece nos pendentes
- Verifique se o cadastro foi concluído
- Verifique o campo `approval_status` no banco
- Verifique os logs do servidor

### Erro ao aprovar
- Verifique se você é admin
- Verifique se o usuário está realmente pendente
- Verifique os logs do servidor

## 📞 Suporte

Para problemas ou dúvidas, verifique:
1. Logs do servidor backend
2. Console do navegador (F12)
3. Banco de dados diretamente

---

**Sistema implementado com sucesso! ✅**

