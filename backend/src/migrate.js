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

  // Recurso de Calendário removido — dropar tabelas antigas se existirem
  `DROP TABLE IF EXISTS calendar_event_items CASCADE`,
  `DROP TABLE IF EXISTS calendar_events CASCADE`,

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

  // Notificações in-app
  `CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link_url TEXT,
    target JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS user_notifications (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, notification_id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_notifications_user_read ON user_notifications(user_id, read_at)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)`,

  // Inbox WhatsApp (webhook Cloud API)
  `CREATE TABLE IF NOT EXISTS whatsapp_inbox (
    id SERIAL PRIMARY KEY,
    wa_message_id VARCHAR(255) UNIQUE,
    from_phone VARCHAR(30),
    profile_name VARCHAR(255),
    message_type VARCHAR(50) NOT NULL DEFAULT 'text',
    message_text TEXT,
    raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(40) NOT NULL DEFAULT 'new',
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_whatsapp_inbox_status_received_at ON whatsapp_inbox(status, received_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_whatsapp_inbox_from_phone ON whatsapp_inbox(from_phone)`,
  `ALTER TABLE whatsapp_inbox ADD COLUMN IF NOT EXISTS direction VARCHAR(10) DEFAULT 'inbound'`,

  // Colunas extras em products (condition_detail, variant, is_active, product_type)
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS condition_detail VARCHAR(50)`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS variant VARCHAR(50)`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`,
  `ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(50) DEFAULT 'apple'`,

  // Asaas: customer e subscription IDs
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(255)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS cpf_cnpj VARCHAR(20)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS asaas_subscription_id VARCHAR(255)`,
  `ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS asaas_pending_payment_id VARCHAR(255)`,

  // Recadastramento obrigatório (v1)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_amount DECIMAL(12,2)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_payment_date DATE`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_label VARCHAR(120)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS closed_with VARCHAR(120)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completion_version INTEGER DEFAULT 0`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed_at TIMESTAMP`,

  // Metas: quem vai fazer (Luiz, David, Victor, Todes)
  `ALTER TABLE goals ADD COLUMN IF NOT EXISTS assignees JSONB NOT NULL DEFAULT '[]'::jsonb`,

  // Avatar do perfil: ícone escolhido ou foto (base64)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type VARCHAR(20)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
  `UPDATE users SET avatar_type = 'neutral' WHERE avatar_type IS NULL`,
  `ALTER TABLE users ALTER COLUMN avatar_type SET DEFAULT 'neutral'`,

  // Atualizações de colunas existentes
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS tipo VARCHAR(50)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES users(id) ON DELETE SET NULL`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(30)`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20)`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(120)`,
  `ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS store_address VARCHAR(255)`,

  // Tabela de permissões por usuário
  `CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT true,
    PRIMARY KEY (user_id, permission_name)
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

  // Recuperação de senha (armazena hash SHA-256; o link do e-mail contém o token em claro)
  `CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id)`,

  // Sessões de login (limite simultâneo por usuário — claim `sid` no JWT)
  `CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id) WHERE revoked_at IS NULL`,
  `ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64)`,
  `ALTER TABLE user_sessions ADD COLUMN IF NOT EXISTS user_agent TEXT`,

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

  `DROP TRIGGER IF EXISTS update_support_tickets_updated_at ON support_tickets`,
  `CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  `DROP TRIGGER IF EXISTS update_whatsapp_inbox_updated_at ON whatsapp_inbox`,
  `CREATE TRIGGER update_whatsapp_inbox_updated_at BEFORE UPDATE ON whatsapp_inbox FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Números de WhatsApp dos fornecedores (múltiplos por fornecedor)
  `CREATE TABLE IF NOT EXISTS supplier_whatsapp_numbers (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    phone_number VARCHAR(30) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supplier_id, phone_number)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_supplier_whatsapp_phone ON supplier_whatsapp_numbers(phone_number)`,
  `CREATE INDEX IF NOT EXISTS idx_supplier_whatsapp_supplier ON supplier_whatsapp_numbers(supplier_id)`,
  `DROP TRIGGER IF EXISTS update_supplier_whatsapp_numbers_updated_at ON supplier_whatsapp_numbers`,
  `CREATE TRIGGER update_supplier_whatsapp_numbers_updated_at BEFORE UPDATE ON supplier_whatsapp_numbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Tabela de tokens de cadastro (links de convite gerados pelo admin)
  `CREATE TABLE IF NOT EXISTS registration_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Trial: link grátis com grace individual
  `ALTER TABLE registration_tokens ADD COLUMN IF NOT EXISTS trial_days INTEGER`,
  `ALTER TABLE registration_tokens ADD COLUMN IF NOT EXISTS trial_grace_days INTEGER`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_grace_days INTEGER`,

  // Sistema de aprovação/acesso (usado no login e no cadastro por convite)
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS access_duration_days INTEGER`,

  // ===== Controle de TI / Dev Log (admin) =====
  // Backlog de tarefas de desenvolvimento
  `CREATE TABLE IF NOT EXISTS dev_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    target_version VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_dev_tasks_status ON dev_tasks(status)`,
  `DROP TRIGGER IF EXISTS update_dev_tasks_updated_at ON dev_tasks`,
  `CREATE TRIGGER update_dev_tasks_updated_at BEFORE UPDATE ON dev_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,

  // Versões/releases entregues (changelog)
  `CREATE TABLE IF NOT EXISTS dev_releases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    version VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    description TEXT,
    released_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE dev_releases ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false`,
  `CREATE INDEX IF NOT EXISTS idx_dev_releases_released_at ON dev_releases(released_at DESC)`,

  // Anotações livres de desenvolvimento (ideias, links, credenciais de teste)
  `CREATE TABLE IF NOT EXISTS dev_notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `DROP TRIGGER IF EXISTS update_dev_notes_updated_at ON dev_notes`,
  `CREATE TRIGGER update_dev_notes_updated_at BEFORE UPDATE ON dev_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`,
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












