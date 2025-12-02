# 🚀 Notas de Deploy - Sistema de Registro

## ✅ Código Enviado

- ✅ Commit feito: `d274fc8`
- ✅ Push para `origin/main` concluído
- ✅ 18 arquivos alterados
- ✅ 1.864 linhas adicionadas

---

## ⚠️ Ações Necessárias Após Deploy

### 1. **Executar Migração do Banco de Dados em Produção**

A migração precisa ser executada no servidor de produção também!

**No Render/Railway/Heroku:**

#### Opção A: Via Console do Serviço
1. Acesse o dashboard do seu serviço de backend
2. Abra o **console/shell**
3. Execute:
```bash
node backend/src/migrations/add-registration-system.js
```

#### Opção B: Adicionar ao Script de Build
Se você tiver acesso ao código do deploy, pode adicionar a migração no processo de build.

---

### 2. **Verificar Variáveis de Ambiente**

Certifique-se de que estas variáveis estão configuradas:

**Backend:**
- `DATABASE_URL` - URL do banco de dados
- `JWT_SECRET` - Chave secreta
- `NODE_ENV=production`
- `FRONTEND_URL` - URL do frontend (para gerar links corretos)

**Frontend:**
- `VITE_API_URL` - URL da API backend

---

### 3. **Verificar se Deploy Automático Está Funcionando**

#### Render:
- O deploy automático geralmente acontece automaticamente após push
- Verifique em: Dashboard → Deployments

#### Vercel:
- Deploy automático após push na branch main
- Verifique em: Dashboard → Deployments

---

## 🧪 Testar Após Deploy

### 1. Verificar Backend
```bash
curl https://seu-backend.com/api/health
```

### 2. Testar Rotas de Registro
```bash
# Verificar se rota existe (deve retornar 404 para token inválido, mas não erro de rota)
curl https://seu-backend.com/api/register/test-token
```

### 3. Testar no Frontend
1. Acesse o site em produção
2. Faça login como admin
3. Vá em "Gerenciar Usuários"
4. Verifique se aparecem as 3 abas: Usuários | Links | Pendentes

---

## 🐛 Problemas Comuns

### Erro: "Tabela registration_tokens não existe"
**Solução:** Execute a migração do banco de dados (veja acima)

### Links não funcionam
**Solução:** Verifique se `FRONTEND_URL` está configurado corretamente no backend

### Erro ao gerar link
**Solução:** Verifique logs do backend para ver erro específico

---

## 📝 Checklist de Deploy

- [ ] Código enviado para repositório ✅
- [ ] Deploy automático iniciado (verificar dashboard)
- [ ] Migração do banco executada em produção
- [ ] Variáveis de ambiente configuradas
- [ ] Backend respondendo corretamente
- [ ] Frontend carregando sem erros
- [ ] Teste de gerar link funcionando
- [ ] Teste de registro funcionando
- [ ] Teste de aprovação funcionando

---

## 🎯 Próximos Passos

1. Aguardar deploy automático completar
2. Executar migração no banco de produção
3. Testar fluxo completo:
   - Gerar link
   - Registrar usuário
   - Aprovar usuário
4. Verificar logs em caso de problemas

---

**Deploy iniciado! 🚀**

