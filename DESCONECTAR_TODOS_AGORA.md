# 🔐 Desconectar Todos os Usuários AGORA

## ⚠️ Situação:
O script não conseguiu executar localmente por falta de conectividade com o banco. Mas você pode fazer isso de 2 formas:

---

## 🚀 Método 1: Via Console do Navegador (MAIS RÁPIDO)

### Passo a Passo:

1. **Acesse o sistema** (https://seu-dominio.onrender.com)
2. **Faça login** como admin
3. **Abra o Console do Navegador:**
   - Mac: `Cmd + Option + I`
   - Windows: `F12` ou `Ctrl + Shift + I`
   - Vá na aba **"Console"**

4. **Cole e execute este código:**

```javascript
// Pegar token do localStorage
const authData = JSON.parse(localStorage.getItem('auth-storage'));
const token = authData.state.token;

// Chamar API para desconectar todos
fetch('/api/users/force-logout-all', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Sucesso!', data);
  alert(`✅ Todos os usuários foram desconectados!\n\nUsuários afetados: ${data.affected_users}`);
  // Você será desconectado também, então redirecionar para login
  setTimeout(() => {
    window.location.href = '/login';
  }, 2000);
})
.catch(err => {
  console.error('❌ Erro:', err);
  alert('❌ Erro ao desconectar usuários. Verifique o console.');
});
```

5. **Pressione Enter** e aguarde a mensagem de sucesso

---

## 🚀 Método 2: Via SQL Direto no Banco (Se tiver acesso)

Se você tem acesso ao banco de dados Neon/PostgreSQL:

```sql
-- Desconectar todos os usuários
UPDATE users 
SET last_activity_at = NOW() - INTERVAL '365 days';

-- Verificar quantos foram afetados
SELECT COUNT(*) as usuarios_desconectados 
FROM users 
WHERE last_activity_at < NOW() - INTERVAL '15 minutes';
```

---

## 🚀 Método 3: Via curl no Terminal

```bash
# Primeiro, pegue seu token:
# 1. Abra o navegador, faça login
# 2. Abra Console (F12)
# 3. Execute: JSON.parse(localStorage.getItem('auth-storage')).state.token
# 4. Copie o token

# Depois execute:
curl -X POST https://SEU_DOMINIO.onrender.com/api/users/force-logout-all \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

---

## ✅ O que acontece após desconectar:

1. **Todos os usuários** têm `last_activity_at` = 365 dias atrás
2. **Próxima requisição** de qualquer usuário → **401 "Sessão expirada"**
3. **Frontend detecta** e faz logout automático
4. **Todos são redirecionados** para `/login`

## ⚠️ Importante:

- **Você também será desconectado** após executar
- **Precisa fazer login novamente**
- **Ação é registrada** nos logs do sistema
- **Apenas admins** podem executar

---

## 🔍 Verificar se funcionou:

1. Faça login novamente
2. Tente acessar qualquer página
3. Se funcionar, está tudo certo
4. Outros usuários serão desconectados na próxima ação deles

---

**Recomendação:** Use o **Método 1** (Console do Navegador) - é o mais rápido e fácil!
