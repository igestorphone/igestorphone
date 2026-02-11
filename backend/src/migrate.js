import { query } from './config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Iniciando migrações do banco de dados...');

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
    last_activity_at TIMESTAMP,
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

  // Colunas extras de assinatura (plan_type, valor, datas, renovação) — ADD IF NOT EXISTS para não quebrar DBs existentes
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS plan_type VARCHAR(100)`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS duration_months INTEGER`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS price DECIMAL(10,2)`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'pix'`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS start_date TIMESTAMP`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS end_date TIMESTAMP`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false`,

  // Calendário compartilhado (vendedor/atendente - eventos de venda)
  `CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time VARCHAR(5),
    client_name VARCHAR(255),
    iphone_model VARCHAR(120) NOT NULL,
    storage VARCHAR(50) NOT NULL,
    imei_end VARCHAR(20) NOT NULL,
    valor_a_vista DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_com_juros DECIMAL(12,2) NOT NULL DEFAULT 0,
    forma_pagamento VARCHAR(80) NOT NULL DEFAULT 'PIX',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'agendado'`,
  `CREATE TABLE IF NOT EXISTS calendar_event_items (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    iphone_model VARCHAR(120) NOT NULL,
    storage VARCHAR(50) NOT NULL,
    color VARCHAR(80),
    imei_end VARCHAR(20) NOT NULL,
    valor_a_vista DECIMAL(12,2) NOT NULL DEFAULT 0,
    valor_com_juros DECIMAL(12,2) NOT NULL DEFAULT 0,
    forma_pagamento VARCHAR(80) NOT NULL DEFAULT 'PIX',
    valor_troca DECIMAL(12,2),
    manutencao_descontada DECIMAL(12,2),
    notes TEXT
  )`,
  `INSERT INTO calendar_event_items (event_id, iphone_model, storage, imei_end, valor_a_vista, valor_com_juros, forma_pagamento)
   SELECT id, iphone_model, storage, imei_end, valor_a_vista, valor_com_juros, forma_pagamento
   FROM calendar_events e
   WHERE NOT EXISTS (SELECT 1 FROM calendar_event_items i WHERE i.event_id = e.id)`,
  `ALTER TABLE calendar_event_items ADD COLUMN IF NOT EXISTS modelo_troca VARCHAR(120)`,
  `ALTER TABLE calendar_event_items ADD COLUMN IF NOT EXISTS armazenamento_troca VARCHAR(50)`,
  `ALTER TABLE calendar_event_items ADD COLUMN IF NOT EXISTS troca_aparelhos JSONB DEFAULT '[]'::jsonb`,
  `ALTER TABLE calendar_event_items ADD COLUMN IF NOT EXISTS parcelas INTEGER`,
  `ALTER TABLE calendar_event_items ADD COLUMN IF NOT EXISTS valor_sinal DECIMAL(12,2)`,
  `ALTER TABLE calendar_event_items ADD COLUMN IF NOT EXISTS condicao VARCHAR(20)`,
  `ALTER TABLE calendar_event_items ADD COLUMN IF NOT EXISTS origem_produto VARCHAR(30)`,

  // Tabela de fornecedores
  `CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    whatsapp VARCHAR(30),
    city VARCHAR(120),
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

  // Tabela de sugestões de fornecedores
  `CREATE TABLE IF NOT EXISTS supplier_suggestions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    contact TEXT,
    comment TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tabela de reports de bug
  `CREATE TABLE IF NOT EXISTS bug_reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tabela de tickets de suporte (um por usuário)
  `CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tabela de listas brutas dos fornecedores
  `CREATE TABLE IF NOT EXISTS supplier_raw_lists (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    raw_list_text TEXT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Tabela de metas de melhorias
  `CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  )`,

  // Tabela de anotações
  `CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Atualizações de colunas existentes
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20)`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(120)`,

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
  `CREATE INDEX IF NOT EXISTS idx_users_last_activity_at ON users(last_activity_at)`,
  `CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
  `CREATE INDEX IF NOT EXISTS idx_price_history_product_id ON price_history(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_price_history_recorded_at ON price_history(recorded_at)`,
  `CREATE INDEX IF NOT EXISTS idx_supplier_suggestions_status ON supplier_suggestions(status)`,
  `CREATE INDEX IF NOT EXISTS idx_supplier_suggestions_created_at ON supplier_suggestions(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status)`,
  `CREATE INDEX IF NOT EXISTS idx_bug_reports_severity ON bug_reports(severity)`,
  `CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON support_tickets(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_supplier_raw_lists_supplier_id ON supplier_raw_lists(supplier_id)`,
  `CREATE INDEX IF NOT EXISTS idx_supplier_raw_lists_processed_at ON supplier_raw_lists(processed_at)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_goals_status ON goals(status)`,
  `CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)`,
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
  `CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_goals_updated_at ON goals`,
  `CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_notes_updated_at ON notes`,
  `CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events`,
  `CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets`,
  `CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
];

async function runMigrations() {
  try {
    for (const migration of migrations) {
      console.log('Executando migração...');
      await query(migration);
    }
    
    console.log('✅ Todas as migrações executadas com sucesso!');
    
    // Verificar se as tabelas foram criadas
    const result = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📊 Tabelas criadas:', result.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('❌ Erro durante as migrações:', error);
    throw error;
  }
}

// Quando executado diretamente (npm run db:migrate)
if (process.argv[1]?.includes('migrate')) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { runMigrations };












