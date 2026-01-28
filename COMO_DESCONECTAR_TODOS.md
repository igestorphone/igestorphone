# 🔐 Como Desconectar Todos os Usuários

## 🎯 Objetivo:
Desconectar todos os usuários do sistema para garantir que usuários excluídos não estejam mais usando o sistema.

## 🚀 Método 1: Via API (Recomendado - Funciona no Render)

### Passo 1: Fazer Login como Admin
1. Acesse o sistema e faça login com uma conta admin

### Passo 2: Abrir Console do Navegador
1. Pressione `F12` ou `Cmd + Option + I` (Mac) / `Ctrl + Shift + I` (Windows)
2. Vá na aba **"Console"**

### Passo 3: Executar Comando
Cole e execute este código no console:

```javascript
fetch('/api/users/force-logout-all', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + JSON.parse(localStorage.getItem('auth-storage')).state.token
  }
})
.then(res => res.json())
.then(data => {
  console.log('✅ Sucesso:', data);
  alert('Todos os usuários foram desconectados!');
})
.catch(err => {
  console.error('❌ Erro:', err);
  alert('Erro ao desconectar usuários');
});
```

### Ou usar curl no Terminal:
```bash
# Primeiro, pegue seu token do localStorage do navegador
# Depois execute:
curl -X POST https://SEU_DOMINIO.onrender.com/api/users/force-logout-all \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json"
```

---

## 🚀 Método 2: Via Script Local (Se tiver acesso ao banco)

### No Terminal:
```bash
cd /Users/MAC/igestorphone
npm run users:force-logout-all
```

**Nota:** Este método só funciona se você tiver acesso direto ao banco de dados.

---

## 🚀 Método 3: Via Interface Admin (Futuro)

Você pode adicionar um botão na página de administração de usuários que chama essa API.

---

## ✅ O que acontece:

1. **Todos os usuários** têm `last_activity_at` atualizado para 365 dias atrás
2. **Próxima requisição** de qualquer usuário retornará **401 "Sessão expirada por inatividade"**
3. **Frontend** detecta o 401 e faz logout automático
4. **Usuários são redirecionados** para a página de login

## 🔍 Verificar se funcionou:

1. Faça login com uma conta de teste
2. Aguarde alguns segundos
3. Tente fazer qualquer ação (navegar, buscar, etc.)
4. Você deve ser desconectado automaticamente

---

## 📝 Nota de Segurança:

- ⚠️ Esta ação desconecta **TODOS** os usuários, incluindo você
- ✅ Você precisará fazer login novamente após executar
- ✅ A ação é registrada nos logs do sistema
- ✅ Apenas admins podem executar esta ação

---

**Última atualização:** $(date)
