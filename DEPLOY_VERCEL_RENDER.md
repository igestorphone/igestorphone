# Deploy no Vercel e no Render

## Por que não subiu nenhuma alteração?

**Vercel** e **Render** fazem deploy quando você **envia (push) as alterações para o repositório Git** conectado a eles. As mudanças da funcionalidade "Usuário do calendário" estão só no seu computador até você fazer commit e push.

## O que fazer para subir

### 1. Commitar e dar push das alterações

No terminal, na pasta do projeto:

```bash
# Ver o que mudou
git status

# Adicionar os arquivos alterados e novos
git add backend/src/middleware/auth.js backend/src/migrate.js backend/src/routes/calendar.js backend/src/routes/users.js
git add src/App.tsx src/components/ui/ProtectedRoute.tsx src/components/ui/Sidebar.tsx src/hooks/usePermissions.ts
git add src/pages/FuncionariosCalendarioPage.tsx vite.config.ts

# Commit
git commit -m "feat: usuário do calendário (funcionário só calendário) - parent_id, migração, sidebar, página criar funcionário"

# Enviar para o repositório (troque main pelo seu branch se for outro)
git push origin main
```

### 2. O que acontece depois do push

- **Vercel**: detecta o push, faz build do frontend e publica. A nova versão do site entra no ar.
- **Render**: detecta o push, faz build do backend e reinicia o serviço. Na **subida do servidor**, o backend já roda as migrações (`runMigrations()` no `server.js`), então o banco de **produção** (Neon etc.) recebe a coluna `parent_id` e fica alinhado ao código.

### 3. Migração no banco de produção

Não é preciso rodar migração à mão em produção: ao fazer deploy no Render, o backend sobe e executa as migrações no banco configurado nas variáveis de ambiente (ex.: `DATABASE_URL`). Ou seja, o mesmo banco que o Render usa já é atualizado.

## Resumo

| Onde está a alteração | O que fazer |
|------------------------|-------------|
| Só no seu PC (não commitado) | `git add` + `git commit` + `git push` |
| Já no GitHub/GitLab (push feito) | Vercel e Render fazem deploy sozinhos; migração roda no Render ao subir o backend |

Depois do push, espere alguns minutos e confira no painel da Vercel e do Render se o deploy concluiu com sucesso.
