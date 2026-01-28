// Script para executar no Console do Navegador
// Cole e execute no Console (F12) quando estiver logado como admin

(async function() {
  try {
    // Pegar token do localStorage
    const authData = JSON.parse(localStorage.getItem('auth-storage'));
    
    if (!authData || !authData.state || !authData.state.token) {
      alert('❌ Você precisa estar logado!');
      return;
    }
    
    const token = authData.state.token;
    
    console.log('🔐 Token encontrado, desconectando todos os usuários...');
    
    // Chamar API para desconectar todos
    const response = await fetch('/api/users/force-logout-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erro ao desconectar usuários');
    }
    
    const data = await response.json();
    
    console.log('✅ Sucesso!', data);
    alert(`✅ Todos os usuários foram desconectados!\n\nUsuários afetados: ${data.affected_users || 'N/A'}\n\nVocê será desconectado em 3 segundos...`);
    
    // Desconectar você também após 3 segundos
    setTimeout(() => {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    alert('❌ Erro ao desconectar usuários:\n\n' + error.message + '\n\nVerifique o console para mais detalhes.');
  }
})();
