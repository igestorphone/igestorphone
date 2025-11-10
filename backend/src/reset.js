import { query } from './config/database.js';

console.log('🔄 Resetando banco de dados...');

const resetDatabase = async () => {
  try {
    // Confirmar reset
    console.log('⚠️  ATENÇÃO: Esta operação irá DELETAR TODOS os dados!');
    console.log('⚠️  Certifique-se de ter um backup antes de continuar.');
    
    // Aguardar confirmação (em produção, remover esta parte)
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Reset não permitido em produção');
      process.exit(1);
    }

    // Deletar todas as tabelas em ordem (respeitando foreign keys)
    const tables = [
      'system_logs',
      'price_history', 
      'products',
      'subscriptions',
      'users',
      'suppliers',
      'settings'
    ];

    console.log('🗑️  Deletando tabelas...');
    
    for (const table of tables) {
      try {
        await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Tabela ${table} deletada`);
      } catch (error) {
        console.log(`⚠️  Erro ao deletar ${table}:`, error.message);
      }
    }

    // Deletar funções
    console.log('🗑️  Deletando funções...');
    try {
      await query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE');
      console.log('✅ Função update_updated_at_column deletada');
    } catch (error) {
      console.log('⚠️  Erro ao deletar função:', error.message);
    }

    // Recriar banco
    console.log('🔄 Recriando banco...');
    
    // Executar migrações
    const migrations = [
      // Tabela de usuários
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        subscription_status VARCHAR(50) DEFAULT 'trial',
        subscription_expires_at TIMESTAMP,
        stripe_customer_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true
      )`,

      // Tabela de assinaturas
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        plan_name VARCHAR(100) NOT NULL,
        status VARCHAR(50) NOT NULL,
        stripe_subscription_id VARCHAR(255),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de fornecedores
      `CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        website VARCHAR(255),
        api_endpoint VARCHAR(500),
        api_key VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de produtos
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(100),
        color VARCHAR(50),
        storage VARCHAR(20),
        condition VARCHAR(50),
        price DECIMAL(10,2),
        stock_quantity INTEGER DEFAULT 0,
        sku VARCHAR(100),
        image_url VARCHAR(500),
        specifications JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de preços históricos
      `CREATE TABLE IF NOT EXISTS price_history (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
        price DECIMAL(10,2) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de logs de sistema
      `CREATE TABLE IF NOT EXISTS system_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        details JSONB,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Tabela de configurações
      `CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // Índices para performance
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status)`,
      `CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id)`,
      `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
      `CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id)`,
      `CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at)`,
      `CREATE INDEX IF NOT EXISTS idx_system_logs_user_id ON system_logs(user_id)`,
      `CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at)`,

      // Trigger para atualizar updated_at automaticamente
      `CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ language 'plpgsql'`,

      `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
      `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions`,
      `CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers`,
      `CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_products_updated_at ON products`,
      `CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

      `DROP TRIGGER IF EXISTS update_settings_updated_at ON settings`,
      `CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    ];

    for (const migration of migrations) {
      await query(migration);
    }

    console.log('✅ Banco recriado com sucesso!');
    console.log('💡 Execute "npm run db:seed" para popular com dados iniciais');

  } catch (error) {
    console.error('❌ Erro durante o reset:', error);
    process.exit(1);
  }
};

resetDatabase();












