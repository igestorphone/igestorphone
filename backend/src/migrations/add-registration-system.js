import { query } from '../config/database.js';

console.log('🔄 Adicionando sistema de registro com aprovação...');

const migrations = [
  // Adicionar campos na tabela users
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS approval_status VARCHAR(50) DEFAULT 'pending'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS access_duration_days INTEGER`,
  
  // Criar tabela de tokens de registro
  `CREATE TABLE IF NOT EXISTS registration_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP,
    used_by INTEGER REFERENCES users(id) ON DELETE SET NULL
  )`,
  
  // Índices
  `CREATE INDEX IF NOT EXISTS idx_registration_tokens_token ON registration_tokens(token)`,
  `CREATE INDEX IF NOT EXISTS idx_registration_tokens_created_by ON registration_tokens(created_by)`,
  `CREATE INDEX IF NOT EXISTS idx_registration_tokens_is_used ON registration_tokens(is_used)`,
  `CREATE INDEX IF NOT EXISTS idx_users_approval_status ON users(approval_status)`,
];

async function runMigrations() {
  try {
    for (const migration of migrations) {
      console.log('Executando migração:', migration.substring(0, 50) + '...');
      await query(migration);
    }
    
    console.log('✅ Migrações do sistema de registro executadas com sucesso!');
    
    // Fechar conexão do pool
    const pool = (await import('../config/database.js')).default;
    await pool.end();
    console.log('🔌 Conexão fechada');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro durante as migrações:', error);
    process.exit(1);
  }
}

runMigrations();

