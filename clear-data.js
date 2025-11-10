// Script para limpar dados do localStorage
// Execute este script no console do navegador (F12 -> Console)

console.log('🧹 Limpando dados do iGestorPhone...');

// Mostrar dados antes da limpeza
console.log('📊 Dados antes da limpeza:');
console.log('Fornecedores:', localStorage.getItem('fornecedores') ? 'Existem' : 'Não existem');
console.log('Processamentos:', localStorage.getItem('processamentos') ? 'Existem' : 'Não existem');
console.log('Auth:', localStorage.getItem('auth-storage') ? 'Existe' : 'Não existe');

// Limpar dados
localStorage.removeItem('fornecedores');
localStorage.removeItem('processamentos');
// Manter auth-storage para não deslogar

console.log('✅ Dados limpos com sucesso!');
console.log('📊 Dados após limpeza:');
console.log('Fornecedores:', localStorage.getItem('fornecedores') ? 'Existem' : 'Não existem');
console.log('Processamentos:', localStorage.getItem('processamentos') ? 'Existem' : 'Não existem');
console.log('Auth:', localStorage.getItem('auth-storage') ? 'Existe' : 'Não existe');

console.log('🎯 Agora você pode fazer o teste completo:');
console.log('1. Cadastrar fornecedor');
console.log('2. Processar lista');
console.log('3. Verificar em Consultar Listas');
console.log('4. Verificar no painel de IA');




