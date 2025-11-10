import { query } from './config/database.js';
import bcrypt from 'bcryptjs';

console.log('🧹 Limpando banco de dados para uso diário...');

const cleanDatabase = async () => {
  try {
    console.log('📋 Iniciando limpeza...\n');

    // 1. Limpar todos os produtos
    console.log('🗑️  Removendo produtos...');
    const productsDeleted = await query('DELETE FROM products');
    console.log(`   ✅ ${productsDeleted.rowCount || 0} produtos removidos`);

    // 2. Limpar histórico de preços
    console.log('🗑️  Removendo histórico de preços...');
    const priceHistoryDeleted = await query('DELETE FROM price_history');
    console.log(`   ✅ ${priceHistoryDeleted.rowCount || 0} registros de histórico removidos`);

    // 3. Limpar todos os fornecedores
    console.log('🗑️  Removendo fornecedores...');
    const suppliersDeleted = await query('DELETE FROM suppliers');
    console.log(`   ✅ ${suppliersDeleted.rowCount || 0} fornecedores removidos`);

    // 4. Limpar logs do sistema (mantém apenas últimos 7 dias)
    console.log('🗑️  Limpando logs antigos...');
    const logsDeleted = await query(`
      DELETE FROM system_logs 
      WHERE created_at < NOW() - INTERVAL '7 days'
    `);
    console.log(`   ✅ ${logsDeleted.rowCount || 0} logs antigos removidos`);

    // 5. Limpar logs de uso de IA (mantém apenas últimos 30 dias)
    console.log('🗑️  Limpando logs de IA antigos...');
    try {
      const aiLogsDeleted = await query(`
        DELETE FROM ai_usage_logs 
        WHERE created_at < NOW() - INTERVAL '30 days'
      `);
      console.log(`   ✅ ${aiLogsDeleted.rowCount || 0} logs de IA antigos removidos`);
    } catch (error) {
      console.log('   ⚠️  Tabela ai_usage_logs não existe ainda');
    }

    // 6. Limpar todos os usuários exceto o admin
    console.log('👤 Limpando usuários...');
    
    // Verificar se o admin existe
    const adminExists = await query(
      'SELECT id FROM users WHERE email = $1',
      ['igestorphone@gmail.com']
    );

    if (adminExists.rows.length === 0) {
      // Criar o admin se não existir
      console.log('   📝 Criando usuário admin...');
      const adminPassword = await bcrypt.hash('admin123', 10);
      await query(`
        INSERT INTO users (email, password_hash, name, role, subscription_status, subscription_expires_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        'igestorphone@gmail.com',
        adminPassword,
        'Administrador',
        'admin',
        'active',
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
        true
      ]);
      console.log('   ✅ Admin criado: igestorphone@gmail.com (senha: admin123)');
    } else {
      console.log('   ✅ Admin já existe');
    }

    // Remover todos os outros usuários
    const usersDeleted = await query(`
      DELETE FROM users 
      WHERE email != 'igestorphone@gmail.com'
    `);
    console.log(`   ✅ ${usersDeleted.rowCount || 0} usuários removidos`);

    // 7. Limpar assinaturas antigas
    console.log('🗑️  Limpando assinaturas antigas...');
    const subscriptionsDeleted = await query(`
      DELETE FROM subscriptions 
      WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'igestorphone@gmail.com')
    `);
    console.log(`   ✅ ${subscriptionsDeleted.rowCount || 0} assinaturas removidas`);

    // 8. Limpar permissões antigas
    console.log('🗑️  Limpando permissões antigas...');
    try {
      const permissionsDeleted = await query(`
        DELETE FROM user_permissions 
        WHERE user_id NOT IN (SELECT id FROM users WHERE email = 'igestorphone@gmail.com')
      `);
      console.log(`   ✅ ${permissionsDeleted.rowCount || 0} permissões removidas`);
    } catch (error) {
      console.log('   ⚠️  Tabela user_permissions não existe ainda');
    }

    // 9. Resetar sequências (opcional, mas útil)
    console.log('🔄 Resetando sequências...');
    try {
      await query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
      await query('ALTER SEQUENCE suppliers_id_seq RESTART WITH 1');
      await query('ALTER SEQUENCE products_id_seq RESTART WITH 1');
      console.log('   ✅ Sequências resetadas');
    } catch (error) {
      console.log('   ⚠️  Erro ao resetar sequências:', error.message);
    }

    // 10. Estatísticas finais
    console.log('\n📊 Estatísticas finais:');
    const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM suppliers) as suppliers,
        (SELECT COUNT(*) FROM products) as products,
        (SELECT COUNT(*) FROM price_history) as price_history
    `);
    
    console.log(`   👤 Usuários: ${stats.rows[0].users}`);
    console.log(`   🏪 Fornecedores: ${stats.rows[0].suppliers}`);
    console.log(`   📱 Produtos: ${stats.rows[0].products}`);
    console.log(`   📊 Histórico de preços: ${stats.rows[0].price_history}`);

    console.log('\n✅ Limpeza concluída com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('   1. Use a página "Processar Lista" para adicionar fornecedores via IA');
    console.log('   2. Os fornecedores serão criados automaticamente ao processar listas');
    console.log('   3. Os produtos serão validados e adicionados ao banco');
    console.log('   4. O sistema está pronto para uso diário!');

  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
    process.exit(1);
  }
};

cleanDatabase().then(() => {
  console.log('\n🎉 Sistema limpo e pronto para uso!');
  process.exit(0);
});






