import { query } from './config/database.js';
import bcrypt from 'bcryptjs';

console.log('🌱 Populando banco com dados iniciais...');

const seedData = async () => {
  try {
    // Verificar se já existem dados
    const userCount = await query('SELECT COUNT(*) FROM users');
    if (userCount.rows[0].count > 0) {
      console.log('⚠️  Banco já possui dados, pulando seed...');
      return;
    }

    // Criar usuário administrador
    const adminPassword = await bcrypt.hash('admin123', 10);
    await query(`
      INSERT INTO users (email, password_hash, name, role, subscription_status, subscription_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'admin@igestorphone.com',
      adminPassword,
      'Administrador',
      'admin',
      'active',
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
    ]);

    // Criar usuário de teste
    const testPassword = await bcrypt.hash('test123', 10);
    await query(`
      INSERT INTO users (email, password_hash, name, role, subscription_status, subscription_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      'teste@igestorphone.com',
      testPassword,
      'Usuário Teste',
      'user',
      'trial',
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    ]);

    // Criar fornecedores de exemplo
    await query(`
      INSERT INTO suppliers (name, contact_email, contact_phone, website, is_active)
      VALUES 
        ($1, $2, $3, $4, $5),
        ($6, $7, $8, $9, $10),
        ($11, $12, $13, $14, $15)
    `, [
      'Apple Store Oficial', 'contato@applestore.com', '(11) 99999-9999', 'https://apple.com', true,
      'TechStore Brasil', 'vendas@techstore.com.br', '(11) 88888-8888', 'https://techstore.com.br', true,
      'iStore Premium', 'contato@istore.com.br', '(11) 77777-7777', 'https://istore.com.br', true
    ]);

    // Criar produtos de exemplo
    const suppliers = await query('SELECT id FROM suppliers LIMIT 3');
    
    for (let i = 0; i < suppliers.rows.length; i++) {
      const supplierId = suppliers.rows[i].id;
      
      // iPhone 15 Pro Max
      await query(`
        INSERT INTO products (supplier_id, name, model, color, storage, condition, price, stock_quantity, sku, specifications)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        supplierId,
        'iPhone 15 Pro Max',
        'A3108',
        'Titanium Natural',
        '256GB',
        'Novo',
        8999.00 + (i * 200),
        10 + i,
        `IPH15PM-256-TN-${supplierId}`,
        JSON.stringify({
          screen: '6.7" Super Retina XDR',
          processor: 'A17 Pro',
          camera: '48MP + 12MP + 12MP',
          battery: '4422 mAh',
          os: 'iOS 17'
        })
      ]);

      // iPhone 15 Pro
      await query(`
        INSERT INTO products (supplier_id, name, model, color, storage, condition, price, stock_quantity, sku, specifications)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        supplierId,
        'iPhone 15 Pro',
        'A3106',
        'Titanium Blue',
        '128GB',
        'Novo',
        7999.00 + (i * 150),
        15 + i,
        `IPH15P-128-TB-${supplierId}`,
        JSON.stringify({
          screen: '6.1" Super Retina XDR',
          processor: 'A17 Pro',
          camera: '48MP + 12MP + 12MP',
          battery: '3274 mAh',
          os: 'iOS 17'
        })
      ]);

      // iPhone 15
      await query(`
        INSERT INTO products (supplier_id, name, model, color, storage, condition, price, stock_quantity, sku, specifications)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        supplierId,
        'iPhone 15',
        'A3102',
        'Pink',
        '128GB',
        'Novo',
        6999.00 + (i * 100),
        20 + i,
        `IPH15-128-PK-${supplierId}`,
        JSON.stringify({
          screen: '6.1" Super Retina XDR',
          processor: 'A16 Bionic',
          camera: '48MP + 12MP',
          battery: '3349 mAh',
          os: 'iOS 17'
        })
      ]);
    }

    // Criar histórico de preços para os últimos 30 dias
    const products = await query('SELECT id, price FROM products');
    
    for (const product of products.rows) {
      for (let days = 0; days < 30; days++) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        
        // Variação de preço de -5% a +5%
        const variation = (Math.random() - 0.5) * 0.1;
        const newPrice = product.price * (1 + variation);
        
        await query(`
          INSERT INTO price_history (product_id, supplier_id, price, recorded_at)
          SELECT $1, supplier_id, $2, $3
          FROM products WHERE id = $1
        `, [product.id, newPrice, date]);
      }
    }

    // Criar configurações iniciais
    await query(`
      INSERT INTO settings (key, value, description)
      VALUES 
        ($1, $2, $3),
        ($4, $5, $6),
        ($7, $8, $9),
        ($10, $11, $12)
    `, [
      'app_name', JSON.stringify('iGestorPhone'), 'Nome da aplicação',
      'subscription_plans', JSON.stringify({
        trial: { name: 'Trial', price: 0, duration_days: 30, features: ['basic_search', 'price_tracking'] },
        basic: { name: 'Básico', price: 29.90, duration_days: 30, features: ['advanced_search', 'price_alerts', 'supplier_management'] },
        premium: { name: 'Premium', price: 59.90, duration_days: 30, features: ['all_features', 'api_access', 'priority_support'] }
      }), 'Planos de assinatura disponíveis',
      'price_update_interval', JSON.stringify(3600), 'Intervalo de atualização de preços (segundos)',
      'max_products_per_user', JSON.stringify(1000), 'Máximo de produtos por usuário'
    ]);

    console.log('✅ Dados iniciais inseridos com sucesso!');
    console.log('👤 Usuários criados:');
    console.log('   - admin@igestorphone.com (senha: admin123)');
    console.log('   - teste@igestorphone.com (senha: test123)');
    console.log('🏪 Fornecedores: 3 criados');
    console.log('📱 Produtos: 9 criados (3 por fornecedor)');
    console.log('📊 Histórico de preços: 30 dias gerados');
    console.log('⚙️  Configurações: Iniciais definidas');

  } catch (error) {
    console.error('❌ Erro ao popular banco:', error);
    process.exit(1);
  }
};

seedData();












